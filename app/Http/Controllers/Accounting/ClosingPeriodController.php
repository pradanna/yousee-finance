<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\CloseAccountingPeriod;
use App\Domains\Accounting\Actions\UnlockAccountingPeriod;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClosingPeriodController extends Controller
{
    /**
     * Menampilkan dashboard matriks Tutup Buku & Status Kunci Periode Bulanan.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user || ! $user->hasRole(UserRole::PIMPINAN->value)) {
            abort(403, 'Hanya Pimpinan / Owner yang memiliki akses ke halaman Tutup Buku & Kunci Periode.');
        }

        $year = (int) $request->query('year', (string) now()->year);
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode', 'ppn');

        // Ambil semua records closing period untuk tahun yang dipilih
        $closingPeriods = ClosingPeriod::where('year', $year)->get();

        // Bangun matriks 12 bulan (1 sampai 12)
        $months = [];
        $monthNames = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        for ($m = 1; $m <= 12; $m++) {
            $periodPpn = $closingPeriods->first(fn ($p) => $p->month === $m && $p->fiscal_mode === FiscalMode::PPN);
            $periodNonPpn = $closingPeriods->first(fn ($p) => $p->month === $m && $p->fiscal_mode === FiscalMode::NON_PPN);

            $months[] = [
                'month'         => $m,
                'name'          => $monthNames[$m],
                'isClosedPpn'   => (bool) ($periodPpn?->is_closed),
                'closedAtPpn'   => $periodPpn?->closed_at ? $periodPpn->closed_at->format('d M Y H:i') : null,
                'isClosedNonPpn'=> (bool) ($periodNonPpn?->is_closed),
                'closedAtNonPpn'=> $periodNonPpn?->closed_at ? $periodNonPpn->closed_at->format('d M Y H:i') : null,
            ];
        }

        // Ambil riwayat audit log khusus Tutup Buku / Buka Periode
        $auditLogs = AuditLog::with('user:id,name')
            ->where('auditable_type', ClosingPeriod::class)
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'event'       => $log->event,
                'description' => $log->description,
                'properties'  => $log->properties,
                'userName'    => $log->user?->name ?? 'Pimpinan',
                'createdAt'   => $log->created_at->format('d M Y H:i'),
            ]);

        $user = $request->user();
        $isOwner = $user && $user->hasRole(UserRole::PIMPINAN->value);

        return Inertia::render('Accounting/ClosingPeriod/Index', [
            'selectedYear'   => $year,
            'currentMode'    => $fiscalMode,
            'months'         => $months,
            'auditLogs'      => $auditLogs,
            'isOwner'        => $isOwner,
        ]);
    }

    /**
     * Eksekusi Tutup Buku (Lock Period) oleh Owner/Pimpinan.
     */
    public function lock(Request $request, CloseAccountingPeriod $action): RedirectResponse
    {
        $validated = $request->validate([
            'month'       => ['required', 'integer', 'between:1,12'],
            'year'        => ['required', 'integer', 'between:2020,2099'],
            'fiscal_mode' => ['required', 'string', 'in:ppn,non-ppn'],
        ]);

        try {
            $period = $action->execute([
                'month'       => (int) $validated['month'],
                'year'        => (int) $validated['year'],
                'fiscal_mode' => $validated['fiscal_mode'],
                'user'        => $request->user(),
            ]);

            return redirect()->back()->with(
                'success',
                "Periode {$period->month}-{$period->year} ({$validated['fiscal_mode']}) berhasil dikunci dan ditutup buku secara resmi."
            );
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['lock_error' => $e->getMessage()]);
        }
    }

    /**
     * Eksekusi Buka Gembok (Unlock Period) oleh Owner/Pimpinan.
     */
    public function unlock(Request $request, UnlockAccountingPeriod $action): RedirectResponse
    {
        $validated = $request->validate([
            'month'       => ['required', 'integer', 'between:1,12'],
            'year'        => ['required', 'integer', 'between:2020,2099'],
            'fiscal_mode' => ['required', 'string', 'in:ppn,non-ppn'],
            'reason'      => ['required', 'string', 'min:5', 'max:500'],
            'password'    => ['required', 'string'],
        ]);

        try {
            $period = $action->execute([
                'month'       => (int) $validated['month'],
                'year'        => (int) $validated['year'],
                'fiscal_mode' => $validated['fiscal_mode'],
                'reason'      => $validated['reason'],
                'password'    => $validated['password'],
                'user'        => $request->user(),
            ]);

            return redirect()->back()->with(
                'success',
                "Gembok periode {$period->month}-{$period->year} ({$validated['fiscal_mode']}) berhasil dibuka kembali. Transaksi pada periode ini dapat diubah sementara."
            );
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['unlock_error' => $e->getMessage()]);
        }
    }
}
