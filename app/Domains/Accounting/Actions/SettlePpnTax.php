<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\TaxSettlement;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use DomainException;
use Illuminate\Support\Facades\DB;

class SettlePpnTax
{
    public function __construct(
        protected PostJournalEntry $postJournalEntry,
    ) {}

    /**
     * Catat atau perbarui penyetoran PPN Kas Negara (NTPN) untuk masa pajak tertentu,
     * serta otomatis membukukan ayat jurnal kas keluar & penutupan hutang PPN.
     *
     * @param array<string, mixed> $data
     */
    public function execute(array $data): TaxSettlement
    {
        $month = (int) $data['month'];
        $year = (int) $data['year'];
        $fiscalModeStr = isset($data['fiscal_mode']) ? (string) $data['fiscal_mode'] : FiscalMode::PPN->value;
        $fiscalMode = FiscalMode::tryFrom($fiscalModeStr) ?? FiscalMode::PPN;

        $paidDate = new \DateTimeImmutable((string) $data['paid_date']);
        $paidMonth = (int) $paidDate->format('n');
        $paidYear = (int) $paidDate->format('Y');

        // 1. INVARIANT CHECK: Closing Period (Masa Pajak & Tanggal Pembayaran)
        if (ClosingPeriod::isClosed($month, $year, $fiscalMode)) {
            throw new DomainException("Tidak dapat mencatat/mengubah setoran pajak karena masa pajak {$month}-{$year} ({$fiscalMode->value}) telah ditutup/dikunci oleh Pimpinan/Owner.");
        }

        if (ClosingPeriod::isClosed($paidMonth, $paidYear, $fiscalMode)) {
            throw new DomainException("Tidak dapat mencatat/mengubah setoran pajak karena tanggal pembayaran berada di periode {$paidMonth}-{$paidYear} ({$fiscalMode->value}) yang telah ditutup/dikunci oleh Pimpinan/Owner.");
        }

        return DB::transaction(function () use ($data, $month, $year, $fiscalModeStr, $fiscalMode): TaxSettlement {
            $ntpn = strtoupper(trim((string) $data['ntpn']));
            $bankName = trim((string) $data['bank_name']);
            $netAmount = (float) ($data['net_amount'] ?? 0);
            $ppnKeluaranTotal = (float) ($data['ppn_keluaran_total'] ?? 0);
            $ppnMasukanTotal = (float) ($data['ppn_masukan_total'] ?? 0);

            $settlement = TaxSettlement::updateOrCreate(
                [
                    'month'       => $month,
                    'year'        => $year,
                    'fiscal_mode' => $fiscalModeStr,
                ],
                [
                    'ntpn'               => $ntpn,
                    'paid_date'          => $data['paid_date'],
                    'bank_name'          => $bankName,
                    'ppn_keluaran_total' => $ppnKeluaranTotal,
                    'ppn_masukan_total'  => $ppnMasukanTotal,
                    'net_amount'         => $netAmount,
                    'status'             => 'paid',
                    'notes'              => isset($data['notes']) ? (string) $data['notes'] : null,
                    'created_by'         => auth()->id(),
                ]
            );

            // 2. OTOMATISASI JURNAL AKUNTANSI (Dr. PPN Keluaran / Hutang PPN, Cr. Kas/Bank)
            if ($netAmount > 0) {
                // Resolusi Akun Debit (PPN Keluaran 2121)
                $vatOutputAccId = AccountingSetting::getAccountId('default_vat_output')
                    ?? ChartOfAccount::where('code', '2121')->value('id');

                // Resolusi Akun Kredit (Kas/Bank Persepsi)
                $bankAcc = null;
                if (stripos($bankName, 'BCA') !== false) {
                    $bankAcc = ChartOfAccount::where('code', '1112')->first();
                } elseif (stripos($bankName, 'Mandiri') !== false) {
                    $bankAcc = ChartOfAccount::where('code', '1113')->first();
                } elseif (stripos($bankName, 'BRI') !== false) {
                    $bankAcc = ChartOfAccount::where('code', '1114')->first();
                }

                $bankAccId = $bankAcc?->id
                    ?? AccountingSetting::getAccountId('default_bank')
                    ?? ChartOfAccount::where('code', '1113')->value('id')
                    ?? ChartOfAccount::where('code', '1111')->value('id');

                if ($vatOutputAccId && $bankAccId) {
                    $existingJournal = JournalEntry::where('source_type', TaxSettlement::class)
                        ->where('source_id', $settlement->id)
                        ->first();

                    $journalDescription = "Penyetoran PPN Kas Negara Masa {$month}-{$year} (NTPN: {$ntpn}) via {$bankName}";

                    if ($existingJournal) {
                        // Perbarui jurnal yang sudah ada
                        JournalEntry::$allowSystemMutation = true;
                        try {
                            $existingJournal->update([
                                'transaction_date' => $data['paid_date'],
                                'description'      => $journalDescription,
                            ]);

                            $existingJournal->items()->delete();
                            $existingJournal->items()->createMany([
                                [
                                    'account_id' => $vatOutputAccId,
                                    'debit'      => $netAmount,
                                    'credit'     => 0,
                                    'memo'       => "Pelunasan Hutang PPN Masa {$month}-{$year} (NTPN: {$ntpn})",
                                ],
                                [
                                    'account_id' => $bankAccId,
                                    'debit'      => 0,
                                    'credit'     => $netAmount,
                                    'memo'       => "Setoran Pajak Kas Negara via {$bankName}",
                                ],
                            ]);

                            $existingJournal->validateBalance();
                        } finally {
                            JournalEntry::$allowSystemMutation = false;
                        }
                    } else {
                        // Posting Jurnal Baru
                        $this->postJournalEntry->execute(
                            headerData: [
                                'fiscal_mode'      => $fiscalMode,
                                'transaction_date' => (string) $data['paid_date'],
                                'description'      => $journalDescription,
                                'posted_by'        => auth()->id(),
                            ],
                            items: [
                                [
                                    'account_id' => $vatOutputAccId,
                                    'debit'      => $netAmount,
                                    'credit'     => 0,
                                    'memo'       => "Pelunasan Hutang PPN Masa {$month}-{$year} (NTPN: {$ntpn})",
                                ],
                                [
                                    'account_id' => $bankAccId,
                                    'debit'      => 0,
                                    'credit'     => $netAmount,
                                    'memo'       => "Setoran Pajak Kas Negara via {$bankName}",
                                ],
                            ],
                            source: $settlement,
                        );
                    }
                }
            }

            // 3. Catat ke Audit Trail
            AuditLog::create([
                'auditable_type' => TaxSettlement::class,
                'auditable_id'   => $settlement->id,
                'event'          => 'TAX_SETTLEMENT_PAID',
                'user_id'        => auth()->id(),
                'description'    => "Penyetoran PPN Kas Negara Masa {$month}-{$year} (NTPN: {$settlement->ntpn}) sebesar Rp " . number_format((float) $settlement->net_amount, 0, ',', '.') . " melalui {$settlement->bank_name} berhasil dicatat & dibukukan ke jurnal umum.",
                'properties'     => [
                    'ntpn'       => $settlement->ntpn,
                    'bank_name'  => $settlement->bank_name,
                    'paid_date'  => $settlement->paid_date ? $settlement->paid_date->format('Y-m-d') : null,
                    'net_amount' => $settlement->net_amount,
                    'month'      => $month,
                    'year'       => $year,
                ],
            ]);

            return $settlement;
        });
    }
}
