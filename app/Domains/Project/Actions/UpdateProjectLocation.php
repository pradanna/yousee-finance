<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;

class UpdateProjectLocation
{
    /**
     * Update titik lokasi. Kalau lokasi sudah punya purchase_order_id,
     * ProjectLocation::boot() menolak perubahan ke field selain
     * lighting/top_notes (DomainException).
     *
     * @param array<string, mixed> $data
     */
    public function execute(ProjectLocation $location, array $data): ProjectLocation
    {
        return DB::transaction(function () use ($location, $data) {
            $location->update([
                'vendor_id' => $data['vendor_id'] ?? $location->vendor_id,
                'area' => $data['area'] ?? $location->area,
                'description' => $data['description'] ?? $location->description,
                'type' => $data['type'] ?? $location->type,
                'size' => $data['size'] ?? $location->size,
                'orientation' => array_key_exists('orientation', $data) ? $data['orientation'] : $location->orientation,
                'lighting' => array_key_exists('lighting', $data) ? $data['lighting'] : $location->lighting,
                'qty' => $data['qty'] ?? $location->qty,
                'vendor_cost' => array_key_exists('vendor_cost', $data)
                    ? $this->resolveDpp($location->project->fiscal_mode, (float) $data['vendor_cost'], (bool) ($data['is_ppn_inclusive'] ?? false))
                    : $location->vendor_cost,
                'top_notes' => array_key_exists('top_notes', $data) ? $data['top_notes'] : $location->top_notes,
            ]);

            return $location;
        });
    }

    private function resolveDpp(FiscalMode $fiscalMode, float $inputValue, bool $isInclusive): float
    {
        if ($fiscalMode !== FiscalMode::PPN) {
            return $inputValue;
        }

        return $isInclusive ? round($inputValue / 1.11, 2) : $inputValue;
    }
}
