<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Support\Facades\Hash;

class UnlockAccountingPeriod
{
    /**
     * Membuka kembali periode akuntansi yang terkunci.
     * Hanya dapat dijalankan oleh user dengan role PIMPINAN (Owner) dengan konfirmasi password.
     *
     * @param array{
     *     month: int,
     *     year: int,
     *     fiscal_mode: FiscalMode|string,
     *     reason: string,
     *     password: string,
     *     user: User,
     * } $data
     */
    public function execute(array $data): ClosingPeriod
    {
        $user = $data['user'];

        // 1. Verifikasi Otoritas: Hanya Role Pimpinan / Owner
        if (! $user->hasRole(UserRole::PIMPINAN->value)) {
            throw new DomainException('Hanya Pimpinan / Owner yang memiliki hak istimewa untuk membuka kembali (Unlock) periode akuntansi.');
        }

        // 2. Verifikasi Password Konfirmasi
        if (! Hash::check($data['password'], $user->password)) {
            throw new DomainException('Kata sandi konfirmasi salah. Pembukaan gembok periode dibatalkan demi keamanan.');
        }

        $reason = trim($data['reason']);
        if (strlen($reason) < 5) {
            throw new DomainException('Alasan pembukaan periode wajib diisi minimal 5 karakter untuk audit trail.');
        }

        $month = (int) $data['month'];
        $year = (int) $data['year'];
        $fiscalMode = $data['fiscal_mode'] instanceof FiscalMode
            ? $data['fiscal_mode']
            : FiscalMode::from((string) $data['fiscal_mode']);

        $period = ClosingPeriod::where('month', $month)
            ->where('year', $year)
            ->where('fiscal_mode', $fiscalMode)
            ->first();

        if (! $period || ! $period->is_closed) {
            throw new DomainException("Periode {$month}-{$year} Mode {$fiscalMode->value} sedang tidak dalam status terkunci.");
        }

        $period->unlock($user, $reason);

        return $period;
    }
}
