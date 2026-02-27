<?php

use App\Modules\Users\Controllers\UserRegistrationController;
use App\Modules\Users\Controllers\UserController;
use App\Modules\Users\Controllers\AuthController;
use App\Middleware\AuthMiddleware;

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

$router->group(['middleware' => [AuthMiddleware::class]], function($router) {

    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users', [UserRegistrationController::class, 'register']);

});
