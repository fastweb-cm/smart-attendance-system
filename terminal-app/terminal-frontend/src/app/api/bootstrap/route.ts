import { createDatabaseConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import { base64ToBuffer } from "@/lib";


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
      CREATE TABLE IF NOT EXISTS tbl_member (
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
        `INSERT INTO tbl_member 
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
