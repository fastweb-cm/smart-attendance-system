from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models.auth_session import AuthSession
from app.db.models.auth_session_steps import AuthSessionStep


def process_attendance_step(db: Session, user_id: int, terminal_id: int, auth_type: str, policy: list):
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
        db.commit()  # commit all changes at once when everything is done
        return {
            "status": "completed",
            "next_step": None
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
        "next_step": next_step[0] if next_step else None
    }
