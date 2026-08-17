<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;

class CreateVendor
{
    /**
     * Create a new vendor.
     *
     * @param array<string, mixed> $data
     */
    public function execute(array $data): Vendor
    {
        return Vendor::create([
            'name' => (string) $data['name'],
            'npwp' => ! empty($data['npwp']) ? (string) $data['npwp'] : null,
            'phone' => ! empty($data['phone']) ? (string) $data['phone'] : null,
            'email' => ! empty($data['email']) ? (string) $data['email'] : null,
            'address' => ! empty($data['address']) ? (string) $data['address'] : null,
            'is_archived' => false,
        ]);
    }
}
