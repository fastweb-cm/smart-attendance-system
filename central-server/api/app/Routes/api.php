<?php

use App\Modules\Users\Controllers\UserRegistrationController;
use App\Modules\Users\Controllers\UserController;
/*
|--------------------------
|  API Routes
|--------------------------
*/

$router->get('/', [UserRegistrationController::class, 'index']);
$router->post('/api/v1/users', [UserRegistrationController::class, 'register']);
$router->get('/api/v1/users', [UserController::class, 'index']);
// $router->get('/api/users/{id}', [UserRegistrationController::class, 'show']);
