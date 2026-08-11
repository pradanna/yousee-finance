<?php

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class ArchiveVendor
{
    /**
     * Archive or unarchive a vendor.
     *
     * @param \App\Domains\Vendor\Models\Vendor $vendor
     * @param bool $isArchived
     * @return \App\Domains\Vendor\Models\Vendor
     */
    public function execute(Vendor $vendor, bool $isArchived = true): Vendor
    {
        $vendor->update([
            'is_archived' => $isArchived,
        ]);

        return $vendor;
    }
}
