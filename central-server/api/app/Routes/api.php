<?php

use App\Modules\Users\Controllers\UserRegistrationController;
/*
|--------------------------
|  API Routes
|--------------------------
*/

$router->get('/', [UserRegistrationController::class, 'index']); 
$router->post('/users', [UserRegistrationController::class, 'register']);
// $router->get('/api/users/{id}', [UserRegistrationController::class, 'show']);

