<?php

namespace App\Domains\Master\Models;

use App\Domains\Procurement\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'npwp',
        'is_archived',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (Vendor $vendor) {
            if (empty($vendor->name)) {
                throw new \InvalidArgumentException("Nama Lengkap wajib diisi.");
            }

            if (!empty($vendor->npwp)) {
                // Regex validasi format NPWP Indonesia sederhana (contoh: 15 digit angka)
                // Format resmi biasanya: 99.999.999.9-999.999 atau 15 digit bersih
                $cleanNpwp = preg_replace('/[^0-9]/', '', $vendor->npwp);
                if (strlen($cleanNpwp) !== 15 && strlen($cleanNpwp) !== 16) {
                    throw new \InvalidArgumentException("Format NPWP tidak valid. Harus terdiri dari 15 atau 16 digit angka.");
                }
            }
        });

        static::deleting(function (Vendor $vendor) {
            // Cek jika ada relasi PO, block hard delete
            if ($vendor->purchaseOrders()->exists()) {
                throw new \DomainException("Vendor tidak bisa dihapus secara permanen (hard-delete) karena sudah digunakan di PO. Silakan archive.");
            }
        });
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
