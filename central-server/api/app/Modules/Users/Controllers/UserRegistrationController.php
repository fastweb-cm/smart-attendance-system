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
    $data = $this->getJsonInput(); // decode json input

    // 1. Base required fields for EVERYONE (Email removed from here)
    $required = ['fname', 'lname', 'user_type', 'gender'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            $this->json(['error' => "$field is required"], 400);
            return;
        }
    }

    // 2. Strict Conditional Rules based on User Type
    if ($data['user_type'] === 'staff') {
        // Staff MUST provide an email
        if (empty($data['email'])) {
            $this->json(['error' => "email is required for staff members"], 400);
            return;
        }
        // Staff MUST provide a role assignment
        if (empty($data['role_id'])) {
            $this->json(['error' => "role_id is required for staff members"], 400);
            return;
        }
    }

    if ($data['user_type'] === 'student') {
        // Students MUST have a classroom allocation
        if (empty($data['class_id'])) {
            $this->json(['error' => "class_id is required for students"], 400);
            return;
        }
    }

    // Create Users instance and populate properties
    $user = new Users();
    $user->setFname(trim($data['fname']));
    $user->setLname(trim($data['lname']));
    
    // Safely handle null/empty email allocations for students
    $user->setEmail(!empty($data['email']) ? trim($data['email']) : null);
    
    $user->setGender(trim($data['gender']));
    $user->setUserType(trim($data['user_type']));
    $user->setStatus($data['status'] ?? 'active');
    $user->setBiometricEnrollmentStatus($data['biometric_enrollment_status'] ?? 'pending');

    // Optional login properties
    if (!empty($data['username'])) {
        $user->setUsername(trim($data['username']));
    } else {
        $user->setUsername(null);
    }

    if (!empty($data['password'])){
        $user->setPasswordHash(password_hash($data['password'], PASSWORD_BCRYPT));
    } else {
        $user->setPasswordHash(null);
    }

    // Student-specific
    if ($data['user_type'] === 'student') {
        $user->setClassId($data['class_id'] ?? null);
    }

    // Staff-specific
    if ($data['user_type'] === 'staff') {
        $user->setRoleId($data['role_id'] ?? null);
    }

    // Create user in DB
    $createdUser = $user->createUser();

    if ($createdUser) {
        $this->json([
            'message' => 'Operation was successfull',
            'user' => $createdUser
        ], 201);
    } else {
        $this->json(['error' => 'Failed to register user'], 500);
    }
}
}
