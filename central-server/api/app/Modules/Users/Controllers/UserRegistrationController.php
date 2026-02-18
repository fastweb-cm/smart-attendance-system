<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Modules\Users\Models\Users;

class UserRegistrationController extends Controller {
    //test the db connection
    public function index(): void {
        $db = Database::connect();
        echo json_encode(['message' => 'Database connected successfully']);
    }
    public function register(): void {
        $data = $this->getJsonInput();

        // Validate input
        if (empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            $this->json(['error' => 'Name, email, and password are required'], 400);
            return;
        }

        // Create user
        $user = (new User())
            ->setName($data['name'])
            ->setEmail($data['email'])
            ->setPassword($data['password']);

        if ($user->create()) {
            $this->json(['message' => 'User registered successfully', 'user_id' => $user->getId()], 201);
        } else {
            $this->json(['error' => 'Failed to register user'], 500);
        }
    }
}
?>