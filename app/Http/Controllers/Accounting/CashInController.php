<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\CreateCashInTransaction;
use App\Domains\Accounting\Actions\VoidCashInTransaction;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Models\CashInTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
use App\Http\Requests\CashTransaction\StoreCashInTransactionRequest;
use App\Http\Requests\CashTransaction\VoidCashInTransactionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CashInController extends Controller
{
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);
        $search = $request->query('search');
        $depositAccountId = $request->query('deposit_account_id');
        $sourceAccountId = $request->query('source_account_id');

        $query = CashInTransaction::with([
            'depositAccount:id,code,name',
            'sourceAccount:id,code,name',
            'creator:id,name',
            'voidedBy:id,name',
            'journalEntry.items.account:id,code,name',
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
                    ->orWhere('payer', 'like', "%{$search}%");
            });
        }

        if (! empty($depositAccountId) && $depositAccountId !== 'all') {
            $query->where('deposit_account_id', $depositAccountId);
        }

        if (! empty($sourceAccountId) && $sourceAccountId !== 'all') {
            $query->where('source_account_id', $sourceAccountId);
        }

        // Hitung metrik ringkasan
        $metricsBaseQuery = clone $query;
        $activeTxs = (clone $metricsBaseQuery)->where('status', 'active')->get();
        $totalInflow = (float) $activeTxs->sum('amount');
        
        $capitalDepositTotal = (float) $activeTxs->filter(function ($tx) {
            $code = $tx->sourceAccount?->code ?? '';
            return str_starts_with($code, '3');
        })->sum('amount');

        $otherInflowTotal = $totalInflow - $capitalDepositTotal;

        $transactions = (clone $query)->orderByDesc('transaction_date')
            ->orderByDesc('transaction_number')
            ->paginate(10)
            ->withQueryString();

        // Akun Kas & Bank (Leaf Nodes) beserta saldo berjalan real-time dari jurnal
        $fiscalModeEnum = (! empty($fiscalMode) && $fiscalMode !== 'all') ? FiscalMode::tryFrom($fiscalMode) : null;

        $totalCashBalance = 0.0;
        $depositAccounts = ChartOfAccount::where('type', AccountType::ASSET)
            ->where('code', 'like', '111%')
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(function ($acc) use ($fiscalModeEnum, &$totalCashBalance) {
                $friendlyName = match (true) {
                    str_contains(strtolower($acc->name), 'kecil') || str_contains(strtolower($acc->name), 'tunai') => 'Kas Tunai / Kas Kecil',
                    str_contains(strtolower($acc->name), 'bca') => 'Bank BCA',
                    str_contains(strtolower($acc->name), 'mandiri') => 'Bank Mandiri',
                    str_contains(strtolower($acc->name), 'bri') => 'Bank BRI',
                    default => $acc->name,
                };

                $journalQuery = JournalEntryItem::where('account_id', $acc->id)
                    ->whereHas('journalEntry', function ($j) use ($fiscalModeEnum) {
                        if ($fiscalModeEnum) {
                            $j->where('fiscal_mode', $fiscalModeEnum);
                        }
                    });

                $totalDebit = (float) (clone $journalQuery)->sum('debit');
                $totalCredit = (float) (clone $journalQuery)->sum('credit');
                $currentBalance = $totalDebit - $totalCredit;

                $totalCashBalance += $currentBalance;

                return [
                    'id'              => $acc->id,
                    'code'            => $acc->code,
                    'name'            => $acc->name,
                    'friendly_name'   => $friendlyName,
                    'current_balance' => $currentBalance,
                ];
            });

        // Daftar akun sumber rekomendasi (Leaf Nodes di luar kas/bank: Modal, Ekuitas, Pendapatan, Hutang)
        $sourceAccounts = ChartOfAccount::whereDoesntHave('children')
            ->where('is_active', true)
            ->where('code', 'not like', '111%')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type'])
            ->map(fn ($acc) => [
                'id'   => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'type' => $acc->type->value,
            ]);

        // Proteksi Periode Tutup Buku
        $activeFiscal = $fiscalModeEnum ?? FiscalMode::NON_PPN;
        $mInt = $month !== 'all' ? (int) $month : (int) now()->month;
        $yInt = $year !== 'all' ? (int) $year : (int) now()->year;
        $isPeriodLocked = ClosingPeriod::isClosed($mInt, $yInt, $activeFiscal);

        // Audit Logs
        $auditLogs = AuditLog::with('user:id,name')
            ->where('auditable_type', CashInTransaction::class)
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'event'       => $log->event,
                'description' => $log->description,
                'user_name'   => $log->user?->name ?? 'System',
                'created_at'  => $log->created_at?->toIso8601String() ?? '',
            ]);

        return Inertia::render('CashIn', [
            'transactions'    => $transactions,
            'depositAccounts' => $depositAccounts,
            'sourceAccounts'  => $sourceAccounts,
            'metrics'         => [
                'total_inflow'          => $totalInflow,
                'capital_deposit_total' => $capitalDepositTotal,
                'other_inflow_total'    => $otherInflowTotal,
                'total_cash_balance'    => $totalCashBalance,
            ],
            'isPeriodLocked'  => $isPeriodLocked,
            'auditLogs'       => $auditLogs,
        ]);
    }

    public function store(StoreCashInTransactionRequest $request, CreateCashInTransaction $action): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = (string) $request->user()->id;

        if ($request->hasFile('attachment')) {
            /** @var UploadedFile $file */
            $file = $request->file('attachment');
            $originalName = $file->getClientOriginalName();
            $storedPath = $this->compressAndStoreImage($file);

            $validated['attachment_path'] = $storedPath;
            $validated['attachment_name'] = $originalName;
        }

        try {
            $tx = $action->execute($validated);

            return redirect()->back()->with('success', "Penerimaan kas [{$tx->transaction_number}] berhasil dicatat dan jurnal akuntansi telah dibukukan.");
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['amount' => $e->getMessage()]);
        }
    }

    public function void(
        VoidCashInTransactionRequest $request,
        CashInTransaction $cashInTransaction,
        VoidCashInTransaction $action,
    ): RedirectResponse {
        try {
            $action->execute($cashInTransaction, $request->input('void_reason'), (string) auth()->id());

            return redirect()->back()->with('success', "Transaksi penerimaan kas [{$cashInTransaction->transaction_number}] berhasil dibatalkan (Void) dan jurnal pembalik telah dibukukan.");
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['void_reason' => $e->getMessage()]);
        }
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');
        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);
        $search = $request->query('search');
        $depositAccountId = $request->query('deposit_account_id');
        $sourceAccountId = $request->query('source_account_id');

        $query = CashInTransaction::with([
            'depositAccount:id,code,name',
            'sourceAccount:id,code,name',
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
                    ->orWhere('payer', 'like', "%{$search}%");
            });
        }

        if (! empty($depositAccountId) && $depositAccountId !== 'all') {
            $query->where('deposit_account_id', $depositAccountId);
        }

        if (! empty($sourceAccountId) && $sourceAccountId !== 'all') {
            $query->where('source_account_id', $sourceAccountId);
        }

        $transactions = $query->orderBy('transaction_date')
            ->orderBy('transaction_number')
            ->get();

        $filename = 'Penerimaan_Kas_' . ($month !== 'all' ? sprintf('%02d', (int) $month) . '_' : '') . $year . '.csv';

        return response()->streamDownload(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'No',
                'No. Transaksi',
                'Status',
                'Tanggal',
                'Mode Fiskal',
                'Rekening Penerima',
                'Sumber Dana',
                'Penyetor / Sumber',
                'Keterangan',
                'Nominal (Rp)',
                'Dicatat Oleh',
            ]);

            $total = 0.0;
            foreach ($transactions as $idx => $t) {
                if ($t->status === 'active') {
                    $total += (float) $t->amount;
                }

                fputcsv($handle, [
                    $idx + 1,
                    $t->transaction_number,
                    strtoupper($t->status),
                    $t->transaction_date ? $t->transaction_date->format('d/m/Y') : '-',
                    strtoupper((string) $t->fiscal_mode->value),
                    $t->depositAccount?->name ?? '-',
                    $t->sourceAccount ? "{$t->sourceAccount->code} - {$t->sourceAccount->name}" : '-',
                    $t->payer ?? '-',
                    $t->description,
                    (float) $t->amount,
                    $t->creator?->name ?? '-',
                ]);
            }

            fputcsv($handle, [
                '', '', '', '', '', '', '', '', 'TOTAL AKTIF', $total, '',
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function compressAndStoreImage(UploadedFile $file): string
    {
        $subDir = 'cash-in-attachments/' . date('Y/m');
        $filename = Str::random(40);
        $fullDir = public_path('uploads/' . $subDir);

        if (! file_exists($fullDir)) {
            mkdir($fullDir, 0755, true);
        }

        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        if (strtolower($extension) === 'pdf') {
            $file->move($fullDir, "{$filename}.pdf");
            return "uploads/{$subDir}/{$filename}.pdf";
        }

        $imagePath = $file->getRealPath();
        $imageInfo = @getimagesize($imagePath);

        if (! $imageInfo) {
            $file->move($fullDir, "{$filename}.{$extension}");
            return "uploads/{$subDir}/{$filename}.{$extension}";
        }

        [$origWidth, $origHeight, $imageType] = $imageInfo;

        $sourceImage = match ($imageType) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($imagePath),
            IMAGETYPE_PNG => @imagecreatefrompng($imagePath),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($imagePath) : false,
            default => false,
        };

        if (! $sourceImage) {
            $file->move($fullDir, "{$filename}.{$extension}");
            return "uploads/{$subDir}/{$filename}.{$extension}";
        }

        if ($imageType === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif = @exif_read_data($imagePath);
            if (! empty($exif['Orientation'])) {
                $sourceImage = match ($exif['Orientation']) {
                    3 => imagerotate($sourceImage, 180, 0),
                    6 => imagerotate($sourceImage, -90, 0),
                    8 => imagerotate($sourceImage, 90, 0),
                    default => $sourceImage,
                };
            }
        }

        $targetPath = "{$fullDir}/{$filename}.jpg";
        imagejpeg($sourceImage, $targetPath, 85);
        imagedestroy($sourceImage);

        return "uploads/{$subDir}/{$filename}.jpg";
    }
}
