<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\Project;

class DeleteProject
{
    /**
     * Batalkan Project (status menjadi cancelled) & hapus PO / Invoice yang belum ada pembayaran.
     *
     * @throws \DomainException jika proyek bukan berstatus draft atau sudah terdapat pembayaran.
     */
    public function execute(Project $project): ?bool
    {
        // 1. Cek status proyek (hanya status Draft yang boleh dibatalkan)
        $statusCode = $project->status instanceof \App\Domains\Project\Enums\ProjectStatus
            ? $project->status->value
            : (string) $project->status;

        if ($statusCode !== 'draft') {
            $statusLabel = match ($statusCode) {
                'active' => 'Aktif / Sedang Tayang',
                'completed' => 'Selesai',
                'cancelled' => 'Sudah Dibatalkan',
                default => ucfirst($statusCode),
            };
            throw new \DomainException("Proyek berstatus '{$statusLabel}' tidak dapat dibatalkan. Hanya proyek berstatus 'Draft' yang dapat dibatalkan.");
        }

        // 2. Cek pembayaran vendor (PO settlements)
        $hasVendorPayment = $project->purchaseOrders()
            ->whereHas('paymentPlan.terms.settlements')
            ->exists();

        // 3. Cek pembayaran client invoice
        $hasClientPayment = $project->invoices()
            ->where(function ($q) {
                $q->whereHas('paymentPlan.terms', function ($termQ) {
                    $termQ->where('status', 'paid');
                })->orWhere('status', 'paid');
            })
            ->exists();

        if ($hasVendorPayment || $hasClientPayment) {
            throw new \DomainException('Proyek tidak dapat dibatalkan karena sudah memiliki riwayat mutasi pembayaran aktif (PO Vendor atau Invoice Client).');
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($project) {
            // A. Lepaskan referensi purchase_order_id pada titik lokasi
            $project->locations()->update(['purchase_order_id' => null]);

            // B. Hapus Purchase Orders beserta payment plan & items terkait
            foreach ($project->purchaseOrders as $po) {
                if ($po->paymentPlan) {
                    $po->paymentPlan->terms()->delete();
                    $po->paymentPlan->delete();
                }
                $po->items()->delete();
                $po->delete();
            }

            // C. Hapus Invoices beserta payment plan & items terkait
            foreach ($project->invoices as $invoice) {
                if ($invoice->paymentPlan) {
                    $invoice->paymentPlan->terms()->delete();
                    $invoice->paymentPlan->delete();
                }
                $invoice->delete();
            }

            // D. Ubah status proyek menjadi Cancelled (Batal)
            $project->status = \App\Domains\Project\Enums\ProjectStatus::CANCELLED;
            $project->save();

            return true;
        });
    }
}
