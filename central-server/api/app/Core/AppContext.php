<?php

namespace App\Core;

class AppContext
{
    private static ?array $currentUser = null;

    /**
     * Store the authenticated user's data for this execution thread
     */
    public static function setUser(array $user): void
    {
        self::$currentUser = $user;
    }

    /**
     * Retrieve the current authenticated user array
     */
    public static function getUser(): ?array
    {
        return self::$currentUser;
    }

    /**
     * Direct helper to grab just the dynamic database ID of the user
     */
    public static function getUserId(): ?int
    {
        if (!self::$currentUser) {
            return null;
        }

        // Prioritize standard database column, fall back to JWT claim key 'sub'
        if (isset(self::$currentUser['id'])) {
            return (int)self::$currentUser['id'];
        }
        if (isset(self::$currentUser['sub'])) {
            return (int)self::$currentUser['sub'];
        }

        return null;
    }

    /**
     * Direct helper to grab the printable name of the user
     */
    public static function getUserName(): string
    {
        if (!self::$currentUser) {
            return 'System/Automated Task';
        }
        
        // 1. Try explicit database column combinations
        $fname = self::$currentUser['fname'] ?? '';
        $lname = self::$currentUser['lname'] ?? '';
        $fullName = trim("$fname $lname");
        if (!empty($fullName)) {
            return $fullName;
        }

        // 2. Fall back to JWT custom username claim
        if (!empty(self::$currentUser['username'])) {
            return (string)self::$currentUser['username'];
        }

        // 3. Fall back to email if all else fails
        if (!empty(self::$currentUser['email'])) {
            return (string)self::$currentUser['email'];
        }

        return 'Authorized Admin';
    }
}
