import mysql from "mysql2/promise";

export async function createDatabaseConnection() {
    const connection = await mysql.createConnection({
        host: process.env.NEXT_PUBLIC_MYSQL_HOST,
        user: process.env.NEXT_PUBLIC_MYSQL_USER,
        password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD,
    });

    return connection;
}
