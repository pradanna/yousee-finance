<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Actions;

use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\ProjectLocation;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelPurchaseOrder
{
    /**
     * Batalkan dan hapus Purchase Order vendor yang belum memiliki pembayaran.
     * Mengembalikan status titik lokasi menjadi belum terbit PO (purchase_order_id = null),
     * membatalkan/menghapus jurnal pengakuan hutang awal, serta menghapus PO.
     *
     * @throws DomainException jika PO sudah ada pembayaran
     */
    public function execute(PurchaseOrder $po): bool
    {
        // 1. Cek apakah ada pembayaran termin (settlement)
        $hasSettlements = $po->paymentPlan?->terms()
            ->where(function ($q) {
                $q->whereHas('settlements')
                    ->orWhere('status', PaymentTermStatus::PAID->value);
            })
            ->exists();

        if ($hasSettlements) {
            throw new DomainException("PO {$po->po_number} tidak dapat dibatalkan/dihapus karena sudah memiliki riwayat mutasi pembayaran aktif.");
        }

        return DB::transaction(function () use ($po): bool {
            // A. Lepaskan referensi PO pada seluruh titik lokasi
            ProjectLocation::where('purchase_order_id', $po->id)
                ->update(['purchase_order_id' => null]);

            // B. Hapus jurnal akuntansi pengakuan hutang PO awal jika ada
            // (Menggunakan delete langsung di DB transaction internal karena ini pembatalan PO unpaid)
            $journals = JournalEntry::where('source_type', PurchaseOrder::class)
                ->where('source_id', $po->id)
                ->get();

            foreach ($journals as $journal) {
                $journal->items()->delete();
                // Bypass boot check deleting using direct query
                DB::table('journal_entries')->where('id', $journal->id)->delete();
            }

            // C. Hapus Payment Plan & Terms
            if ($po->paymentPlan) {
                $po->paymentPlan->terms()->delete();
                $po->paymentPlan->delete();
            }

            // D. Hapus PO Items & PO
            $po->items()->delete();
            $po->delete();

            Log::info("Purchase Order {$po->po_number} cancelled and deleted.", [
                'purchase_order_id' => $po->id,
                'project_id'        => $po->project_id,
            ]);

            return true;
        });
    }
}
