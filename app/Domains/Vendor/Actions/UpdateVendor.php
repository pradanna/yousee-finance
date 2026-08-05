<?php

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class UpdateVendor
{
    /**
     * Update an existing vendor.
     *
     * @param \App\Domains\Vendor\Models\Vendor $vendor
     * @param array $data
     * @return \App\Domains\Vendor\Models\Vendor
     */
    public function execute(Vendor $vendor, array $data): Vendor
    {
        $vendor->update([
            'name' => $data['name'] ?? $vendor->name,
            'npwp' => array_key_exists('npwp', $data) ? $data['npwp'] : $vendor->npwp,
        ]);

        return $vendor;
    }
}
