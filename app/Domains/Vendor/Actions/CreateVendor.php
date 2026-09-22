<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Actions;

use App\Domains\Vendor\Models\Vendor;
use DomainException;

class CreateVendor
{
    /**
     * Create a new vendor.
     *
     * @param array<string, mixed> $data
     */
    public function execute(array $data): Vendor
    {
        $isPkp = filter_var($data['is_pkp'] ?? $data['pkp'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $npwp = trim((string) ($data['npwp'] ?? ''));

        if ($isPkp && $npwp === '') {
            throw new DomainException('NPWP wajib diisi jika vendor berstatus PKP.');
        }

        $code = ! empty($data['code']) ? trim((string) $data['code']) : $this->generateCode();

        return Vendor::create([
            'code' => $code,
            'name' => (string) $data['name'],
            'pic' => ! empty($data['pic']) ? (string) $data['pic'] : null,
            'npwp' => ! empty($data['npwp']) ? (string) $data['npwp'] : null,
            'phone' => ! empty($data['phone']) ? (string) $data['phone'] : null,
            'email' => ! empty($data['email']) ? (string) $data['email'] : null,
            'address' => ! empty($data['address']) ? (string) $data['address'] : null,
            'is_archived' => false,
        ]);
    }

    /**
     * Generate the next vendor code (e.g. VND-0001).
     */
    public function generateCode(): string
    {
        return Vendor::generateNextCode();
    }
}
