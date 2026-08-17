<?php

declare(strict_types=1);

namespace App\Domains\Billing\Enums;

enum InvoiceStatus: string
{
    case DRAFT = 'draft';
    case ISSUED = 'issued';
    case PAID = 'paid';
}
