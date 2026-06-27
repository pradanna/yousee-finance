<?php

namespace App\Domains\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kwitansi extends Model
{
    protected $fillable = [
        'invoice_id',
        'receipt_number',
        'amount',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::updating(function (Kwitansi $kwitansi) {
            // Immutable setelah terbit
            throw new \DomainException("Kwitansi bersifat immutable (tidak bisa diubah) setelah terbit.");
        });

        static::deleting(function (Kwitansi $kwitansi) {
            // Cek jika status invoice masih paid, tidak boleh hapus kwitansi begitu saja
            if ($kwitansi->invoice->status === 'paid') {
                throw new \DomainException("Kwitansi tidak bisa dihapus karena Invoice terkait berstatus Paid.");
            }
        });
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
