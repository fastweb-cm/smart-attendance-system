<?php
declare(strict_types=1);

$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://smartattendance.fastwebcm.local:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true'); 
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

date_default_timezone_set("Africa/Douala");

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Core\Router;

// Load environment (.env)
$dotenv = Dotenv::createImmutable(__DIR__ . '/../'); 
$dotenv->load();

//load app config
$config = require __DIR__ . '/../config/app.php';

//initialize router with config
$router = new Router($config);

//register routes
require_once __DIR__ . '/../app/Routes/api.php';

//run
$router->dispatch();
