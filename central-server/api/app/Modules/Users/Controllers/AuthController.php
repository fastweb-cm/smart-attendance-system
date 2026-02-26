<?php
namespace App\Modules\Users\Controllers;

use App\Core\Controller;
use App\Modules\Users\Models\Users;
use App\Services\JWTService;
use App\Services\TokenService;

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

            //if the user wants to remain logged in
            if(isset($data['stayloggedin'])){
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
                        'samesite' => 'Strict'
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
        if (isset($_COOKIE['refresh_token'])) {
            //let hash the toke using same algo with used for the stored hash
            $token = Tokenservice::hashToken($_COOKIE['refresh_token']);
            $users->revokeByToken($token);
        }

        setcookie("refresh_token", "", time() - 3600, "/");

        self::json([
            'success' => true,
            'message' => 'logout successfully'
        ]);
    }
}
