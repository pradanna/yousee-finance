<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use DomainException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ImportProjectLocations
{
    /**
     * Bulk import multiple locations into a project in a single transaction.
     *
     * @param array<int, array<string, mixed>> $items
     * @return Collection<int, ProjectLocation>
     */
    public function execute(Project $project, array $items): Collection
    {
        $isProjectPpn = $project->fiscal_mode instanceof FiscalMode
            ? $project->fiscal_mode === FiscalMode::PPN
            : $project->fiscal_mode === FiscalMode::PPN->value;

        if ($isProjectPpn) {
            $vendorIds = array_unique(array_filter(array_column($items, 'vendor_id')));
            $nonPkpVendors = Vendor::whereIn('id', $vendorIds)->get()->filter(fn (Vendor $v) => ! $v->isPkp());
            if ($nonPkpVendors->isNotEmpty()) {
                $names = $nonPkpVendors->pluck('name')->implode(', ');
                throw new DomainException("Vendor '{$names}' berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN.");
            }
        }

        return DB::transaction(function () use ($project, $items) {
            $createdLocations = new Collection();

            // Lock and resolve current maximum sequence number
            $existingCodes = ProjectLocation::where('project_id', $project->id)
                ->lockForUpdate()
                ->pluck('code');

            $maxSeq = 0;
            foreach ($existingCodes as $code) {
                $numPart = substr($code, 4); // Strip 'LOC-'
                if (is_numeric($numPart)) {
                    $maxSeq = max($maxSeq, (int) $numPart);
                }
            }

            foreach ($items as $item) {
                $maxSeq++;
                $locationCode = 'LOC-' . str_pad((string) $maxSeq, 3, '0', STR_PAD_LEFT);

                $location = ProjectLocation::create([
                    'project_id' => $project->id,
                    'vendor_id' => $item['vendor_id'],
                    'code' => $locationCode,
                    'area' => (string) $item['area'],
                    'description' => (string) $item['description'],
                    'type' => (string) $item['type'],
                    'size' => (string) $item['size'],
                    'orientation' => ! empty($item['orientation']) ? (string) $item['orientation'] : null,
                    'lighting' => ! empty($item['lighting']) ? (string) $item['lighting'] : null,
                    'qty' => isset($item['qty']) ? (int) $item['qty'] : 1,
                    'vendor_cost' => $this->resolveDpp(
                        $project,
                        (float) $item['vendor_cost'],
                        (bool) ($item['is_ppn_inclusive'] ?? false)
                    ),
                    'top_notes' => ! empty($item['top_notes']) ? (string) $item['top_notes'] : null,
                ]);

                $createdLocations->push($location);
            }

            return $createdLocations;
        });
    }

    /**
     * Resolve net DPP value from input cost based on project fiscal mode.
     */
    private function resolveDpp(Project $project, float $inputValue, bool $isInclusive): float
    {
        if ($project->fiscal_mode !== FiscalMode::PPN) {
            return $inputValue;
        }

        return $isInclusive ? round($inputValue / 1.11, 2) : $inputValue;
    }
}
