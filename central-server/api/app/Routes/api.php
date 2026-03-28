<?php

use App\Modules\Users\Controllers\UserRegistrationController;
use App\Modules\Users\Controllers\UserController;
use App\Modules\Users\Controllers\AuthController;
use App\Middleware\AuthMiddleware;
use App\Modules\Branch\Controllers\BranchController;
use App\Modules\Groups\Controllers\GroupController;
use App\Modules\Terminals\Controllers\TerminalController;

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
|  Protected Routes
|--------------------------
*/
$router->post('/api/v1/terminal', [TerminalController::class, 'store']);
$router->put('/api/v1/terminal', [TerminalController::class, 'edit']);
$router->get('/api/v1/terminal', [TerminalController::class, 'index']);
$router->delete('/api/v1/terminal/{id}', [TerminalController::class, 'delete']);

$router->post('/api/v1/terminal/activate', [TerminalController::class, 'activate']);



$router->group(['middleware' => [AuthMiddleware::class]], function($router) {

    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users', [UserRegistrationController::class, 'register']);

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
});
