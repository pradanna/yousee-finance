<?php

declare(strict_types=1);

namespace App\Domains\Project\Enums;

enum LocationType: string
{
    case BILLBOARD = 'Billboard';
    case VIDEOTRON = 'Videotron';
    case BALIHO = 'Baliho';
    case NEONBOX = 'Neonbox';
}
