import { createDatabaseConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { base64ToBuffer } from "@/lib";
import { createTerminalConfig } from "@/lib/createTerminalConfig";


export async function POST(request: Request) {
  let connection;

  try {
    connection = await createDatabaseConnection();

    const dbName = process.env.NEXT_PUBLIC_DB_NAME || "db_terminal";

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // ========================
    // CREATE TABLES
    // ========================


    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_terminal (
        id INT PRIMARY KEY,
        name VARCHAR(255),
        slug VARCHAR(255) UNIQUE,
        branch_id INT,
        branch_name VARCHAR(100),
        status ENUM('active','pending','revoked') DEFAULT 'active',
        date_created DATETIME
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_auth_capabilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        terminal_id INT,
        auth_type_id INT,
        auth_step INT,
        auth_type_name VARCHAR(50),
        FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
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
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_user (
        id INT PRIMARY KEY,
        group_id INT,
        subgroup_id INT NULL,
        terminal_id INT,
        fname VARCHAR(100),
        lname VARCHAR(100),
        gender VARCHAR(10),
        user_type VARCHAR(50),
        face_template BLOB,
        fingerprint_template BLOB,
        card_serial_code VARCHAR(255),
        FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_event (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,

        group_id INT DEFAULT NULL,
        subgroup_id INT DEFAULT NULL,

        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,

        affects_attendance TINYINT(1) DEFAULT 1,
        created_by INT DEFAULT NULL,
        handshake ENUM('1','2') DEFAULT '1',

        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id),

        KEY idx_event_group (group_id),
        KEY idx_event_subgroup (subgroup_id),
        KEY idx_event_time (start_datetime, end_datetime),
        KEY idx_event_created_by (created_by),

        CONSTRAINT fk_event_created_by 
          FOREIGN KEY (created_by) REFERENCES tbl_user(id) ON DELETE SET NULL
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_event_checkin_checkout_range (
        id INT NOT NULL AUTO_INCREMENT,
        event_id INT NOT NULL,
        checkin_start_datetime DATETIME NOT NULL,
        checkin_end_datetime DATETIME NOT NULL,
        checkout_start_datetime DATETIME DEFAULT NULL,
        checkout_end_datetime DATETIME DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_event_check_range_event (event_id),
        CONSTRAINT fk_event_check_range_event 
          FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_auth_session (
        id int NOT NULL AUTO_INCREMENT,
        user_id int NOT NULL,
        terminal_id int NOT NULL,
        started_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        status enum('in_progress','completed') DEFAULT 'in_progress',
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY terminal_id (terminal_id),
        CONSTRAINT tbl_auth_session_ibfk_1 FOREIGN KEY (user_id) REFERENCES tbl_user (id),
        CONSTRAINT tbl_auth_session_ibfk_2 FOREIGN KEY (terminal_id) REFERENCES tbl_terminal (id)
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_auth_session_steps (
        id int NOT NULL AUTO_INCREMENT,
        session_id int NOT NULL,
        auth_type VARCHAR(50) NOT NULL,
        status enum('pending','success', 'failed') DEFAULT 'pending',
        verified_at timestamp NULL DEFAULT NULL,
        PRIMARY KEY (id),
        KEY session_id (session_id),
        CONSTRAINT tbl_auth_session_steps_ibfk_1 FOREIGN KEY (session_id) REFERENCES tbl_auth_session (id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tbl_attendance_auth_log (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        terminal_id INT NOT NULL,
        attendance_context ENUM('daily','event') NOT NULL,
        event_id INT DEFAULT NULL,
        captured_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_terminal_context_event 
          (user_id, terminal_id, attendance_context, captured_at),
        KEY idx_event_id (event_id),
        KEY idx_authlog_user (user_id),
        KEY idx_authlog_terminal (terminal_id),
        KEY idx_authlog_time (captured_at),
        CONSTRAINT fk_authlog_user 
          FOREIGN KEY (user_id) REFERENCES tbl_user(id),
        CONSTRAINT fk_authlog_terminal 
          FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
        CONSTRAINT fk_authlog_event 
          FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
      );
    `);

    await connection.query(`
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
        KEY idx_session_user (user_id),
        KEY idx_session_terminal (terminal_id),
        KEY idx_session_event (event_id),
        KEY idx_session_checkin (checkin_timestamp),
        CONSTRAINT fk_session_user 
          FOREIGN KEY (user_id) REFERENCES tbl_user(id),
        CONSTRAINT fk_session_terminal 
          FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
        CONSTRAINT fk_session_event 
          FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
      );
    `);

    await connection.query(`
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
        UNIQUE KEY unique_user_context_event_date 
          (user_id, attendance_context, event_id, attendance_date),
        KEY idx_summary_terminal (terminal_id),
        KEY idx_summary_event (event_id),
        KEY idx_summary_user (user_id),
        KEY idx_summary_date (attendance_date),
        KEY idx_summary_status (attendance_status),
        CONSTRAINT fk_summary_user 
          FOREIGN KEY (user_id) REFERENCES tbl_user(id),
        CONSTRAINT fk_summary_terminal 
          FOREIGN KEY (terminal_id) REFERENCES tbl_terminal(id),
        CONSTRAINT fk_summary_event 
          FOREIGN KEY (event_id) REFERENCES tbl_event(id) ON DELETE SET NULL
      );
    `);

    // ========================
    // PARSE DATA
    // ========================

    const data = await request.json();

    // ========================
    // TRANSACTION START
    // ========================

    await connection.beginTransaction();

    // ========================
    // INSERT TERMINAL
    // ========================

    await connection.query(
      `INSERT INTO tbl_terminal 
      (id, name, slug, branch_id, branch_name, status, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.slug,
        data.branch_id,
        data.branch,
        data.status,
        data.date_created,
      ]
    );

    // ========================
    // AUTH CAPABILITIES
    // ========================

    for (const auth of data.auth_capabilities || []) {
      await connection.query(
        `INSERT INTO tbl_auth_capabilities 
        (terminal_id, auth_type_id, auth_step, auth_type_name)
        VALUES (?, ?, ?, ?)`,
        [
          auth.terminal_id,
          auth.auth_type_id,
          auth.auth_step,
          auth.auth_type_name,
        ]
      );
    }

    // ========================
    // AUTH POLICY
    // ========================

    for (const policy of data.access_policy || []) {
      await connection.query(
        `INSERT INTO tbl_auth_policy 
        (id, terminal_id, group_id, subgroup_id, auth_type_id, group_name, auth_type_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          policy.id,
          policy.terminal_id,
          policy.group_id,
          policy.subgroup_id,
          policy.auth_type_id,
          policy.group_name,
          policy.auth_type_name,
        ]
      );
    }

    // ========================
    // MEMBERS (WITH BLOBS)
    // ========================

    for (const member of data.members || []) {
      await connection.query(
        `INSERT INTO tbl_user 
        (id, group_id, subgroup_id, terminal_id, fname, lname, gender, user_type,
         face_template, fingerprint_template, card_serial_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id,
          member.group_id,
          member.subgroup_id,
          data.id,
          member.fname,
          member.lname,
          member.gender,
          member.user_type,
          base64ToBuffer(member.face_template),
          base64ToBuffer(member.fingerprint_template),
          member.card_serial_code,
        ]
      );
    }

    // ========================
    // CREATE TERMINAL CONFIG FILE
    // ========================

    await createTerminalConfig(data);

    // ========================
    // COMMIT
    // ========================

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Bootstrap completed successfully",
    });

    // eslint-disable-next-line
  } catch (error: any) {
    if (connection) await connection.rollback();

    console.error("CRITICAL BOOTSTRAP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );

  } finally {
    if (connection) await connection.end();
  }
}
