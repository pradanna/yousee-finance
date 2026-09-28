<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\GetFinancialProjectionData;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialProjectionController extends Controller
{
    /**
     * Menampilkan halaman Proyeksi Keuangan (Arus Kas 7/14/30 hari kedepan, PO, Piutang, dan PPN).
     */
    public function index(Request $request, GetFinancialProjectionData $action): Response
    {
        $fiscalMode = (string) ($request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode', 'all'));
        $days = (int) $request->query('days', 14);

        $projectionData = $action->execute([
            'days'        => $days,
            'fiscal_mode' => $fiscalMode,
        ]);

        return Inertia::render('Accounting/FinancialProjection', [
            'projection' => $projectionData,
        ]);
    }
}
