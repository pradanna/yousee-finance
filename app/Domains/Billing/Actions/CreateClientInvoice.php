<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Project\Models\Project;
use Illuminate\Support\Facades\DB;

class CreateClientInvoice
{
    /**
     * Idempotent: satu Invoice per Project. Kalau belum ada, bikin draft +
     * 1 item senilai contract_value (sumber kebenaran nilai tagihan tetap
     * Project::contract_value, bukan apportionment per titik lokasi —
     * itu urusan cetak PO/invoice PDF, bukan struktur data invoice).
     * Dipanggil dari alur "Atur Skema Pembayaran", sebelum GeneratePaymentTerms.
     */
    public function execute(Project $project): Invoice
    {
        return DB::transaction(function () use ($project) {
            $invoice = Invoice::where('project_id', $project->id)->first();

            if (! $invoice) {
                $invoice = Invoice::create([
                    'client_id' => $project->client_id,
                    'sales_id' => $project->sales_id,
                    'project_id' => $project->id,
                    'fiscal_mode' => $project->fiscal_mode,
                    'transaction_date' => now(),
                    'status' => InvoiceStatus::DRAFT,
                ]);
            }

            if ($invoice->items()->doesntExist()) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'name' => $project->name,
                    'quantity' => 1,
                    'price' => $project->contract_value,
                ]);
                $invoice->refresh();
            }

            return $invoice;
        });
    }
}
