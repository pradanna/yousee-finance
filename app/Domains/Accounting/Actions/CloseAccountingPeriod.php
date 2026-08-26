<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Support\Facades\DB;

class CloseAccountingPeriod
{
    /**
     * Menutup buku & mengunci periode akuntansi untuk bulan dan tahun tertentu.
     * Hanya dapat dijalankan oleh user dengan role PIMPINAN (Owner).
     *
     * @param array{
     *     month: int,
     *     year: int,
     *     fiscal_mode: FiscalMode|string,
     *     user: User,
     * } $data
     */
    public function execute(array $data): ClosingPeriod
    {
        $user = $data['user'];

        // 1. Verifikasi Otoritas: Hanya Role Pimpinan / Owner yang berhak menutup buku
        if (! $user->hasRole(UserRole::PIMPINAN->value)) {
            throw new DomainException('Hanya Pimpinan / Owner yang memiliki otoritas untuk melakukan Tutup Buku & Mengunci Periode.');
        }

        $month = (int) $data['month'];
        $year = (int) $data['year'];
        $fiscalMode = $data['fiscal_mode'] instanceof FiscalMode
            ? $data['fiscal_mode']
            : FiscalMode::from((string) $data['fiscal_mode']);

        if ($month < 1 || $month > 12) {
            throw new DomainException('Bulan tidak valid (harus 1 - 12).');
        }

        if ($year < 2020 || $year > 2099) {
            throw new DomainException('Tahun tidak valid.');
        }

        return DB::transaction(function () use ($month, $year, $fiscalMode, $user): ClosingPeriod {
            // Cari atau buat record periode
            $period = ClosingPeriod::firstOrNew([
                'month'       => $month,
                'year'        => $year,
                'fiscal_mode' => $fiscalMode,
            ]);

            if ($period->is_closed) {
                throw new DomainException("Periode {$month}-{$year} Mode {$fiscalMode->value} sudah dalam status terkunci.");
            }

            $period->is_closed = true;
            $period->closed_at = now();
            $period->closed_by = (string) $user->id;
            $period->save();

            // Catat ke Audit Log
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => ClosingPeriod::class,
                'auditable_id'   => $period->id,
                'event'          => 'lock_period',
                'user_id'        => $user->id,
                'description'    => "Pimpinan {$user->name} melakukan Tutup Buku & Mengunci Periode {$month}-{$year} Mode: {$fiscalMode->value}",
                'properties'     => [
                    'month'       => $month,
                    'year'        => $year,
                    'fiscal_mode' => $fiscalMode->value,
                    'closed_at'   => $period->closed_at->toIso8601String(),
                ],
            ]);

            return $period;
        });
    }
}
