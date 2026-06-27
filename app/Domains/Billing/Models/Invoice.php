<?php

namespace App\Domains\Billing\Models;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Master\Models\Client;
use App\Domains\Master\Models\Project;
use App\Domains\Master\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Traits\HasFiscalMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class Invoice extends Model
{
    use HasFiscalMode;

    protected $fillable = [
        'client_id',
        'sales_id',
        'project_id',
        'fiscal_mode',
        'transaction_date',
        'due_date',
        'subtotal',
        'ppn',
        'total',
        'status', // draft, issued, paid
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'float',
        'ppn' => 'float',
        'total' => 'float',
        'fiscal_mode' => FiscalMode::class,
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (Invoice $invoice) {
            // Client wajib
            if (empty($invoice->client_id)) {
                throw new \InvalidArgumentException("Client wajib ditentukan.");
            }

            // Validasi Status Flow
            if ($invoice->isDirty('status')) {
                $oldStatus = $invoice->getOriginal('status') ?? 'draft';
                $newStatus = $invoice->status;

                // Flow: draft -> issued -> paid
                if ($oldStatus === 'draft' && $newStatus === 'paid') {
                    throw new \DomainException("Status Invoice harus melalui 'issued' sebelum menjadi 'paid'.");
                }
                if ($oldStatus === 'paid' && $newStatus !== 'paid') {
                    throw new \DomainException("Status Invoice yang sudah 'paid' tidak bisa diubah kembali.");
                }
            }

            $date = Carbon::parse($invoice->transaction_date);
            $modeStr = $invoice->fiscal_mode instanceof FiscalMode ? $invoice->fiscal_mode->value : $invoice->fiscal_mode;
            if (ClosingPeriod::isClosed($date->month, $date->year, $modeStr)) {
                throw new \DomainException("Periode akuntansi ({$date->format('M Y')} - {$modeStr}) sudah ditutup. Transaksi diblok sampai di-Unlock oleh Pimpinan.");
            }

            // Set default due date (+7 hari) jika tidak diisi
            if (empty($invoice->due_date) && !empty($invoice->transaction_date)) {
                $invoice->due_date = Carbon::parse($invoice->transaction_date)->addDays(7);
            }

            // Hitung subtotal, PPN, dan total
            $invoice->calculateTotalsAndTax();
        });

        static::updated(function (Invoice $invoice) {
            // Jurnal saat status berubah jadi Issued
            if ($invoice->isDirty('status') && $invoice->getOriginal('status') === 'draft' && $invoice->status === 'issued') {
                $invoice->postIssuedJournal();
            }

            // Kwitansi & Jurnal Pelunasan saat status berubah jadi Paid
            if ($invoice->isDirty('status') && $invoice->getOriginal('status') === 'issued' && $invoice->status === 'paid') {
                $invoice->generateKwitansi();
                $invoice->postPaidJournal();
            }
        });
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(Sales::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function kwitansi(): HasOne
    {
        return $this->hasOne(Kwitansi::class);
    }

    /**
     * Hitung PPN dan Total secara otomatis berdasarkan mode fiskal.
     */
    public function calculateTotalsAndTax(): void
    {
        $this->subtotal = (float) $this->items()->sum(\DB::raw('quantity * price'));

        if ($this->fiscal_mode === FiscalMode::PPN->value || $this->fiscal_mode === FiscalMode::PPN) {
            $this->ppn = $this->subtotal * 0.11; // PPN 11% wajib
        } else {
            $this->ppn = 0.0; // Disabled
        }

        $this->total = $this->subtotal + $this->ppn;
    }

    /**
     * Posting Jurnal saat Invoice Diterbitkan (Issued).
     * Debet: Piutang
     * Kredit: Pendapatan (+ PPN Keluaran jika PPN)
     */
    public function postIssuedJournal(): void
    {
        if ($this->total <= 0) {
            return;
        }

        $journal = JournalEntry::create([
            'source_type' => self::class,
            'source_id' => $this->id,
            'fiscal_mode' => $this->fiscal_mode,
            'description' => "Jurnal Piutang Invoice #{$this->id} - Client: {$this->client->name}",
            'transaction_date' => $this->transaction_date,
        ]);

        // Debet Piutang
        $journal->items()->create([
            'account_name' => 'Piutang Dagang',
            'debit' => $this->total,
            'credit' => 0,
        ]);

        // Kredit Pendapatan
        $journal->items()->create([
            'account_name' => 'Pendapatan Usaha',
            'debit' => 0,
            'credit' => $this->subtotal,
        ]);

        // Kredit PPN Keluaran (jika ada)
        if ($this->ppn > 0) {
            $journal->items()->create([
                'account_name' => 'PPN Keluaran',
                'debit' => 0,
                'credit' => $this->ppn,
            ]);
        }
    }

    /**
     * Posting Jurnal saat Invoice Dilunasi (Paid).
     * Debet: Kas/Bank
     * Kredit: Piutang
     */
    public function postPaidJournal(): void
    {
        $journal = JournalEntry::create([
            'source_type' => self::class,
            'source_id' => $this->id,
            'fiscal_mode' => $this->fiscal_mode,
            'description' => "Jurnal Pelunasan Invoice #{$this->id} - Client: {$this->client->name}",
            'transaction_date' => now(), // Tanggal pembayaran saat ini
        ]);

        // Debet Kas/Bank
        $journal->items()->create([
            'account_name' => 'Kas / Bank',
            'debit' => $this->total,
            'credit' => 0,
        ]);

        // Kredit Piutang
        $journal->items()->create([
            'account_name' => 'Piutang Dagang',
            'debit' => 0,
            'credit' => $this->total,
        ]);
    }

    /**
     * Terbit otomatis Kwitansi ketika Invoice lunas.
     */
    public function generateKwitansi(): void
    {
        if ($this->kwitansi()->exists()) {
            return;
        }

        $this->kwitansi()->create([
            'receipt_number' => 'KW-' . strtoupper(uniqid()),
            'amount' => $this->total,
            'paid_at' => now(),
        ]);
    }
}
