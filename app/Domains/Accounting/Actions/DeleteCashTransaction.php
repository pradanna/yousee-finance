<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ClosingPeriod;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeleteCashTransaction
{
    public function execute(CashTransaction $transaction): void
    {
        $dateStr = $transaction->transaction_date instanceof \DateTimeInterface
            ? $transaction->transaction_date->format('Y-m-d')
            : (string) $transaction->transaction_date;

        $dateObj = new \DateTimeImmutable($dateStr);
        $month = (int) $dateObj->format('n');
        $year = (int) $dateObj->format('Y');

        // 1. INVARIANT CHECK: Closing Period
        if (ClosingPeriod::isClosed($month, $year, $transaction->fiscal_mode)) {
            throw new DomainException("Transaksi tidak dapat dihapus karena periode {$month}-{$year} ({$transaction->fiscal_mode->value}) telah ditutup/dikunci.");
        }

        DB::transaction(function () use ($transaction): void {
            // Hapus file attachment fisik jika ada
            if ($transaction->attachment_path) {
                $fullPath = public_path($transaction->attachment_path);
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
            }

            // Hapus jurnal akuntansi terkait beserta itemnya
            $journal = $transaction->journalEntry;
            if ($journal) {
                \App\Domains\Accounting\Models\JournalEntry::$allowSystemMutation = true;
                try {
                    $journal->items()->delete();
                    $journal->delete();
                } finally {
                    \App\Domains\Accounting\Models\JournalEntry::$allowSystemMutation = false;
                }
            }

            // Catat ke Audit Log sebelum dihapus
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => CashTransaction::class,
                'auditable_id'   => $transaction->id,
                'event'          => 'deleted',
                'user_id'        => auth()->id(),
                'description'    => "Menghapus transaksi [{$transaction->transaction_number}] sebesar Rp " . number_format((float)$transaction->amount, 0, ',', '.') . " beserta jurnal umumnya",
                'properties'     => [
                    'transaction_number' => $transaction->transaction_number,
                    'amount'             => (float) $transaction->amount,
                ],
            ]);

            // Hapus transaksi kas
            $transaction->delete();
        });
    }
}
