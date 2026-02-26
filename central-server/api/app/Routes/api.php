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
$router->post('/api/v1/login', [AuthController::class, 'login']);
$router->post('/api/v1/logout', [AuthController::class, 'logout']);


/*
|--------------------------
|  Protected Routes
|--------------------------
*/

$router->group(['middleware' => [AuthMiddleware::class]], function($router) {

    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users', [UserRegistrationController::class, 'register']);

});
