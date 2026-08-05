<?php

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class DeleteVendor
{
    /**
     * Delete (soft delete) a vendor.
     *
     * @param \App\Domains\Vendor\Models\Vendor $vendor
     * @return bool|null
     */
    public function execute(Vendor $vendor): ?bool
    {
        return $vendor->delete();
    }
}
