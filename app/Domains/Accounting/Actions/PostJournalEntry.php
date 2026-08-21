<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use DomainException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PostJournalEntry
{
    /**
     * Post a balanced journal entry to the general ledger.
     *
     * @param array{
     *     fiscal_mode: FiscalMode|string,
     *     transaction_date: string,
     *     description?: string|null,
     *     project_id?: string|null,
     *     posted_by?: string|null,
     *     is_reversal?: bool,
     *     reverses_journal_id?: string|null,
     * } $headerData
     * @param array<int, array{
     *     account_id: string,
     *     debit?: float|int,
     *     credit?: float|int,
     *     project_id?: string|null,
     *     memo?: string|null,
     * }> $items
     * @param Model|null $source Polymorphic source model (Invoice, PurchaseOrder, PaymentSettlement, etc.)
     */
    public function execute(array $headerData, array $items, ?Model $source = null): JournalEntry
    {
        if (empty($items)) {
            throw new DomainException('Journal entry must have at least 2 line items.');
        }

        $fiscalMode = $headerData['fiscal_mode'] instanceof FiscalMode
            ? $headerData['fiscal_mode']
            : FiscalMode::from($headerData['fiscal_mode']);

        $txDate = $headerData['transaction_date'];
        $dateObj = new \DateTimeImmutable($txDate);
        $month = (int) $dateObj->format('n');
        $year = (int) $dateObj->format('Y');

        // 1. INVARIANT CHECK: Closing Period
        if (ClosingPeriod::isClosed($month, $year, $fiscalMode)) {
            throw new DomainException("Cannot post journal entry into closed accounting period {$month}-{$year} ({$fiscalMode->value}).");
        }

        // 2. INVARIANT CHECK: Balance Debit == Credit
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($items as $idx => $line) {
            $debit = (float) ($line['debit'] ?? 0);
            $credit = (float) ($line['credit'] ?? 0);

            if (($debit <= 0 && $credit <= 0) || ($debit > 0 && $credit > 0)) {
                throw new DomainException("Line #".($idx + 1)." must have either debit OR credit greater than 0.");
            }

            // 3. INVARIANT CHECK: Strict Leaf Account Rule
            $account = ChartOfAccount::find($line['account_id']);
            if (! $account) {
                throw new DomainException("Account with ID '{$line['account_id']}' not found.");
            }

            if (! $account->isLeaf()) {
                throw new DomainException("Cannot post to header account '{$account->code} - {$account->name}'. Only leaf accounts can be assigned to journal entries.");
            }

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new DomainException("Journal entry is not balanced. Total Debit ({$totalDebit}) != Total Credit ({$totalCredit}).");
        }

        return DB::transaction(function () use ($headerData, $items, $source, $fiscalMode, $txDate, $year, $month, $totalDebit, $totalCredit): JournalEntry {
            // Generate Journal Number: JE-YYYYMM-XXXX
            $prefix = sprintf('JE-%04d%02d-', $year, $month);
            $lastEntry = JournalEntry::where('number', 'like', $prefix.'%')
                ->orderByDesc('number')
                ->lockForUpdate()
                ->first();

            $sequence = 1;
            if ($lastEntry && preg_match('/-(\d{4})$/', $lastEntry->number, $matches)) {
                $sequence = ((int) $matches[1]) + 1;
            }
            $number = sprintf('%s%04d', $prefix, $sequence);

            $journal = JournalEntry::create([
                'number'              => $number,
                'source_type'         => $source ? get_class($source) : null,
                'source_id'           => $source?->getKey(),
                'project_id'          => $headerData['project_id'] ?? null,
                'fiscal_mode'         => $fiscalMode,
                'transaction_date'    => $txDate,
                'description'         => $headerData['description'] ?? null,
                'is_reversal'         => $headerData['is_reversal'] ?? false,
                'reverses_journal_id' => $headerData['reverses_journal_id'] ?? null,
                'posted_by'           => $headerData['posted_by'] ?? null,
            ]);

            foreach ($items as $line) {
                JournalEntryItem::create([
                    'journal_entry_id' => $journal->id,
                    'account_id'       => $line['account_id'],
                    'project_id'       => $line['project_id'] ?? ($headerData['project_id'] ?? null),
                    'debit'            => $line['debit'] ?? 0,
                    'credit'           => $line['credit'] ?? 0,
                    'memo'             => $line['memo'] ?? null,
                ]);
            }

            // Catat ke Audit Log Jurnal
            $event = ($headerData['is_reversal'] ?? false) ? 'reversal' : 'created';
            AuditLog::create([
                'auditable_type' => JournalEntry::class,
                'auditable_id'   => $journal->id,
                'event'          => $event,
                'user_id'        => auth()->id(),
                'description'    => ($headerData['is_reversal'] ?? false)
                    ? "Membuat Jurnal Pembalik [{$journal->number}] senilai Rp " . number_format($totalDebit, 0, ',', '.') . " ({$journal->description})"
                    : "Posting Jurnal Umum [{$journal->number}] senilai Rp " . number_format($totalDebit, 0, ',', '.') . " ({$journal->description})",
                'properties'     => [
                    'journal_number'   => $journal->number,
                    'fiscal_mode'      => $fiscalMode->value,
                    'transaction_date' => $txDate,
                    'total_debit'      => $totalDebit,
                    'total_credit'     => $totalCredit,
                    'line_count'       => count($items),
                    'is_reversal'      => (bool) ($headerData['is_reversal'] ?? false),
                ],
            ]);

            return $journal->load(['items.account', 'project']);
        });
    }
}
