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

    public function getUsersByType()
    {
        $userType = $_GET['userType'] ?? null;
        $users = (new Users())->getUsers($userType);
        $this->json($users);
    }

}
