<?php

namespace App\Domains\Shared\Enums;

enum FiscalMode: string
{
    case PPN = 'ppn';
    case NON_PPN = 'non-ppn';
}
