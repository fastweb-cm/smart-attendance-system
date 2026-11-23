ALTER TABLE tbl_attendance_session
ADD INDEX idx_user_id (user_id),
DROP INDEX uk_user_session_boundary,
ADD UNIQUE KEY uk_terminal_session (
    terminal_id,
    terminal_session_id
);
