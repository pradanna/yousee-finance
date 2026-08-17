<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class UpdateVendor
{
    /**
     * Update an existing vendor.
     *
     * @param array<string, mixed> $data
     */
    public function execute(Vendor $vendor, array $data): Vendor
    {
        $updateData = [];

        if (array_key_exists('name', $data)) {
            $updateData['name'] = (string) $data['name'];
        }

        if (array_key_exists('npwp', $data)) {
            $updateData['npwp'] = ! empty($data['npwp']) ? (string) $data['npwp'] : null;
        }

        if (array_key_exists('phone', $data)) {
            $updateData['phone'] = ! empty($data['phone']) ? (string) $data['phone'] : null;
        }

        if (array_key_exists('email', $data)) {
            $updateData['email'] = ! empty($data['email']) ? (string) $data['email'] : null;
        }

        if (array_key_exists('address', $data)) {
            $updateData['address'] = ! empty($data['address']) ? (string) $data['address'] : null;
        }

        $vendor->update($updateData);

        return $vendor;
    }
}
