CREATE DATABASE IF NOT EXISTS db_terminal;
USE db_terminal;

-- 1. Terminal Table
CREATE TABLE IF NOT EXISTS tbl_terminal (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    branch_id INT,
    branch_name VARCHAR(100),
    status ENUM('active','pending','revoked') DEFAULT 'active',
    date_created TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. User Table (Needed for Events and Sessions)
CREATE TABLE IF NOT EXISTS tbl_user (
    id INT PRIMARY KEY,
    group_id INT,
    subgroup_id INT NULL,
    terminal_id INT,
    fname VARCHAR(100),
    lname VARCHAR(100),
    gender VARCHAR(10),
    user_type VARCHAR(50),
    face_template LONGBLOB, -- Changed to LONGBLOB for reliability
    fingerprint_template LONGBLOB,
    card_serial_code VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id) ON DELETE CASCADE
);

-- 3. Auth Capabilities
CREATE TABLE IF NOT EXISTS tbl_auth_capabilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    terminal_id INT,
    auth_type_id INT,
    auth_step INT,
    auth_type_name VARCHAR(50),
    FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id) ON DELETE CASCADE
);

-- 4. Access Policy
CREATE TABLE IF NOT EXISTS tbl_auth_policy (
    id INT PRIMARY KEY,
    terminal_id INT,
    group_id INT,
    subgroup_id INT NULL,
    auth_type_id INT,
    group_name VARCHAR(100),
    auth_type_name VARCHAR(50),
    FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id) ON DELETE CASCADE
);

-- 5. Events
CREATE TABLE IF NOT EXISTS tbl_event (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    affects_attendance TINYINT(1) DEFAULT 1,
    created_by INT DEFAULT NULL,
    handshake ENUM('1','2') DEFAULT '1',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_event_time (start_datetime, end_datetime),
    CONSTRAINT fk_event_created_by FOREIGN KEY (created_by) REFERENCES tbl_user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `tbl_event_access_policy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `auth_type_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_event_scope_auth` (`event_id`,`subgroup_id`,`auth_type_id`,`group_id`) USING BTREE,
  KEY `fk_event_access_group` (`group_id`),
  KEY `fk_event_access_subgroup` (`subgroup_id`),
  KEY `fk_event_access_auth` (`auth_type_id`),
  CONSTRAINT `fk_event_access_auth` FOREIGN KEY (`auth_type_id`) REFERENCES `lkup_auth_type` (`id`),
  CONSTRAINT `fk_event_access_group` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_event_access_policy` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_event_access_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE SET NULL
) 

-- 6. Event Time Ranges
CREATE TABLE IF NOT EXISTS tbl_event_checkin_checkout_range (
    id INT NOT NULL AUTO_INCREMENT,
    event_id INT NOT NULL,
    checkin_start_datetime DATETIME NOT NULL,
    checkin_end_datetime DATETIME NOT NULL,
    checkout_start_datetime DATETIME DEFAULT NULL,
    checkout_end_datetime DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_event_check_range_event FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE CASCADE
);

-- 7. Auth Sessions
CREATE TABLE IF NOT EXISTS tbl_auth_session (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    terminal_id INT NOT NULL,
    started_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('in_progress','completed') DEFAULT 'in_progress',
    PRIMARY KEY (id),
    CONSTRAINT fk_session_auth_user FOREIGN KEY (user_id) REFERENCES tbl_user (id),
    CONSTRAINT fk_session_auth_terminal FOREIGN KEY (terminal_id) REFERENCES tbl_terminal (id)
);

-- 8. Auth Session Steps
CREATE TABLE IF NOT EXISTS tbl_auth_session_steps (
    id INT NOT NULL AUTO_INCREMENT,
    session_id INT NOT NULL,
    auth_type VARCHAR(50) NOT NULL,
    status ENUM('pending','success', 'failed') DEFAULT 'pending',
    verified_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_step_session FOREIGN KEY (session_id) REFERENCES tbl_auth_session (id) ON DELETE CASCADE
);

-- 9. Attendance Log
CREATE TABLE IF NOT EXISTS tbl_attendance_auth_log (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    terminal_id INT NOT NULL,
    attendance_context ENUM('daily','event') NOT NULL,
    event_id INT DEFAULT NULL,
    captured_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_log (user_id, terminal_id, attendance_context, captured_at),
    CONSTRAINT fk_authlog_user FOREIGN KEY (user_id) REFERENCES tbl_user(id),
    CONSTRAINT fk_authlog_terminal FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
    CONSTRAINT fk_authlog_event FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
);

-- 10. Attendance Session
CREATE TABLE IF NOT EXISTS tbl_attendance_session (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    terminal_id INT NOT NULL,
    attendance_context ENUM('daily','event') NOT NULL,
    event_id INT DEFAULT NULL,
    checkin_timestamp TIMESTAMP NOT NULL,
    checkout_timestamp TIMESTAMP NULL DEFAULT NULL,
    checkin_status ENUM('on time','late') NOT NULL,
    checkout_status ENUM('on time','early') DEFAULT NULL,
    session_status ENUM('active','completed','missed checkout') DEFAULT 'active',
    sync_status ENUM('pending','synced','error') DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_att_session_user FOREIGN KEY (user_id) REFERENCES tbl_user(id),
    CONSTRAINT fk_att_session_terminal FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
    CONSTRAINT fk_att_session_event FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
);

-- 11. Attendance Summary
CREATE TABLE IF NOT EXISTS tbl_attendance_summary (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    terminal_id INT DEFAULT NULL,
    attendance_date DATE NOT NULL,
    attendance_context ENUM('daily','event') NOT NULL,
    event_id INT DEFAULT NULL,
    first_checkin TIMESTAMP NULL DEFAULT NULL,
    last_checkout TIMESTAMP NULL DEFAULT NULL,
    total_hours DECIMAL(5,2) DEFAULT 0.00,
    attendance_status VARCHAR(100) NOT NULL,
    derived_from_session TINYINT(1) DEFAULT 1,
    generated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_summary (user_id, attendance_context, event_id, attendance_date),
    CONSTRAINT fk_summary_user FOREIGN KEY (user_id) REFERENCES tbl_user(id),
    CONSTRAINT fk_summary_terminal FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
    CONSTRAINT fk_summary_event FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
);
