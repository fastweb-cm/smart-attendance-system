from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.auth_session import AuthSession
from app.db.models.auth_session_steps import AuthSessionStep
from app.db.models.attendance_auth_log import AttendanceAuthLog
from app.db.models.attendance_session import AttendanceSession


def process_attendance_step(db: Session, user_id: int, terminal_id: int, auth_type: str, policy: list, auth_type_id: int, event_id: int | None = None, context: str = "daily"):
    # THE PRE-CHECK (COOLDOWN PROTECTION)
    cool_down_minutes = 1
    now = datetime.now(timezone.utc)
    attendance_type = None

    # Check if there is an active session that started VERY recently
    recent_session = db.query(AttendanceSession).filter(
        AttendanceSession.user_id == user_id,
        AttendanceSession.session_status == 'active',
        AttendanceSession.attendance_context == context,
        AttendanceSession.event_id == event_id
    ).first()

    if recent_session:
        time_since_checkin = now - \
            recent_session.checkin_timestamp.replace(tzinfo=timezone.utc)
        if time_since_checkin < timedelta(minutes=cool_down_minutes):
            # STOP THEM HERE. There are trying to trick the system
            return {
                "status": "error",
                "next_step": None,
                "attendance_type": None
            }

    # check for an existing 'in-progress' session for this user, at this terminal
    session = db.query(AuthSession).filter(
        AuthSession.user_id == user_id,
        AuthSession.terminal_id == terminal_id,
        AuthSession.status == 'in_progress'
    ).first()

    # if no session exists, create the master session and the checklist
    if not session:
        session = AuthSession(
            user_id=user_id,
            terminal_id=terminal_id,
            status='in_progress',
        )
        db.add(session)
        db.flush()  # get session.id without committing yet

        # create the checklist from the policy provided by the frontend
        for p in policy:
            new_step = AuthSessionStep(
                session_id=session.id,
                # e.g. "face", "fingerprint", "card"
                auth_type=p,
                status='pending'
            )
            db.add(new_step)
        db.flush()

    # mark the current auth type as completed
    current_step_record = db.query(AuthSessionStep).filter(
        AuthSessionStep.session_id == session.id,
        AuthSessionStep.auth_type == auth_type,
        AuthSessionStep.status == 'pending'  # only update the pending one
    ).first()

    if current_step_record:
        current_step_record.status = 'success'
        current_step_record.verified_at = datetime.now(timezone.utc)

    # check if all steps for this session are now completed
    remaining_steps = db.query(AuthSessionStep).filter(
        AuthSessionStep.session_id == session.id,
        AuthSessionStep.status == 'pending',
        # exclude the current step we just completed
        AuthSessionStep.auth_type != auth_type
    ).count()

    if remaining_steps == 0:
        session.status = 'completed'

        # New attendance trigger
        attendance_type = handle_attendance_session(
            db, user_id, terminal_id, event_id, context)

        if attendance_type == "already_completed":
            return {
                "status": "error",
                "next_step": None,
                "attendance_type": None
            }

        db.commit()  # commit all changes at once when everything is done
        return {
            "status": "completed",
            "next_step": None,
            "attendance_type": attendance_type
        }

    # get next pending step
    next_step = db.query(AuthSessionStep.auth_type).filter(
        AuthSessionStep.session_id == session.id,
        AuthSessionStep.status == 'pending',
        # exclude the current step we just completed
        AuthSessionStep.auth_type != auth_type
        # get the next pending step based on the order they were created
    ).order_by(AuthSessionStep.id).first()

    db.commit()  # commit the new session and checklist, and the updated step
    return {
        "status": "in_progress",
        # return the auth type of the next step
        "next_step": next_step[0] if next_step else None,
        "attendance_type": attendance_type
    }


def handle_attendance_session(db: Session, user_id: int, terminal_id: int, event_id: int | None = None, context: str = "daily"):
    now_utc = datetime.now(timezone.utc)
    today = now_utc.date()
    attendance_type = None  # this tells whether we are checkin or checkout

    # Look for a session that is already 'completed' for TODAY
    completed_today = db.query(AttendanceSession).filter(
        AttendanceSession.user_id == user_id,
        AttendanceSession.session_status == 'completed',
        AttendanceSession.attendance_context == context,
        AttendanceSession.event_id == event_id,
        func.date(AttendanceSession.checkin_timestamp) == today
    ).first()

    if completed_today:
        # Stop them here. They already checked in and out today.
        return "already_completed"

    # create the audit log
    auth_log = AttendanceAuthLog(
        user_id=user_id,
        terminal_id=terminal_id,
        attendance_context=context,
        event_id=event_id,
        captured_at=datetime.now(timezone.utc)
    )
    db.add(auth_log)

    # check for an active session
    active_session = db.query(AttendanceSession).filter(
        AttendanceSession.user_id == user_id,
        AttendanceSession.terminal_id == terminal_id,
        AttendanceSession.session_status == 'active'
    ).first()

    if active_session:
        # this is checkout
        active_session.checkout_timestamp = now_utc
        active_session.session_status = 'completed'
        # TODO: logic to compare against schedule for 'early' status
        checkout_status = "on time"
        if now_utc.time() >= datetime.strptime("17:00:00", "%H:%M:%S").time():
            checkout_status = "early"
        active_session.checkout_status = checkout_status

        attendance_type = "checkout"
    else:
        # this is checkin
        # TODO: fetch schedule to determine if late or on time
        checkin_status = "on time"
        if now_utc.time() >= datetime.strptime("08:00:00", "%H:%M:%S").time():
            checkin_status = "late"
        new_session = AttendanceSession(
            user_id=user_id,
            terminal_id=terminal_id,
            attendance_context=context,
            event_id=event_id,
            checkin_timestamp=now_utc,
            checkin_status=checkin_status,
            session_status='active'
        )
        db.add(new_session)

    db.flush()
    return attendance_type
