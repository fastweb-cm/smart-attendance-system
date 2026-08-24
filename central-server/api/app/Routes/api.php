<?php

use App\Modules\Users\Controllers\UserRegistrationController;
use App\Modules\Users\Controllers\UserController;
use App\Modules\Users\Controllers\AuthController;
use App\Middleware\AuthMiddleware;
use App\Middleware\TerminalHeartBeatMiddleware;
use App\Modules\Branch\Controllers\BranchController;
use App\Modules\Groups\Controllers\GroupController;
use App\Modules\Terminals\Controllers\TerminalController;
use App\Modules\Events\Controllers\EventsController;

use App\Modules\Sync\Controller\SyncController;
use App\Modules\Exceptions\Controllers\ExceptionController;
use App\Modules\Attendance\Controller\AttendanceController;
use App\Modules\Permission\Controllers\PermissionController;

use App\Modules\Logger\Controllers\LoggerController;
/*
|--------------------------
|  Public Routes
|--------------------------
*/

$router->get('/', [UserRegistrationController::class, 'index']);
$router->post('/api/v1/auth/login', [AuthController::class, 'login']);
$router->post('/api/v1/auth/logout', [AuthController::class, 'logout']);
$router->post('/api/v1/auth/refresh', [AuthMiddleware::class, 'attempRefresh']);

/*
|--------------------------
|  lookup Routes
|--------------------------
*/
$router->get('/api/v1/lookup/classes', [UserController::class, 'getClasses']);
$router->get('/api/v1/lookup/roles', [UserController::class, 'getRoles']);
$router->get('/api/v1/lookup/users', [UserController::class, 'getUsersByType']);
$router->get('/api/v1/lookup/branches', [BranchController::class, 'getBranches']);
$router->get('/api/v1/lookup/auth-types', [TerminalController::class, 'getAuthTypes']);
$router->get('/api/v1/lookup/auth-policies', [GroupController::class, 'getAuthPolicies']);
$router->get('/api/v1/lookup/permissions/types', [PermissionController::class, 'types']);

$router->post('/api/v1/terminal/activate', [TerminalController::class, 'activate']);
/*
|--------------------------
|  Sync Routes
|--------------------------
*/
$router->group(['middleware' => [TerminalHeartBeatMiddleware::class]], function($router) {
    $router->get('/api/v1/sync/updates', [SyncController::class, 'index']);
    $router->post('/api/v1/sync/acknowledge', [SyncController::class, 'acknowledge']);
    $router->post('/api/v1/sync/uplink/sessions-batch', [SyncController::class, 'sessionUplink']);
    $router->post('/api/v1/sync/uplink/summaries-batch', [SyncController::class, 'summaryUplink']);
    $router->post('/api/v1/sync/uplink/user-templates', [SyncController::class, 'userTemplatesUplink']);
});
/*
|--------------------------
|  Protected Routes
|--------------------------
*/


$router->group(['middleware' => [AuthMiddleware::class]], function($router) {

    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users', [UserRegistrationController::class, 'register']);
    $router->delete('/api/v1/users/{id}', [UserController::class, 'destroy']);
    $router->put('/api/v1/users/{id}', [UserController::class, 'update']);

    //branch routes
    $router->post('/api/v1/branch', [BranchController::class, 'store']);
    $router->get('/api/v1/branch', [BranchController::class, 'all']);
    $router->get('/api/v1/branch/{branchId}', [BranchController::class, 'one']);
    $router->delete('/api/v1/branch/{id}', [BranchController::class, 'delete']);
    $router->put('/api/v1/branch/{branchId}', [BranchController::class, 'edit']);

    //groups routes
    $router->get('/api/v1/group', [GroupController::class, 'index']);
    $router->post('/api/v1/group', [GroupController::class, 'store']);
    $router->put('/api/v1/group', [GroupController::class, 'edit']);
    $router->delete('/api/v1/group/{groupId}', [GroupController::class, 'delete']);

    $router->post('/api/v1/terminal', [TerminalController::class, 'store']);
    $router->put('/api/v1/terminal', [TerminalController::class, 'edit']);
    $router->get('/api/v1/terminal', [TerminalController::class, 'index']);
    $router->delete('/api/v1/terminal/{id}', [TerminalController::class, 'delete']);
    $router->get('/api/v1/terminal/slug/{slug}', [TerminalController::class, 'getTerminalDetailsBySlug']);

    $router->post('/api/v1/event', [EventsController::class, 'store']);
    $router->put('/api/v1/event', [EventsController::class, 'edit']);
    $router->get('/api/v1/event', [EventsController::class, 'index']);
    $router->delete('/api/v1/event/{id}', [EventsController::class, 'delete']);

    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users/sync', [UserController::class, 'syncUsers']);
    $router->get('/api/v1/users/pending-card', [UserController::class, 'fetchUsersToIssueCard']);
    $router->post('/api/v1/users/mark-card-issued', [UserController::class, 'markCardIssued']);

    $router->get('/api/v1/exceptions', [ExceptionController::class, 'index']);
    $router->post('/api/v1/exceptions', [ExceptionController::class, 'store']);
    $router->delete('/api/v1/exceptions/{id}', [ExceptionController::class, 'delete']);
    $router->get('/api/v1/exceptions/all', [ExceptionController::class, 'all']);

    $router->get('/api/v1/attendance/ledger', [AttendanceController::class, 'ledger']);
    $router->get('/api/v1/attendance/sessions', [AttendanceController::class, 'sessions']);
    $router->get('/api/v1/attendance/user/{id}', [AttendanceController::class, 'userDetail']);
    $router->patch('/api/v1/attendance', [AttendanceController::class, 'partialEdit']);

    // Staff Permission Request Management routes
    $router->get('/api/v1/permissions', [PermissionController::class, 'index']);        // Fetch singular query details (?id=X)
    $router->post('/api/v1/permissions', [PermissionController::class, 'store']);       // Handles both insertions and modification updates
    $router->delete('/api/v1/permissions/{id}', [PermissionController::class, 'delete']); // Cancel / Drop pending requests
    $router->get('/api/v1/permissions/all', [PermissionController::class, 'all']);      // Filtered aggregate dashboard index data listing
    $router->post('/api/v1/permissions/review', [PermissionController::class, 'review']); // Manager validation state decision point

    
    $router->get('/api/v1/logs', [LoggerController::class, 'index']);
});

