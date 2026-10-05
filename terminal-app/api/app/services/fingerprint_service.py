from app.crud.fingerprint_buffer import (
    create_fingerprint_buffer_entry,
    get_fingerprint_buffer_count_for_user,
    get_fingerprint_buffers_by_user_id,
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
        self.action_type = action_type.upper()  # 'ENROLL' or 'VERIFY'
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
    """Executes libfprint operations and bridges events to asyncio queues."""

    def __init__(self):
        self.sessions: dict[str, FingerprintSession] = {}

    def create_session(self, action_type: str, params: dict) -> FingerprintSession:
        if HARDWARE_LOCK.locked():
            raise RuntimeError("Scanner is currently busy with another user.")

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
            db = SessionLocal()
            try:
                ctx = FPrint.Context()
                devs = ctx.get_devices()
                if not devs:
                    self._push_event(
                        session, loop, {"event": "error", "message": "No scanner hardware detected"})
                    return

                dev = devs[0]
                dev.open_sync(session.cancellable)

                try:
                    if session.action_type == "ENROLL":
                        self._run_enroll(dev, session, loop, db)
                    elif session.action_type == "VERIFY":
                        self._run_verify(dev, session, loop, db)
                except GLib.Error as e:
                    if "cancelled" in e.message.lower():
                        self._push_event(
                            session, loop, {"event": "failed", "reason": "Operation cancelled"})
                    else:
                        self._push_event(
                            session, loop, {"event": "error", "message": e.message})
                finally:
                    dev.close_sync(None)

            except Exception as ex:
                self._push_event(
                    session, loop, {"event": "error", "message": str(ex)})
            finally:
                session.is_active = False
                db.close()

    def _push_event(self, session: FingerprintSession, loop: asyncio.AbstractEventLoop, payload: dict):
        """Safely pushes events from worker thread to asyncio queue."""
        asyncio.run_coroutine_threadsafe(session.queue.put(payload), loop)

    def _run_enroll(self, dev, session: FingerprintSession, loop: asyncio.AbstractEventLoop, db: Session):
        user_id = session.params.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            self._push_event(
                session, loop, {"event": "error", "message": "Invalid user ID"})
            return

        def on_progress(device, done, print_obj, data, error):
            if error:
                self._push_event(session, loop, {
                    "event": "enroll_progress",
                    "stage": done,
                    "total": 5,
                    "hint": f"Retry scan: {error.message}"
                })
            else:
                hint = STAGE_HINTS.get(done + 1, "Scanning complete")
                self._push_event(session, loop, {
                    "event": "enroll_progress",
                    "stage": done,
                    "total": 5,
                    "hint": hint
                })

        self._push_event(
            session, loop, {"event": "waiting", "hint": STAGE_HINTS[1]})

        tpl = FPrint.Print.new(dev)
        tpl.set_username(str(user_id))

        enrolled_print = dev.enroll_sync(
            tpl, session.cancellable, on_progress, None)
        serialized_blob = enrolled_print.serialize()

        # Update core model
        user.fingerprint_template = serialized_blob
        user.fingerprint_template_refined = serialized_blob
        user.sync_status = "pending"
        db.commit()

        self._push_event(session, loop, {
            "event": "enroll_done",
            "user_id": user_id,
            "message": "Fingerprint enrolled successfully"
        })

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

        # Load candidates
        candidates = {}
        if user_id is not None:
            template = get_user_fingerprint_template_by_id(db, user_id)
            if template:
                candidates[user_id] = template
        else:
            candidates = get_all_fingerprint_templates(db)

        if not candidates:
            self._push_event(
                session, loop, {"event": "failed", "reason": "No enrolled templates found"})
            return

        matched_user_id = None
        matched_print_obj = None

        for attempt in range(1, max_attempts + 1):
            if session.cancellable.is_cancelled():
                return

            for uid, blob in candidates.items():
                target_print = FPrint.Print.deserialize(blob)
                matched, newly_scanned = dev.verify_sync(
                    target_print, session.cancellable, None, None)

                if matched:
                    matched_user_id = uid
                    matched_print_obj = newly_scanned
                    break

            if matched_user_id:
                break

            if attempt < max_attempts:
                self._push_event(session, loop, {
                    "event": "attempt_failed",
                    "attempt": attempt,
                    "max": max_attempts,
                    "hint": "Hold steady and press firmer"
                })

        if not matched_user_id:
            self._push_event(
                session, loop, {"event": "failed", "reason": "No fingerprint match found"})
            return

        # Process Attendance Step
        user_details = get_user_details_by_id(db, matched_user_id, context)
        group_policy = get_user_auth_policy(
            db, matched_user_id, terminal_id, context, event_id)
        result = process_attendance_step(
            db, matched_user_id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context
        )

        if result.get("status") == "error":
            self._push_event(session, loop, {
                             "event": "error", "message": "Invalid attendance action sequence"})
            return

        # Fingerprint Auto-Learning Buffer System
        if matched_print_obj:
            scanned_bytes = matched_print_obj.serialize()
            create_fingerprint_buffer_entry(db, matched_user_id, scanned_bytes)

            buffer_count = get_fingerprint_buffer_count_for_user(
                db, matched_user_id)
            if buffer_count >= 20:
                # Rotate refined template with the most recent high-quality scan and clear buffer
                user_rec = db.query(User).filter(
                    User.id == matched_user_id).first()
                if user_rec:
                    user_rec.fingerprint_template_refined = scanned_bytes
                    user_rec.sync_status = "pending"
                    db.commit()

                clear_fingerprint_buffers_for_user(db, matched_user_id)

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
