<?php

namespace App\Domains\Identity\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case PIMPINAN = 'pimpinan';
    case AKUNTAN = 'akuntan';
    case STAFF = 'staff';
}
