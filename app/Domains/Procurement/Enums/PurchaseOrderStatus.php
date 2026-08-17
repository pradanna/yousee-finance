<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Enums;

enum PurchaseOrderStatus: string
{
    case DRAFT = 'draft';
    case ISSUED = 'issued';
    case PAID = 'paid';
}
