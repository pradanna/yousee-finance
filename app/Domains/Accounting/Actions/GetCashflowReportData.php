<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Shared\Enums\FiscalMode;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class GetCashflowReportData
{
    /**
     * Mengekstrak dan menyusun seluruh data mutasi kas, saldo rekening, dan laporan PSAK 2.
     *
     * @param array{
     *     month?: int|string|null,
     *     year?: int|string|null,
     *     start_date?: string|null,
     *     end_date?: string|null,
     *     account_id?: string|null,
     *     fiscal_mode?: string|null,
     *     project_id?: string|null,
     * } $filters
     * @return array<string, mixed>
     */
    public function execute(array $filters = []): array
    {
        $now = Carbon::now();
        $month = isset($filters['month']) && $filters['month'] !== 'all' ? (int) $filters['month'] : (int) $now->month;
        $year = isset($filters['year']) && $filters['year'] !== 'all' ? (int) $filters['year'] : (int) $now->year;
        $fiscalMode = $filters['fiscal_mode'] ?? 'all';
        $selectedAccountId = isset($filters['account_id']) && $filters['account_id'] !== 'all' ? (string) $filters['account_id'] : null;
        $selectedProjectId = isset($filters['project_id']) && $filters['project_id'] !== 'all' ? (string) $filters['project_id'] : null;

        // Tentukan rentang tanggal periode
        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            $startDate = Carbon::parse($filters['start_date'])->startOfDay();
            $endDate = Carbon::parse($filters['end_date'])->endOfDay();
        } else {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
        }

        // 1. Identifikasi Seluruh Akun Leaf Kas & Bank (1110 dan anak-anaknya)
        $parentCashAccount = ChartOfAccount::where('code', '1110')->first();
        $cashBankAccountsQuery = ChartOfAccount::where(function ($q) use ($parentCashAccount) {
            $q->where('code', 'like', '111%')
                ->where('code', '!=', '1110');
            if ($parentCashAccount) {
                $q->orWhere('parent_id', $parentCashAccount->id);
            }
        })->where('is_active', true)->orderBy('code');

        $cashBankAccounts = $cashBankAccountsQuery->get();
        $cashBankAccountIds = $cashBankAccounts->pluck('id')->toArray();
        $cashBankAccountCodes = $cashBankAccounts->pluck('code')->toArray();

        // 2. Kalkulasi Saldo Awal (Beginning Balance) Dinamis Sebelum $startDate
        $accountBalances = [];
        $totalBeginningBalance = 0.0;

        foreach ($cashBankAccounts as $acc) {
            $initialBalanceQuery = JournalEntryItem::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $fiscalMode, $selectedProjectId) {
                    $q->where('transaction_date', '<', $startDate->format('Y-m-d'));
                    if (! empty($fiscalMode) && $fiscalMode !== 'all') {
                        $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
                        if ($fiscalModeEnum) {
                            $q->where('fiscal_mode', $fiscalModeEnum);
                        }
                    }
                    if (! empty($selectedProjectId)) {
                        $q->where('project_id', $selectedProjectId);
                    }
                });

            $sumDebitBefore = (float) $initialBalanceQuery->sum('debit');
            $sumCreditBefore = (float) $initialBalanceQuery->sum('credit');
            $accountOpeningBalance = (float) ($acc->opening_balance ?? 0);

            $accountBegBalance = $accountOpeningBalance + ($sumDebitBefore - $sumCreditBefore);

            $accountBalances[$acc->id] = [
                'id'               => $acc->id,
                'code'             => $acc->code,
                'bankName'         => $acc->name,
                'accountNumber'    => $this->resolveAccountNumber($acc->code),
                'holderName'       => 'Yousee Indonesia',
                'beginningBalance' => $accountBegBalance,
                'inflowTotal'      => 0.0,
                'outflowTotal'     => 0.0,
                'currentBalance'   => $accountBegBalance,
            ];

            $totalBeginningBalance += $accountBegBalance;
        }

        // 3. Query Seluruh Mutasi Kas & Bank pada Periode Terpilih
        $journalItemsQuery = JournalEntryItem::with([
            'journalEntry.items.account',
            'journalEntry.project:id,code,name',
            'journalEntry.postedBy:id,name',
            'account',
        ])
            ->whereIn('account_id', $cashBankAccountIds)
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate, $fiscalMode, $selectedProjectId) {
                $q->whereBetween('transaction_date', [
                    $startDate->format('Y-m-d'),
                    $endDate->format('Y-m-d'),
                ]);
                if (! empty($fiscalMode) && $fiscalMode !== 'all') {
                    $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
                    if ($fiscalModeEnum) {
                        $q->where('fiscal_mode', $fiscalModeEnum);
                    }
                }
                if (! empty($selectedProjectId)) {
                    $q->where('project_id', $selectedProjectId);
                }
            });

        if ($selectedAccountId) {
            $journalItemsQuery->where('account_id', $selectedAccountId);
        }

        $journalItems = $journalItemsQuery->get();

        // 4. Transformasi dan Kategorisasi Transaksi PSAK 2
        $rawEntries = [];

        foreach ($journalItems as $item) {
            /** @var JournalEntry|null $journal */
            $journal = $item->journalEntry;
            if (! $journal) {
                continue;
            }

            $isDebit = (float) $item->debit > 0;
            $amount = $isDebit ? (float) $item->debit : (float) $item->credit;
            $type = $isDebit ? 'inflow' : 'outflow';

            // Temukan akun lawan (contra accounts) di jurnal yang sama
            $contraItems = $journal->items->filter(function ($other) use ($item, $isDebit) {
                if ($other->id === $item->id) {
                    return false;
                }
                // Jika kas di-debit, lawan adalah kredit; jika kas di-kredit, lawan adalah debit
                return $isDebit ? ((float) $other->credit > 0) : ((float) $other->debit > 0);
            });

            $primaryContra = $contraItems->first();
            $contraAccount = $primaryContra?->account;
            $contraCode = $contraAccount?->code ?? '';
            $contraName = $contraAccount?->name ?? '';

            // Cek apakah transfer internal antar kas/bank
            $isInternalTransfer = in_array($contraCode, $cashBankAccountCodes, true);

            // Tentukan Kategori PSAK 2
            $category = $this->determinePsakCategory($contraCode, $journal->source_type, $type, $isInternalTransfer);

            // Update statistik akun bank terkait
            if (isset($accountBalances[$item->account_id])) {
                if ($type === 'inflow') {
                    $accountBalances[$item->account_id]['inflowTotal'] += $amount;
                    $accountBalances[$item->account_id]['currentBalance'] += $amount;
                } else {
                    $accountBalances[$item->account_id]['outflowTotal'] += $amount;
                    $accountBalances[$item->account_id]['currentBalance'] -= $amount;
                }
            }

            $partnerName = $this->resolvePartnerName($journal, $contraName);

            $rawEntries[] = [
                'id'                 => 'CF-' . substr($item->id, 0, 8),
                'uuid'               => $item->id,
                'journalId'          => $journal->id,
                'date'               => $journal->transaction_date ? $journal->transaction_date->format('Y-m-d') : '',
                'refNo'              => $journal->number ?: 'JRN-' . substr($journal->id, 0, 6),
                'docNo'              => $journal->project?->code ?: ($primaryContra?->memo ?: '-'),
                'accountCode'        => $item->account?->code ?? '',
                'accountName'        => $item->account?->name ?? 'Kas / Bank',
                'contraCode'         => $contraCode,
                'contraName'         => $contraName,
                'description'        => $item->memo ?: ($journal->description ?: 'Mutasi Kas ' . $item->account?->name),
                'partnerName'        => $partnerName,
                'projectName'        => $journal->project?->name,
                'projectCode'        => $journal->project?->code,
                'type'               => $type,
                'category'           => $category,
                'amount'             => $amount,
                'isInternalTransfer' => $isInternalTransfer,
                'timestamp'          => $journal->transaction_date ? $journal->transaction_date->timestamp : 0,
            ];
        }

        // 5. Urutkan kronologis untuk perhitungan Saldo Berjalan (Running Balance)
        usort($rawEntries, function ($a, $b) {
            return $a['timestamp'] <=> $b['timestamp'];
        });

        $runningBalance = $totalBeginningBalance;
        $totalInflow = 0.0;
        $totalOutflow = 0.0;

        $computedEntries = [];
        foreach ($rawEntries as $entry) {
            if ($entry['type'] === 'inflow') {
                $runningBalance += $entry['amount'];
                if (! $entry['isInternalTransfer']) {
                    $totalInflow += $entry['amount'];
                }
            } else {
                $runningBalance -= $entry['amount'];
                if (! $entry['isInternalTransfer']) {
                    $totalOutflow += $entry['amount'];
                }
            }

            $entry['runningBalance'] = $runningBalance;
            $computedEntries[] = $entry;
        }

        // Urutkan descending untuk tampilan tabel (terbaru di atas)
        $displayEntries = array_reverse($computedEntries);

        // 6. Rekapitulasi Format Formal PSAK 2 (Aktivitas Operasi, Investasi, Pendanaan)
        $psakBreakdown = $this->calculatePsakBreakdown($computedEntries, $totalBeginningBalance);

        return [
            'entries'           => $displayEntries,
            'bankAccounts'      => array_values($accountBalances),
            'beginningBalance'  => $totalBeginningBalance,
            'totalInflow'       => $totalInflow,
            'totalOutflow'      => $totalOutflow,
            'endingBalance'     => $totalBeginningBalance + $totalInflow - $totalOutflow,
            'psak'              => $psakBreakdown,
            'periodLabel'       => $startDate->translatedFormat('F Y'),
            'selectedMonth'     => (string) $month,
            'selectedYear'      => (string) $year,
            'startDate'         => $startDate->format('Y-m-d'),
            'endDate'           => $endDate->format('Y-m-d'),
            'fiscalMode'        => $fiscalMode,
        ];
    }

    /**
     * Menentukan kategori PSAK 2 berdasarkan kode akun lawan & sumber transaksi.
     */
    private function determinePsakCategory(
        string $contraCode,
        ?string $sourceType,
        string $type,
        bool $isInternalTransfer
    ): string {
        if ($isInternalTransfer) {
            return 'transfer';
        }

        // Akun Investasi Aset Tetap / Konstruksi (12xx)
        if (str_starts_with($contraCode, '12')) {
            return 'investing';
        }

        // Akun Ekuitas / Modal Disetor / Prive / Dividen (3xxx)
        if (str_starts_with($contraCode, '3')) {
            return 'financing';
        }

        // Default adalah Operasional (Piutang 1121, Hutang 2110, Beban 5xxx, Pajak 2121/2122, Pendapatan 4xxx)
        return 'operating';
    }

    /**
     * Menghitung hierarki dan ringkasan PSAK 2 (Metode Langsung & Tidak Langsung).
     *
     * @param array<int, array<string, mixed>> $entries
     * @return array<string, mixed>
     */
    private function calculatePsakBreakdown(array $entries, float $beginningBalance): array
    {
        // 1. Aktivitas Operasi
        $operatingClientIn = 0.0;
        $operatingOtherIn = 0.0;
        $operatingVendorOut = 0.0;
        $operatingDirectExpenseOut = 0.0;
        $operatingTaxOut = 0.0;

        // 2. Aktivitas Investasi
        $investingAssetIn = 0.0;
        $investingAssetOut = 0.0;

        // 3. Aktivitas Pendanaan
        $financingCapitalIn = 0.0;
        $financingPriveOut = 0.0;

        foreach ($entries as $e) {
            if ($e['isInternalTransfer']) {
                continue;
            }

            $amount = (float) $e['amount'];
            $code = (string) $e['contraCode'];

            if ($e['category'] === 'operating') {
                if ($e['type'] === 'inflow') {
                    if ($code === '1121' || str_starts_with($code, '4')) {
                        $operatingClientIn += $amount;
                    } else {
                        $operatingOtherIn += $amount;
                    }
                } else {
                    if ($code === '2110') {
                        $operatingVendorOut += $amount;
                    } elseif ($code === '2121' || $code === '2122' || str_starts_with($code, '212')) {
                        $operatingTaxOut += $amount;
                    } else {
                        $operatingDirectExpenseOut += $amount;
                    }
                }
            } elseif ($e['category'] === 'investing') {
                if ($e['type'] === 'inflow') {
                    $investingAssetIn += $amount;
                } else {
                    $investingAssetOut += $amount;
                }
            } elseif ($e['category'] === 'financing') {
                if ($e['type'] === 'inflow') {
                    $financingCapitalIn += $amount;
                } else {
                    $financingPriveOut += $amount;
                }
            }
        }

        $netOperating = ($operatingClientIn + $operatingOtherIn) - ($operatingVendorOut + $operatingDirectExpenseOut + $operatingTaxOut);
        $netInvesting = $investingAssetIn - $investingAssetOut;
        $netFinancing = $financingCapitalIn - $financingPriveOut;
        $netCashMovement = $netOperating + $netInvesting + $netFinancing;
        $endingBalance = $beginningBalance + $netCashMovement;

        return [
            // Operasi
            'operatingClientIn'          => $operatingClientIn,
            'operatingOtherIn'           => $operatingOtherIn,
            'totalOperatingIn'           => $operatingClientIn + $operatingOtherIn,
            'operatingVendorOut'         => $operatingVendorOut,
            'operatingDirectExpenseOut'  => $operatingDirectExpenseOut,
            'operatingTaxOut'            => $operatingTaxOut,
            'totalOperatingOut'          => $operatingVendorOut + $operatingDirectExpenseOut + $operatingTaxOut,
            'netOperating'               => $netOperating,

            // Investasi
            'investingAssetIn'           => $investingAssetIn,
            'investingAssetOut'          => $investingAssetOut,
            'netInvesting'               => $netInvesting,

            // Pendanaan
            'financingCapitalIn'         => $financingCapitalIn,
            'financingPriveOut'          => $financingPriveOut,
            'netFinancing'               => $netFinancing,

            // Ringkasan Bersih
            'netCashMovement'            => $netCashMovement,
            'beginningBalance'           => $beginningBalance,
            'endingBalance'              => $endingBalance,
        ];
    }

    /**
     * Resolusi nomor rekening bank default untuk tampilan rapi.
     */
    private function resolveAccountNumber(string $code): string
    {
        return match ($code) {
            '1111' => 'KAS-OPERASIONAL',
            '1112' => '015-882-9901',
            '1113' => '138-00-2010633-7',
            '1114' => '008-119-2041',
            default => 'ACC-' . $code,
        };
    }

    /**
     * Resolusi nama rekanan bisnis / partner dari sumber jurnal.
     */
    private function resolvePartnerName(JournalEntry $journal, string $defaultContraName): string
    {
        if ($journal->project && $journal->project->client) {
            return $journal->project->client->name ?? 'Client YouSee';
        }

        if (! empty($journal->description) && str_contains($journal->description, 'PT.')) {
            preg_match('/(PT\.\s*[\w\s]+)/', $journal->description, $matches);
            if (! empty($matches[1])) {
                return trim($matches[1]);
            }
        }

        return ! empty($defaultContraName) ? $defaultContraName : 'Umum / Kasir';
    }
}
