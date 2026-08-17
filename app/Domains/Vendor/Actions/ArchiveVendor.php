<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class ArchiveVendor
{
    /**
     * Archive or unarchive a vendor.
     */
    public function execute(Vendor $vendor, bool $isArchived = true): Vendor
    {
        $vendor->update([
            'is_archived' => $isArchived,
        ]);

        return $vendor;
    }
}
