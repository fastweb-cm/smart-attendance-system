import { createDatabaseConnection } from "./db";

export async function checkIsActivated(): Promise<boolean> {
    let connection;

    try {
        connection = await createDatabaseConnection();
        const dbName = process.env.DB_NAME || "db_terminal";
        await connection.query(`USE \`${dbName}\``);

        const [rows] = await connection.query("SELECT id FROM tbl_terminal WHERE status = 'active' LIMIT 1");

        // Use Array.isArray to safely check length and satisfy TypeScript
        return Array.isArray(rows) && rows.length > 0;
    } catch (error) {
        console.error("Database check failed, assuming unactivated:", error);
        return false; // Explicitly return false on failure
    } finally {
        if (connection) await connection.end();
    }
}
