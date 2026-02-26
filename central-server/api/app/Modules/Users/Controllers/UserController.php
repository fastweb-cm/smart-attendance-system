<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Modules\Users\Models\Users;

class UserController extends Controller
{
    /**
     * List all users
     * Optional query parameters: user_type, status, limit, offset
     */
    public function index(): void
    {
        $query = $this->getQueryParams(); 
        $userType = $query['user_type'] ?? null;
        $status = $query['status'] ?? null;

        $users = (new Users())->listUsers($userType, $status);
        $this->json($users);
    }

    /**
     * Get a single user by ID
     * URL: /api/v1/users/{id}
     */
    public function show(int $id): void
    {
        $user = (new Users())->getUserById($id);
        if ($user) {
            $this->json($user);
        } else {
            $this->json(['error' => 'User not found'], 404);
        }
    }
}
