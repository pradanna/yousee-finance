<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Shared\Enums\FiscalMode;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class CashOutPdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode', 'non-ppn');
        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);
        $paymentAccountId = $request->query('payment_account_id');
        $expenseCategoryId = $request->query('expense_category_id');
        $search = $request->query('search');

        $query = CashTransaction::with([
            'paymentAccount:id,code,name',
            'expenseAccount:id,code,name',
            'creator:id,name',
        ]);

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $query->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        if ($month !== 'all') {
            $query->whereMonth('transaction_date', (int) $month);
        }
        if ($year !== 'all') {
            $query->whereYear('transaction_date', (int) $year);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('recipient', 'like', "%{$search}%");
            });
        }

        if (! empty($paymentAccountId) && $paymentAccountId !== 'all') {
            $query->where('payment_account_id', $paymentAccountId);
        }

        if (! empty($expenseCategoryId) && $expenseCategoryId !== 'all') {
            $category = \App\Domains\Accounting\Models\ExpenseCategory::find($expenseCategoryId);
            if ($category) {
                $query->where('expense_account_id', $category->account_id);
            }
        }

        $transactions = $query->orderBy('transaction_date')
            ->orderBy('transaction_number')
            ->get();

        $totalAmount = (float) $transactions->sum('amount');

        // Format Label Periode
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $periodLabel = ($month !== 'all' ? ($monthNames[(int)$month] ?? '') : 'Semua Bulan') . ' ' . ($year !== 'all' ? $year : 'Semua Tahun');

        $paymentAccountLabel = 'Semua Akun Kas & Bank';
        if (! empty($paymentAccountId) && $paymentAccountId !== 'all') {
            $acc = ChartOfAccount::find($paymentAccountId);
            if ($acc) {
                $paymentAccountLabel = "{$acc->code} - {$acc->name}";
            }
        }

        $pdf = Pdf::loadView('pdf.cash_out_report', [
            'transactions'        => $transactions,
            'totalAmount'         => $totalAmount,
            'periodLabel'         => $periodLabel,
            'paymentAccountLabel' => $paymentAccountLabel,
            'fiscalMode'          => $fiscalMode,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = "Rekap_Pengeluaran_Kas_{$year}_{$month}.pdf";

        if ($request->input('stream', true)) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
