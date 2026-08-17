<?php

declare(strict_types=1);

namespace App\Domains\Billing\Enums;

enum PaymentScheme: string
{
    case FULL = 'full';
    case DP = 'dp';
    case TERMIN = 'termin';
    case INSTALLMENT = 'installment';
}
