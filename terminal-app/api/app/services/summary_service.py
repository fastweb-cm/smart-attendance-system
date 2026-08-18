from datetime import date, datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.models.attendance_session import AttendanceSession
from app.db.models.attendance_summary import AttendanceSummary


def prepare_summary_batch(db: Session, finalized_sessions: list[AttendanceSession]):
    summaries = []
    for s in finalized_sessions:
        # calculate/fetch the local summary (upsert logic)
        summary_data = update_local_summary(
            db, s.user_id, s.checkin_timestamp.date(), s)
        summaries.append(summary_data)
    return summaries


def update_local_summary(db: Session, user_id: int, attn_date: date, session: AttendanceSession):
    relevant_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.user_id == user_id,
        func.date(AttendanceSession.checkin_timestamp) == attn_date,
        AttendanceSession.attendance_context == session.attendance_context,
        AttendanceSession.event_id == session.event_id
    ).all()

    if not relevant_sessions:
        return None

    first_in = min(s.checkin_timestamp for s in relevant_sessions)
    checkouts = [
        s.checkout_timestamp for s in relevant_sessions if s.checkout_timestamp]
    last_out = max(checkouts) if checkouts else None

    # SUM ONLY ACTUAL WORKED SECONDS (EXCLUDES BREAKS/GAPS)
    total_seconds = sum(
        (s.checkout_timestamp - s.checkin_timestamp).total_seconds()
        for s in relevant_sessions
        if s.checkout_timestamp and s.checkin_timestamp
    )
    total_hrs = total_seconds / 3600.0

    has_completed = any(s.session_status ==
                        'completed' for s in relevant_sessions)
    status = "present" if has_completed else "missed checkout"

    summary = db.query(AttendanceSummary).filter(
        AttendanceSummary.user_id == user_id,
        AttendanceSummary.attendance_date == attn_date,
        AttendanceSummary.attendance_context == session.attendance_context,
        AttendanceSummary.event_id == session.event_id
    ).first()

    if not summary:
        summary = AttendanceSummary(
            user_id=user_id,
            terminal_id=session.terminal_id,
            attendance_date=attn_date,
            attendance_context=session.attendance_context,
            event_id=session.event_id,
            first_checkin=first_in,
            last_checkout=last_out,
            total_hours=total_hrs,
            attendance_status=status,
            derived_from_session=True
        )
        db.add(summary)
    else:
        summary.first_checkin = first_in
        summary.last_checkout = last_out
        summary.total_hours = total_hrs
        summary.attendance_status = status

    db.flush()

    return {
        "user_id": user_id,
        "terminal_id": session.terminal_id,
        "attendance_date": attn_date.strftime("%Y-%m-%d"),
        "attendance_context": session.attendance_context,
        "event_id": session.event_id,
        "first_checkin": first_in.strftime("%Y-%m-%d %H:%M:%S"),
        "last_checkout": last_out.strftime("%Y-%m-%d %H:%M:%S") if last_out else None,
        "total_hours": float(round(total_hrs, 2)),
        "attendance_status": status
    }


def midnight_missed_checkout_cleanup(db: Session):
    yesterday = datetime.now().date() - timedelta(days=1)

    # 1. Find sessions that are still 'active' from yesterday or older
    stale_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.session_status == 'active',
        func.date(AttendanceSession.checkin_timestamp) <= yesterday
    ).all()

    for s in stale_sessions:
        s.session_status = 'missed checkout'
        s.sync_status = 'pending'  # This triggers the uplink worker, here after

        # Also update local summary to reflect the "missed checkout" status
        update_local_summary(db, s.user_id, s.checkin_timestamp.date(), s)

    db.commit()
