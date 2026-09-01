<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Modules\Users\Models\Users;
use Throwable;

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
    $status   = $query['status'] ?? null;
    $role     = $query['role'] ?? null;
    $search   = $query['search'] ?? null;

    // Parse class ID filter as integer (accepts key 'class_id' or 'class')
    $classParam = $query['class_id'] ?? $query['class'] ?? null;
    $classId    = ($classParam !== null && $classParam !== '') ? (int) $classParam : null;

    $limit  = isset($query['limit']) ? max(1, (int)$query['limit']) : 10;
    $page   = isset($query['page']) ? max(1, (int)$query['page']) : 1;
    $offset = ($page - 1) * $limit;

    $responseMatrix = (new Users())->listUsers($userType, $status, $role, $classId, $search, $limit, $offset);
    $responseMatrix['meta']['current_page'] = $page;

    $this->json($responseMatrix);
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

    public function syncUsers()
    {
        $data = $this->getJsonInput();

        $students = $data["students"] ?? [];
        $staff = $data["staff"] ?? [];

        if (!empty($students) || !empty($staff)) {
            try {
                $ids = (new Users())->syncUsersFromOnline($students, $staff);

                $this->json([
                    "success" => true,
                    "studentIds" => $ids[0],
                    "staffIds" => $ids[1]
                ]);
            } catch (Throwable $e) {
                error_log("Error syncing users: " . $e->getMessage());
                    $this->json([
                    "success"=> false,
                    "message"=> $e->getMessage(),
                    "type" => get_class($e)
                ]);
            }
        }
    }

    public function fetchUsersToIssueCard()
    {
        $this->json((new Users())->fetchUserCardDetails());
    }

    public function markCardIssued()
    {
        $data = $this->getJsonInput();
        $userIds = $data["ids"] ?? [];

        error_log("ids:". json_encode($userIds));

        if (!empty($userIds)) {
            try {
                $result = (new Users())->markCardActive($userIds);
                $this->json(["success" => $result]);
            } catch (Throwable $e) {
                $this->json([
                    "success" => false,
                    "message" => $e->getMessage(),
                    "type" => get_class($e)
                ]);
            }
        } else {
            $this->json(["success" => false, "message" => "No user IDs provided"]);
        }
    }

    public function getClasses()
    {
        $classes = (new Users())->getClasses();
        $this->json($classes);
    }

    public function getRoles()
    {
        $classes = (new Users())->getEmployeeRoles();
        $this->json($classes);
    }

    public function getUsersByType()
    {
        $userType = $_GET['userType'] ?? null;
        $users = (new Users())->getUsers($userType);
        $this->json($users);
    }

    /**
 * Handle path parameter routing: /admin/users/delete/{id}
 * * @param int|string|null $id Router automatically parses and injects the route match slice here
 */
public function destroy($id = null): void
{
    try {
        // 1. Initial Validation
        if ($id === null) {
            $this->json([
                "success" => false,
                "message" => "Bad Request: Missing structural path identity target parameter."
            ], 400);
            return;
        }

        $targetId = (int)$id;

        if ($targetId <= 0) {
            $this->json([
                "success" => false,
                "message" => "Bad Request: Invalid identity target format."
            ], 400);
            return;
        }

        $userModel = new Users();

        // Execution Layer
        if ($userModel->deleteUser($targetId)) {
            $this->json([
                "success" => true,
                "message" => "Employee record and all associated identities successfully deleted from the system."
            ]);
        } else {
            // This triggers if deleteUser returns false (e.g., ID doesn't exist) 
            // but NO exception was thrown by the DB.
            $this->json([
                "success" => false,
                "message" => "Target record not found. No deletions occurred."
            ], 404);
        }

    } catch (Throwable $e) {
        // 3. Catch-all for Re-thrown Exceptions from Model
        $this->json([
            "success" => false,
            "message" => "Internal System Error: Failed to execute cascading identity destruction.",
            "error_details" => [
                "class"   => get_class($e),
                "message" => $e->getMessage(),
                "file"    => $e->getFile(),
                "line"    => $e->getLine()
            ]
        ], 500);
    }
}

public function update(int $id): void
{
    if ($id <= 0) {
        $this->json(['error' => "Invalid or missing User ID parameter"], 400);
        return;
    }

    $data = $this->getJsonInput(); // decode parsing utility

    // 1. Core required structural keys validation
    $required = ['fname', 'lname', 'user_type', 'gender'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            $this->json(['error' => "Field '$field' cannot be saved blank"], 400);
            return;
        }
    }

    // 2. Strict type constraint alignment matching frontend zod layout schemas
    if ($data['user_type'] === 'staff') {
        if (empty($data['email'])) {
            $this->json(['error' => "Email identity is strictly required for staff members"], 400);
            return;
        }
        if (empty($data['role_id'])) {
            $this->json(['error' => "An operational role assignment designation is required for staff members"], 400);
            return;
        }
    }

    if ($data['user_type'] === 'student' && empty($data['class_id'])) {
        $this->json(['error' => "An academic class room assignment is required for students"], 400);
        return;
    }

    // Initialize entity instance object targeting active matching profile reference
    $user = new Users();
    $existingUser = $user->getUserById($id);
    
    if (!$existingUser) {
        $this->json(['error' => "No user account was found with ID #$id"], 444);
        return;
    }

    // Assign core updating metadata
    $user->setId($id);
    $user->setFname(trim($data['fname']));
    $user->setLname(trim($data['lname']));
    $user->setGender(trim($data['gender']));
    $user->setUserType(trim($data['user_type']));
    $user->setStatus($data['status'] ?? 'active');
    $user->setBiometricEnrollmentStatus($data['biometric_enrollment_status'] ?? 'pending');

    // Handle Nullable Profile Strings securely
    $user->setEmail(!empty($data['email']) ? trim($data['email']) : null);
    $user->setUsername(!empty($data['username']) ? trim($data['username']) : null);

    // Only update and re-hash password strings if the user explicitly typed one in
    if (!empty($data['password'])) {
        $user->setPasswordHash(password_hash($data['password'], PASSWORD_BCRYPT));
    } else {
        // Keep it null explicitly so the model knows to skip it during SQL construction
        $user->setPasswordHash(null);
    }

    // Segment tracking properties mappings
    if ($data['user_type'] === 'student') {
        $user->setClassId((int)$data['class_id']);
    } else {
        $user->setRoleId((int)$data['role_id']);
    }

    // Execute save operation transaction routine 
    $updatedUser = $user->updateUser();

    if ($updatedUser) {
        $this->json([
            'message' => 'Account profile updated successfully',
            'success' => true
        ], 200);
    } else {
        $this->json(['error' => 'Failed to save account identity properties updates'], 500);
    }
}

}
