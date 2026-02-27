<?php

namespace App\Core;

use mysqli;
use mysqli_sql_exception;

class Database
{
    private static ?Database $instance = null;
    private mysqli $conn;
    private int $row = 0;
    private int $affectedRows = 0;
    private int $lastInsertId = 0;

    /**
     * Summary of __construct
     * @throws \RuntimeException
     */
    private function __construct(){
        $config = require __DIR__ . '/../../config/database.php';

        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        try {
            $this->conn = new mysqli(
                $config['host'],
                $config['user'],
                $config['password'],
                $config['database'],
                $config['port']
            );
            $this->conn->set_charset('utf8mb4');
        } catch (mysqli_sql_exception $e) {
            throw new \RuntimeException('Database connection error: ' . $e->getMessage());
        }
    }

    //singleton db connection
    /**
     * Summary of connect
     * @return Database|null
     */
    public static function connect(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    //detect and return the type of each param
    /**
     * Summary of detectType
     * @param mixed $param
     * @return string
     */
    private function detectType($param): string {
        return match (true) {
            \is_int($param) => 'i',
            \is_float($param) => 'd',
            \is_string($param) => 's',
            $param === null => 's',
            default => 'b',
        };
    }

    /**
     * Summary of query
     * @param string $sql
     * @param mixed $params
     * @return bool|\mysqli_result|null
     */
    public function query(string $sql, array $params = []): mixed {
        $this->row = 0;
        $this->affectedRows = 0;
        $this->lastInsertId = 0;

        $stmt = $this->conn->prepare($sql);
        if (!empty($params)) {
            $types = '';
            foreach($params as $param) {
                $types .= $this->detectType($param);
            }
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $this->affectedRows = $stmt->affected_rows;
        $this->lastInsertId = $stmt->insert_id;

        $result = null;
        if ($stmt->field_count > 0) {
            $result = $stmt->get_result();
            $this->row = $result->num_rows;
        }

        $stmt->close();

        return $result;
    }

    //accessors
    public function rows(): int {
        return $this->row;  
    }
    public function affectedRows(): int {
        return $this->affectedRows;  
    }
    public function lastInsertId(): int {
        return $this->lastInsertId;
    }

    private function __clone() {} // prevent cloning e.g $db2 = clone $db1; if not used, it creates another instance

    public function __wakeup() // prevent unserializing e.g $db2 = unserialize(serialize($db1)); if not used, it creates another instance
    {
        throw new \Exception("Cannot unserialize singleton");
    }

}

