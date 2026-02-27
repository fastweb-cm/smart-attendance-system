<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Modules\Users\Models\Users;

class UserRegistrationController extends Controller
{
    // Test DB connection
    public function index(): void
    {
        $db = \App\Core\Database::connect();
        $this->json(['message' => 'Database connected successfully']);
    }

    // Register a new user
    public function register(): void
    {
        $data = $this->getJsonInput(); //decode json input

        // Validate required fields
        $required = ['fname', 'lname', 'email', 'user_type', 'gender'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $this->json(['error' => "$field is required"], 400);
                return;
            }
        }

        // Create Users instance and populate properties
        $user = new Users();
        $user->setFname(trim($data['fname']));
        $user->setLname(trim($data['lname']));
        $user->setEmail(trim($data['email']));
        $user->setGender(trim($data['gender']));
        $user->setUserType(trim($data['user_type']));
        $user->setStatus($data['status'] ?? 'active');
        $user->setBiometricEnrollmentStatus($data['biometric_enrollment_status'] ?? 'pending');

        // Optional fields
        if (!empty($data['username'])) {
            $user->setUsername(trim($data['username']));
        }

        if (!empty($data['password'])){
            // Hash password securely
            $user->setPasswordHash(password_hash($data['password'], PASSWORD_BCRYPT));
        }

        // Student-specific
        if ($data['user_type'] === 'student') {
            $user->setRegno($data['regno'] ?? null);
            $user->setClassId($data['class_id'] ?? null);
        }

        // Staff-specific
        if ($data['user_type'] === 'staff') {
            $user->setRoleId($data['role_id'] ?? null);
        }

        // Create user
        $createdUser = $user->createUser();

        if ($createdUser) {
            $this->json([
                'message' => 'User registered successfully',
                'user' => $createdUser
            ], 201);
        } else {
            $this->json(['error' => 'Failed to register user'], 500);
        }
    }
}
