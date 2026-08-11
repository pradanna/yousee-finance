<?php

namespace App\Domains\Procurement\Models;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Master\Models\Project;
use App\Domains\Master\Models\Vendor;
use App\Domains\Shared\Traits\HasFiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Carbon;

class PurchaseOrder extends Model
{
    use HasFiscalMode;

    protected $fillable = [
        'vendor_id',
        'project_id',
        'fiscal_mode',
        'transaction_date',
        'has_ppn',
        'total',
        'status',
        'paid_at',
        'payment_account_code',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'has_ppn' => 'boolean',
        'total' => 'float',
        'fiscal_mode' => FiscalMode::class,
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (PurchaseOrder $po) {
            // Validasi Closing Period
            $date = Carbon::parse($po->transaction_date);
            $modeStr = $po->fiscal_mode instanceof FiscalMode ? $po->fiscal_mode->value : $po->fiscal_mode;
            if (ClosingPeriod::isClosed($date->month, $date->year, $modeStr)) {
                throw new \DomainException("Periode akuntansi ({$date->format('M Y')} - {$modeStr}) sudah ditutup. Transaksi diblok sampai di-Unlock oleh Pimpinan.");
            }
        });

        static::saved(function (PurchaseOrder $po) {
            // Validasi minimal 1 POItem (Invarian)
            if ($po->items()->count() === 0) {
                if (!app()->runningInConsole()) {
                    throw new \DomainException("Purchase Order tidak boleh kosong. Minimal harus ada 1 item.");
                }
            }
        });

        static::updated(function (PurchaseOrder $po) {
            // Jika berubah ke issued, post jurnal kewajiban
            if ($po->isDirty('status') && $po->getOriginal('status') === 'draft' && $po->status === 'issued') {
                $po->postJournalEntry();
            }

            // Jika berubah ke paid, post jurnal pelunasan
            if ($po->isDirty('status') && $po->getOriginal('status') === 'issued' && $po->status === 'paid') {
                if (empty($po->paid_at)) {
                    $po->paid_at = now();
                    $po->saveQuietly();
                }
                $po->postPaymentJournal();
            }
        });
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    /**
     * Hitung ulang total PO berdasarkan jumlah item.
     */
    public function recalculateTotal(): float
    {
        $subtotal = $this->items()->sum(\DB::raw('quantity * price'));
        $this->total = (float) $subtotal;
        $this->saveQuietly();
        return $this->total;
    }

    /**
     * Posting Jurnal Otomatis saat PO Disimpan.
     * Debet: Beban/Persediaan (+ PPN Masukan jika has_ppn)
     * Kredit: Hutang/Kas
     */
    public function postJournalEntry(): void
    {
        // Cari apakah sudah ada jurnal untuk PO ini (reversing entry jika ada update)
        // Namun spesifikasi: "tidak pernah dihapus - koreksi pakai reversing entry"
        // Di sini kita buat jurnal baru.
        $totalPO = $this->total;
        if ($totalPO <= 0) {
            return;
        }

        $ppnMasukan = 0.0;
        if ($this->has_ppn) {
            // PPN Masukan 11% (asumsi dari total, atau ditambahkan ke total)
            // Sesuai rumus: Total PO = total item. PPN dihitung dari total tersebut.
            $ppnMasukan = $totalPO * 0.11;
        }

        $debetBeban = $totalPO;
        $kreditHutang = $totalPO + $ppnMasukan;

        // Buat Jurnal Entry
        $journal = JournalEntry::create([
            'source_type' => self::class,
            'source_id' => $this->id,
            'fiscal_mode' => $this->fiscal_mode,
            'description' => "Journal PO #{$this->id} - Vendor: {$this->vendor->name}",
            'transaction_date' => $this->transaction_date,
        ]);

        // Debet Beban/Persediaan
        $journal->items()->create([
            'account_name' => 'Beban HPP Sewa Billboard Vendor',
            'debit' => $debetBeban,
            'credit' => 0,
        ]);

        // Debet PPN Masukan (jika ada)
        if ($ppnMasukan > 0) {
            $journal->items()->create([
                'account_name' => 'PPN Masukan (11%)',
                'debit' => $ppnMasukan,
                'credit' => 0,
            ]);
        }

        // Kredit Hutang / Kas
        $journal->items()->create([
            'account_name' => 'Hutang Dagang Vendor Billboard',
            'debit' => 0,
            'credit' => $kreditHutang,
        ]);
    }

    /**
     * Posting Jurnal Otomatis saat PO dibayar (Paid).
     * Debet: Hutang Dagang Vendor Billboard
     * Kredit: Bank (sesuai payment_account_code)
     */
    public function postPaymentJournal(): void
    {
        $journal = JournalEntry::create([
            'source_type' => self::class,
            'source_id' => $this->id,
            'fiscal_mode' => $this->fiscal_mode,
            'description' => "Jurnal Pembayaran PO #{$this->id} - Vendor: {$this->vendor->name}",
            'transaction_date' => $this->paid_at ?? now(),
        ]);

        // Hitung total hutang (total + PPN)
        $totalPO = $this->total;
        $ppnMasukan = $this->has_ppn ? $totalPO * 0.11 : 0;
        $kreditHutang = $totalPO + $ppnMasukan;

        // Ambil nama akun bank dari payment_account_code, atau default
        $bankAccountName = 'Kas Tunai / Operasional';
        $code = $this->payment_account_code;
        if ($code === '1111') $bankAccountName = 'Bank Mandiri Solo Baru (138-00-2010633-7)';
        elseif ($code === '1112') $bankAccountName = 'Bank BCA Operasional Utama';
        elseif ($code === '1110') $bankAccountName = 'Kas Tunai / Operasional';

        // Debet Hutang
        $journal->items()->create([
            'account_name' => 'Hutang Dagang Vendor Billboard',
            'debit' => $kreditHutang,
            'credit' => 0,
        ]);

        // Kredit Kas/Bank
        $journal->items()->create([
            'account_name' => $bankAccountName,
            'debit' => 0,
            'credit' => $kreditHutang,
        ]);
    }
}
