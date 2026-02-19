<?php

use App\Modules\Users\Controllers\UserRegistrationController;
/*
|--------------------------
|  API Routes
|--------------------------
*/

$router->get('/api/users', [UserRegistrationController::class, 'index']); //create an instance of controller and call the index method
$router->post('/api/users', [UserRegistrationController::class, 'store']);
$router->get('/api/users/{id}', [UserRegistrationController::class, 'show']);

?>