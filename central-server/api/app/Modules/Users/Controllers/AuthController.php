<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Modules\Users\Models\Users;
use App\Services\JWTService;
use App\Services\TokenService;
use App\Middleware\AuthMiddleware;

class AuthController extends controller
{
    public function login()
    {
        if ($this->request() === 'POST'){
            $users = new Users();

            $data = $this->getJsonInput(); // decode json input

            $user = $users->findByUsername($data['username']);

            if(!$user || !password_verify($data['password'], $user['password_hash'])){
                $this->json([
                    'success' => false,
                    'message' => 'Invalid Username or Password' 
                ],401); //authorised
            }

            $jwtService = new JWTService();
            $tokenService = new TokenService();

            //generate the access token
            $accessToken = $jwtService->generateAccessToken($user);

            $stayloggedin = $data['stayloggedin'] ?? false;

            //if the user wants to remain logged in
            if($stayloggedin){
                //generate the refresh token
                $refreshToken = $tokenService->generateRefreshToken();
                $hashedRefresh = $tokenService->hashToken($refreshToken);

                //store this user hash refresh token in db
                $users->storeRefresh($user['id'],$hashedRefresh);

                //store the refresh token in cookie as http-only and secure
                setcookie(
                    "refresh_token",
                    $refreshToken,
                    [
                        'expires' => time() + 86400 * 30, //30 days
                        'path' => '/', //only send cookie to this endpoint
                        'httponly' => true, //prevent Javascript access
                        // 'secure' => true, HTTPS only
                        'samesite' => 'Strict',
                        'secure' => false
                    ]
                    );
            }

            $this->json([
                'success' => true,
                'accessToken' => $accessToken,
                'user' => [
                    'id' => $user['id'],
                    'role' => $user['role'],
                    'username' => $user['username'],
                    'email'=> $user['email'],
                ]
                ]);
        }else{
            $this->json([
                'status' => 'Bad request',
            ],400);
        }
    }

    //logout
    public static function logout()
    {
        $users = new Users();
        $token = $_COOKIE['refresh_token'];
        if (isset($token)) {
            $users->revokeByToken($token);
        }

        setcookie("refresh_token", "", time() - 3600, "/");

        self::json([
            'success' => true,
            'message' => 'logout successfully'
        ]);
    }

    public function me()
    {
        $token = self::getAuthHeader();
        $payload = AuthMiddleware::handle();
        error_log(json_encode($payload));

        if (!$payload) {
            $this->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $this->json([
            'success' => true,
            'accessToken' => $token,
            'user' => [
                'id' => $payload['sub'],
                'role' => $payload['role'],
                'username' => $payload['username'],
                'email' => $payload['email'],
            ]
        ]);
    }
}
