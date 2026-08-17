<?php

declare(strict_types=1);

namespace App\Domains\Project\Enums;

enum LocationLighting: string
{
    case BERLAMPU = 'Berlampu';
    case TIDAK_BERLAMPU = 'Tidak Berlampu';
}
