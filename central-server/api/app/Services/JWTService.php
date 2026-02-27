<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTService
{
    private string $secret;
    private string $issuer;

    public function __construct()
    {
        $config = require __DIR__ . '/../../config/jwt.php';
        $this->secret = $config['secret'];
        $this->issuer = $config['issuer'];

    }

    public function generateAccessToken($user): string
    {
        $payload = [
            'iss' => $this->issuer, //issuer
            'iat' => time(), // the time when the token was generated
            'exp' => time() + 1800, // 30 minutes 
            'sub' => $user['id'],
            'role' => $user['role']
        ];

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function validateAccessToken(string $token)
    {
        return JWT::decode($token, new Key($this->secret, 'HS256'));
    }
}
