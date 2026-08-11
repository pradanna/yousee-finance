<?php

namespace App\Domains\Client\Models;

use App\Domains\Billing\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'npwp',
        'is_archived',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\ClientFactory::new();
    }

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (Client $client) {
            if (empty($client->name)) {
                throw new \InvalidArgumentException("Nama Lengkap wajib diisi.");
            }

            if (!empty($client->npwp)) {
                $cleanNpwp = preg_replace('/[^0-9]/', '', $client->npwp);
                if (strlen($cleanNpwp) !== 15 && strlen($cleanNpwp) !== 16) {
                    throw new \InvalidArgumentException("Format NPWP tidak valid. Harus terdiri dari 15 atau 16 digit angka.");
                }
            }
        });

        static::deleting(function (Client $client) {
            if ($client->invoices()->exists()) {
                throw new \DomainException("Client tidak bisa dihapus secara permanen (hard-delete) karena sudah digunakan di Invoice. Silakan archive.");
            }
        });
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
