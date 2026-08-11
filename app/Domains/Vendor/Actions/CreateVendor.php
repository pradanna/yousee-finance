<?php

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class CreateVendor
{
    /**
     * Create a new vendor.
     *
     * @param array $data
     * @return \App\Domains\Vendor\Models\Vendor
     */
    public function execute(array $data): Vendor
    {
        return Vendor::create([
            'name' => $data['name'],
            'npwp' => $data['npwp'] ?? null,
            'is_archived' => false,
        ]);
    }
}
