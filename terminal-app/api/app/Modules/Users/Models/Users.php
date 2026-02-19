<?php
namespace App\Modules\Users\Models;

use App\Core\Database;

class Users {
    private ?int $id = 0;
    private string $name;
    private string $email;
    private string $password;

    //Getters and Setters
    public function getId(): ?int { return $this->id; }
    public function setId(int $id): void { $this->id = $id; }
    public function getName(): string { return $this->name; }
    public function setName(string $name): void { $this->name = $name;}
    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): void { $this->email = $email;}
    public function getPassword(): string { return $this->password; }
    public function setPassword(string $password): void { $this->password = $password;}

    //create a new user
    public function create(): bool {
        $db = Database::connect();
        $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        $params = [$this->name, $this->email, password_hash($this->password, PASSWORD_BCRYPT)];
        $db->query($sql, $params);   
        $this->id = $db->lastInsertId();
        return $this->id !== 0;
    }
}
?>