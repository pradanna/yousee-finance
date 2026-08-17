<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Actions;

use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Procurement\Models\PurchaseOrderItem;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssueVendorPurchaseOrder
{
    /**
     * Terbitkan 1 PO yang meng-cover satu atau beberapa titik lokasi dari
     * vendor yang sama (single-location dan bulk-per-vendor di FE keduanya
     * lewat method ini — bulk cuma ngirim lebih dari 1 location_id).
     *
     * @param list<string> $locationIds
     */
    public function execute(Project $project, Vendor $vendor, array $locationIds, string $transactionDate): PurchaseOrder
    {
        return DB::transaction(function () use ($project, $vendor, $locationIds, $transactionDate) {
            $locations = ProjectLocation::whereIn('id', $locationIds)
                ->lockForUpdate()
                ->get();

            if ($locations->count() !== count($locationIds)) {
                throw new \DomainException('Salah satu titik lokasi tidak ditemukan.');
            }

            foreach ($locations as $location) {
                if ($location->project_id !== $project->id) {
                    throw new \DomainException('Titik lokasi tidak termasuk dalam proyek ini.');
                }
                if ($location->vendor_id !== $vendor->id) {
                    throw new \DomainException('Titik lokasi tidak sesuai dengan vendor yang dipilih.');
                }
                if (! is_null($location->purchase_order_id)) {
                    throw new \DomainException('Titik lokasi sudah memiliki PO.');
                }
            }

            $po = PurchaseOrder::create([
                'po_number' => $this->generatePoNumber($project->fiscal_mode),
                'vendor_id' => $vendor->id,
                'project_id' => $project->id,
                'fiscal_mode' => $project->fiscal_mode,
                'transaction_date' => $transactionDate,
                'issued_at' => now(),
                'status' => PurchaseOrderStatus::ISSUED,
            ]);

            foreach ($locations as $location) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'project_location_id' => $location->id,
                    'name' => $location->description,
                    'quantity' => $location->qty,
                    'price' => $location->vendor_cost,
                ]);

                $location->update(['purchase_order_id' => $po->id]);
            }

            Log::info('Vendor PO issued', [
                'purchase_order_id' => $po->id,
                'project_id' => $project->id,
                'vendor_id' => $vendor->id,
                'location_ids' => $locationIds,
            ]);

            return $po->fresh(['items', 'vendor']);
        });
    }

    private function generatePoNumber(FiscalMode|string $fiscalMode): string
    {
        $mode = $fiscalMode instanceof FiscalMode ? $fiscalMode : FiscalMode::from($fiscalMode);
        $tag = $mode === FiscalMode::PPN ? 'PTSSI-PO' : 'YS-PO';
        $now = now();

        $sequence = PurchaseOrder::whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->lockForUpdate()
            ->count() + 1;

        $seq = str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);

        return "{$seq}/{$tag}/{$now->format('m')}/{$now->format('y')}";
    }
}
