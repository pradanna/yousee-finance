<?php

declare(strict_types=1);

namespace App\Domains\Vendor\Models;

use App\Domains\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected static function newFactory()
    {
        return \Database\Factories\VendorFactory::new();
    }

    protected static function booted(): void
    {
        static::creating(function (Vendor $vendor) {
            if (empty($vendor->code)) {
                $vendor->code = self::generateNextCode();
            }
        });

        static::saving(function (Vendor $vendor) {
            if (empty($vendor->name)) {
                throw new \InvalidArgumentException("Nama Lengkap wajib diisi.");
            }

            if (!empty($vendor->npwp)) {
                $cleanNpwp = preg_replace('/[^0-9]/', '', $vendor->npwp);
                if (strlen($cleanNpwp) !== 15 && strlen($cleanNpwp) !== 16) {
                    throw new \InvalidArgumentException("Format NPWP tidak valid. Harus terdiri dari 15 atau 16 digit angka.");
                }
            }
        });

        static::deleting(function (Vendor $vendor) {
            if ($vendor->purchaseOrders()->exists()) {
                throw new \DomainException("Vendor tidak bisa dihapus secara permanen (hard-delete) karena sudah digunakan di transaksi Purchase Order. Silakan archive.");
            }
        });
    }

    /**
     * Generate the next sequential vendor code (e.g. VND-0001).
     */
    public static function generateNextCode(): string
    {
        $maxVendor = static::withTrashed()
            ->whereNotNull('code')
            ->where('code', 'like', 'VND-%')
            ->orderByRaw('LENGTH(code) DESC, code DESC')
            ->first();

        if ($maxVendor && preg_match('/VND-(\d+)/', (string) $maxVendor->code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        } else {
            $nextNumber = static::withTrashed()->count() + 1;
        }

        do {
            $candidate = sprintf('VND-%04d', $nextNumber++);
        } while (static::withTrashed()->where('code', $candidate)->exists());

        return $candidate;
    }

    protected $fillable = [
        'code',
        'name',
        'pic',
        'npwp',
        'phone',
        'email',
        'address',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active vendors.
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_archived', false);
    }

    /**
     * Get the purchase orders associated with the vendor.
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * Cek apakah vendor berstatus Pengusaha Kena Pajak (PKP).
     */
    public function isPkp(): bool
    {
        return ! empty($this->npwp) && trim((string) $this->npwp) !== '';
    }
}
