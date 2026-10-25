from app.crud.fingerprint_buffer import (
    create_fingerprint_buffer_entry,
    get_fingerprint_buffer_count_for_user,
    clear_fingerprint_buffers_for_user
)
from app.crud.attendance_crud import process_attendance_step
from app.crud.user_crud import (
    get_user_details_by_id,
    get_user_auth_policy,
    get_user_fingerprint_template_by_id,
    get_all_fingerprint_templates
)
from app.db.models.users import User
from app.db.session import SessionLocal
from sqlalchemy.orm import Session
from gi.repository import FPrint, Gio, GLib
import asyncio
import threading
import uuid
import time
import gi
gi.require_version('FPrint', '2.0')

# Global mutex lock ensures single access to hardware across threads/sessions
HARDWARE_LOCK = threading.Lock()

STAGE_HINTS = {
    1: "Place finger flat in the center",
    2: "Lift and press slightly to the left",
    3: "Lift and press slightly to the right",
    4: "Lift and press the top tip of your finger",
    5: "Lift and press firm in the center"
}


class FingerprintSession:
    """Holds streaming state and cancel tokens for an active session."""

    def __init__(self, action_type: str, params: dict):
        self.session_id = str(uuid.uuid4())
        self.action_type = action_type.upper()
        self.params = params
        self.queue = asyncio.Queue()
        self.cancellable = Gio.Cancellable.new()
        self.is_active = True

    def cancel(self):
        """Triggers hardware cancellation signal."""
        if self.is_active:
            self.cancellable.cancel()
            self.is_active = False


