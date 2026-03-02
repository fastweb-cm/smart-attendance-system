<?php
namespace App\Middleware;

use App\Core\Controller;
use App\Services\JWTService;
use App\Services\TokenService;
use App\Modules\Users\Models\Users;
use Exception;

class AuthMiddleware extends controller {
    public static function handle()
    {

        $token = self::getAuthHeader();

        try{
            $jwtService = new JWTService();
            return $jwtService->validateAccessToken($token);
        }catch(Exception $e){
            self::json([
                "status" => 'error',
                "message" => "Access token expired"
            ],401);
        }
    }

    public static function attempRefresh()
    {
        $users = new Users();
        if (!isset($_COOKIE['refresh_token'])) {
            self::json([
                'status'=> 'error',
                'message' => 'Session expired'
            ],401); //unauthorized
        }

        try{
            $refreshToken = $_COOKIE['refresh_token']; //extract the refresh token from cookie
            $stored = $users->findValidByUserToken($refreshToken);

            if (!$stored) {
                self::json([
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ],401);
            }

            $user = $users->findAdmin($stored['user_id']);

            $jwtService = new JWTService();
            $tokenService = new TokenService();

            //ROTATE refresh token
            if($users->revokeToken($stored['id'])){
                $newRefresh = $tokenService->generateRefreshToken();
                $newHash = $tokenService->hashToken($newRefresh);

                $users->storeRefresh($user['id'],$newHash);

                //store the refresh token in cookie as http-only and secure
                setcookie(
                    "refresh_token",
                    $newRefresh,
                    [
                        'expires' => time() + 86400 * 30, //30 days
                        'path' => '/', //only send cookie to this endpoint
                        'httponly' => true, //prevent Javascript access
                        // 'secure' => true, HTTPS only
                        'samesite' => 'Strict',
                        'secure' => false
                    ]
                    );
                $newAccess = $jwtService->generateAccessToken($user);
            
                // send the new access token to the frontend
                self::json([
                    'success' => true,
                    'accessToken' => $newAccess,
                    'user' => [
                        'id' => $user['id'],
                        'role' => $user['role'],
                        'username' => $user['username'],
                        'email'=> $user['email'],
                    ]
                ]);
            }
        }catch(Exception $e){
            self::json([
                'status'=> 'error',
                'message' => 'Session expired'
            ],401);
        }
    }

}
