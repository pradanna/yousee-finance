<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssueClientInvoice
{
    /**
     * Terbitkan Invoice draft milik Project (status draft -> issued),
     * generate invoice_number, dan naikkan status Project draft -> active
     * (domain-dictionary.md §2 — project auto-transition saat invoice terbit).
     */
    public function execute(Project $project): Invoice
    {
        return DB::transaction(function () use ($project) {
            $invoice = Invoice::where('project_id', $project->id)->first();

            if (! $invoice) {
                throw new \DomainException('Invoice belum disiapkan. Atur skema pembayaran terlebih dahulu.');
            }
            if ($invoice->status !== InvoiceStatus::DRAFT) {
                throw new \DomainException('Invoice sudah diterbitkan.');
            }
            if (is_null($invoice->paymentPlan)) {
                throw new \DomainException('Skema pembayaran belum diatur.');
            }

            $invoice->update([
                'invoice_number' => $this->generateInvoiceNumber($project->fiscal_mode),
                'status' => InvoiceStatus::ISSUED,
            ]);

            if ($project->status === ProjectStatus::DRAFT) {
                $project->update(['status' => ProjectStatus::ACTIVE]);
            }

            Log::info('Client invoice issued', [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'project_id' => $project->id,
            ]);

            return $invoice->fresh();
        });
    }

    private function generateInvoiceNumber(FiscalMode|string $fiscalMode): string
    {
        $mode = $fiscalMode instanceof FiscalMode ? $fiscalMode : FiscalMode::from($fiscalMode);
        $tag = $mode === FiscalMode::PPN ? 'INV' : 'INV-NP';
        $now = now();

        $sequence = Invoice::whereNotNull('invoice_number')
            ->whereBetween('updated_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->lockForUpdate()
            ->count() + 1;

        $seq = str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);

        return "{$tag}-{$now->format('m')}/{$now->format('y')}/{$seq}";
    }
}
