<?php

namespace App\Domains\Accounting\Models;

use App\Domains\Identity\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

use App\Domains\Shared\Enums\FiscalMode;

class ClosingPeriod extends Model
{
    protected $fillable = [
        'month',
        'year',
        'fiscal_mode',
        'is_closed',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
    ];

    public static function boot(): void
    {
        parent::boot();

        static::saving(function (ClosingPeriod $period) {
            if ($period->is_closed) {
                // Sequence closing berjalan independen per Mode
                $prevMonth = $period->month === 1 ? 12 : $period->month - 1;
                $prevYear = $period->month === 1 ? $period->year - 1 : $period->year;

                // Cek apakah ada record penutupan periode sebelumnya di database untuk mode ini
                $hasPreviousRecords = self::where('fiscal_mode', $period->fiscal_mode)
                    ->where(function ($query) use ($period) {
                        $query->where('year', '<', $period->year)
                            ->orWhere(function ($q) use ($period) {
                                $q->where('year', $period->year)
                                    ->where('month', '<', $period->month);
                            });
                    })->exists();

                if ($hasPreviousRecords) {
                    $prevClosed = self::isClosed($prevMonth, $prevYear, $period->fiscal_mode);
                    if (!$prevClosed) {
                        throw new \DomainException("Urutan closing salah: Periode bulan sebelumnya ({$prevMonth}-{$prevYear}) untuk Mode {$period->fiscal_mode} harus sudah ditutup terlebih dahulu.");
                    }
                }
            }
        });
    }

    /**
     * Memeriksa apakah periode tertentu sudah ditutup.
     */
    public static function isClosed(int $month, int $year, string|FiscalMode $mode): bool
    {
        $modeValue = $mode instanceof FiscalMode ? $mode->value : $mode;
        return self::where('month', $month)
            ->where('year', $year)
            ->where('fiscal_mode', $modeValue)
            ->where('is_closed', true)
            ->exists();
    }

    /**
     * Membuka kembali periode yang sudah dikunci.
     * Hanya boleh dilakukan oleh Pimpinan, tercatat di audit log.
     */
    public function unlock(User $user, string $reason): void
    {
        if ($user->role !== UserRole::PIMPINAN) {
            throw new \DomainException("Hanya user dengan role Pimpinan yang boleh membuka kembali (unlock) periode akuntansi.");
        }

        $this->is_closed = false;
        $this->save();

        // Catat Audit Log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UNLOCK_PERIOD',
            'details' => "Pimpinan {$user->name} membuka kembali periode {$this->month}-{$this->year} Mode: {$this->fiscal_mode}. Alasan: {$reason}",
        ]);
    }
}