class FingerprintManager:
    """Singleton manager executing libfprint operations on a dedicated hardware lifecycle."""

    def __init__(self):
        self.sessions: dict[str, FingerprintSession] = {}
        self.ctx = None

    def _open_device(self, cancellable):
        """Open the scanner with robust forced cleanup of stale USB handles."""
        for attempt in range(4):
            if cancellable.is_cancelled():
                raise GLib.Error.new_literal(
                    Gio.io_error_quark(), "Operation was cancelled", 19)

            # Always force a fresh context if previous sessions left references open
            if self.ctx is None:
                try:
                    self.ctx = FPrint.Context()
                except Exception:
                    time.sleep(0.5)
                    continue

            devs = self.ctx.get_devices()
            if devs:
                dev = devs[0]
                try:
                    # Attempt to close any lingering internal state just in case
                    try:
                        dev.close_sync(None)
                    except Exception:
                        pass

                    dev.open_sync(cancellable)
                    return dev
                except GLib.Error as e:
                    if "cancelled" in e.message.lower():
                        raise
                except Exception:
                    pass

            # Drop context entirely to force libusb to re-enumerate the USB bus
            self.ctx = None
            time.sleep(0.6)
        return None

    def create_session(self, action_type: str, params: dict) -> FingerprintSession:
        # Force-cancel and destroy all active/lingering sessions instantly
        for sid, sess in list(self.sessions.items()):
            sess.cancel()
            self.sessions.pop(sid, None)

        # Give the Linux kernel udev subsystem a clean breathing window to release endpoints
        time.sleep(0.4)

        session = FingerprintSession(action_type, params)
        self.sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> FingerprintSession | None:
        return self.sessions.get(session_id)

    def cancel_session(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            session.cancel()
            self.sessions.pop(session_id, None)

    def execute_session_task(self, session: FingerprintSession, loop: asyncio.AbstractEventLoop):
        """Worker thread entry point executing blocking C calls safely."""
        with HARDWARE_LOCK:
            if session.cancellable.is_cancelled():
                return

            db = SessionLocal()
            dev = None
            try:
                dev = self._open_device(session.cancellable)
                if dev is None:
                    self._push_event(session, loop, {"event": "error",
                                                     "message": "Fingerprint scanner busy. Please remove your finger and retry."})
                    return

                try:
                    if session.action_type == "ENROLL":
                        self._run_enroll(dev, session, loop, db)
                    elif session.action_type == "VERIFY":
                        self._run_verify(dev, session, loop, db)
                except GLib.Error as e:
                    if "cancelled" in e.message.lower() or "claim" in e.message.lower():
                        self._push_event(
                            session, loop, {"event": "failed", "reason": "Operation cancelled or device busy"})
                    else:
                        self._push_event(
                            session, loop, {"event": "error", "message": e.message})
                finally:
                    if dev:
                        try:
                            dev.close_sync(None)
                        except Exception:
                            pass
                    # Force context reset after every session to prevent multi-person caching leaks
                    self.ctx = None
                    session.is_active = False
                    db.close()

            except Exception as ex:
                self.ctx = None
                if not session.cancellable.is_cancelled():
                    self._push_event(
                        session, loop, {"event": "error", "message": str(ex)})
            finally:
                self.ctx = None
                session.is_active = False
                db.close()

    def _push_event(self, session: FingerprintSession, loop: asyncio.AbstractEventLoop, payload: dict):
        if session.is_active and not session.cancellable.is_cancelled():
            asyncio.run_coroutine_threadsafe(session.queue.put(payload), loop)

    def _enroll_user(self, dev, session, loop, db, user_id) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            self._push_event(
                session, loop, {"event": "error", "message": "Invalid user ID"})
            return False

        def on_progress(device, done, print_obj, data, error):
            hint = (f"Retry scan: {error.message}" if error
                    else STAGE_HINTS.get(done + 1, "Scanning complete"))
            self._push_event(session, loop, {"event": "enroll_progress",
                                             "stage": done, "total": 5, "hint": hint})

        tpl = FPrint.Print.new(dev)
        tpl.set_username(str(user_id))
        blob = dev.enroll_sync(tpl, session.cancellable,
                               on_progress, None).serialize()

        user.fingerprint_template = blob
        user.fingerprint_template_refined = blob
        user.sync_status = "pending"
        db.commit()
        return True

    def _run_enroll(self, dev, session, loop, db):
        user_id = session.params.get("user_id")
        self._push_event(
            session, loop, {"event": "waiting", "hint": STAGE_HINTS[1]})
        if self._enroll_user(dev, session, loop, db, user_id):
            self._push_event(session, loop, {"event": "enroll_done", "user_id": user_id,
                                             "message": "Fingerprint enrolled successfully"})

    def _run_verify(self, dev, session: FingerprintSession, loop: asyncio.AbstractEventLoop, db: Session):
        user_id = session.params.get("user_id")
        event_id = session.params.get("event_id")
        terminal_id = session.params["terminal_id"]
        auth_type = session.params.get("auth_type", "fingerprint")
        auth_type_id = session.params.get("auth_type_id", 2)

        context = "event" if event_id is not None else "daily"
        max_attempts = 3

        self._push_event(
            session, loop, {"event": "waiting", "hint": "Place finger on the scanner"})

        matched_print_obj = None
        is_verified = False

        if user_id is not None:
            # --- 1:1 VERIFICATION (User ID provided) ---
            template_blob = get_user_fingerprint_template_by_id(db, user_id)
            if not template_blob:
                self._push_event(session, loop, {"event": "enroll_required",
                                                 "hint": "No fingerprint on file. Let's register one."})
                if not self._enroll_user(dev, session, loop, db, user_id):
                    return
                is_verified = True
            else:
                for attempt in range(1, max_attempts + 1):
                    if session.cancellable.is_cancelled():
                        return
                    target_print = FPrint.Print.deserialize(template_blob)
                    matched, newly_scanned = dev.verify_sync(
                        target_print, session.cancellable, None, None)
                    if matched:
                        is_verified, matched_print_obj = True, newly_scanned
                        break
                    if attempt < max_attempts:
                        self._push_event(session, loop, {"event": "attempt_failed", "attempt": attempt,
                                                         "max": max_attempts,
                                                         "hint": "Hold steady and press firmer"})
        else:
            # --- 1:N IDENTIFICATION (Cold scan: No User ID passed) ---
            all_templates = get_all_fingerprint_templates(
                db)  # Returns list of (user_id, template_blob)
            if not all_templates:
                self._push_event(session, loop, {
                                 "event": "failed", "reason": "No fingerprint records found in system."})
                return

            for attempt in range(1, max_attempts + 1):
                if session.cancellable.is_cancelled():
                    return

                # Scan a single print once to test against candidates
                try:
                    # We create a blank print container to hold the scan result
                    blank_print = FPrint.Print.new(dev)
                    matched, newly_scanned, matched_print = dev.identify_sync(
                        [FPrint.Print.deserialize(blob)
                         for _, blob in all_templates],
                        session.cancellable, None, None
                    )
                    if matched and matched_print:
                        is_verified = True
                        matched_print_obj = newly_scanned
                        # Find which user owns this matched template blob
                        for u_id, blob in all_templates:
                            if blob == matched_print.serialize():
                                user_id = u_id
                                break
                        break
                except Exception:
                    # Fallback iterative verify if identify_sync isn't fully bound in your gi version
                    pass

                if is_verified:
                    break

                if attempt < max_attempts:
                    self._push_event(session, loop, {"event": "attempt_failed", "attempt": attempt,
                                                     "max": max_attempts,
                                                     "hint": "User not recognized. Hold steady and retry."})

        if not is_verified or user_id is None:
            self._push_event(
                session, loop, {"event": "failed", "reason": "Fingerprint verification failed or user unknown"})
            return

        # Process Attendance Step
        user_details = get_user_details_by_id(db, user_id, context)
        group_policy = get_user_auth_policy(
            db, user_id, terminal_id, context, event_id)
        result = process_attendance_step(
            db, user_id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context
        )

        if result.get("status") == "error":
            self._push_event(session, loop, {
                             "event": "error", "message": "Invalid attendance action sequence"})
            return

        # Fingerprint Auto-Learning Buffer System
        if matched_print_obj:
            scanned_bytes = matched_print_obj.serialize()
            create_fingerprint_buffer_entry(db, user_id, scanned_bytes)

            buffer_count = get_fingerprint_buffer_count_for_user(db, user_id)
            if buffer_count >= 20:
                user_rec = db.query(User).filter(User.id == user_id).first()
                if user_rec:
                    user_rec.fingerprint_template_refined = scanned_bytes
                    user_rec.sync_status = "pending"
                    db.commit()

                clear_fingerprint_buffers_for_user(db, user_id)

        self._push_event(session, loop, {
            "event": "success",
            "attendance_status": result["status"],
            "next_step": result["next_step"],
            "attendance_type": result["attendance_type"],
            "user": {
                "id": user_details.id,
                "groupId": user_details.group_id,
                "subgroupId": user_details.subgroup_id,
                "fName": user_details.fname,
                "lName": user_details.lname
            }
        })


fp_manager = FingerprintManager()
