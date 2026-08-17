<?php

declare(strict_types=1);

namespace App\Domains\Billing\Enums;

enum PaymentTermStatus: string
{
    case UNPAID = 'unpaid';
    case PARTIAL = 'partial';
    case PAID = 'paid';
}
