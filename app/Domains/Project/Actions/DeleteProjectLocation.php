<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\ProjectLocation;

class DeleteProjectLocation
{
    /**
     * Hapus titik lokasi. Model menolak (DomainException) jika titik lokasi
     * sudah punya purchase_order_id.
     */
    public function execute(ProjectLocation $location): ?bool
    {
        return $location->delete();
    }
}
