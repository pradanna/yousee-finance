<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class DeleteVendor
{
    /**
     * Delete (soft delete) a vendor.
     */
    public function execute(Vendor $vendor): ?bool
    {
        return $vendor->delete();
    }
}
