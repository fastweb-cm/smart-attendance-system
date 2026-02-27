<?php

namespace App\Services;

class TokenService
{
    public static function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(64));
    }

    public static function hashToken(string $token): string
    {
        return password_hash($token, PASSWORD_BCRYPT);
    }

    public static function verifyToken(string $token, string $tokenHash): bool
    {
        return password_verify($tokenHash, $token);
    }
}
