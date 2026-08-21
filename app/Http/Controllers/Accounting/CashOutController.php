<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\CreateCashTransaction;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ExpenseCategory;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\CashTransaction\StoreCashTransactionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashOutController extends Controller
{
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);
        $search = $request->query('search');
        $paymentAccountId = $request->query('payment_account_id');
        $expenseCategoryId = $request->query('expense_category_id');

        // Ambil transaksi pengeluaran kas
        $query = CashTransaction::with([
            'paymentAccount:id,code,name',
            'expenseAccount:id,code,name',
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

        // Filter text (No. Transaksi, Keterangan/Memo, atau Penerima)
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('recipient', 'like', "%{$search}%");
            });
        }

        // Filter Sumber Kas
        if (! empty($paymentAccountId) && $paymentAccountId !== 'all') {
            $query->where('payment_account_id', $paymentAccountId);
        }

        // Filter Kategori Pengeluaran (berdasarkan account_id kategori)
        if (! empty($expenseCategoryId) && $expenseCategoryId !== 'all') {
            $category = ExpenseCategory::find($expenseCategoryId);
            if ($category) {
                $query->where('expense_account_id', $category->account_id);
            }
        }

        // Clone query filter untuk statistik sebelum pagination & order diterapkan
        $filteredBaseQuery = clone $query;

        $transactions = (clone $query)->orderByDesc('transaction_date')
            ->orderByDesc('transaction_number')
            ->paginate(10)
            ->withQueryString();

        // Akun Kas & Bank (Leaf Nodes) - Hitung Saldo Berjalan Real-time dari Jurnal
        $fiscalModeEnum = (! empty($fiscalMode) && $fiscalMode !== 'all') ? FiscalMode::tryFrom($fiscalMode) : null;

        $paymentAccounts = ChartOfAccount::where('type', AccountType::ASSET)
            ->where('code', 'like', '111%')
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(function ($acc) use ($fiscalModeEnum) {
                $friendlyName = match (true) {
                    str_contains(strtolower($acc->name), 'kecil') || str_contains(strtolower($acc->name), 'tunai') => 'Kas Tunai / Kas Kecil',
                    str_contains(strtolower($acc->name), 'bca') => 'Bank BCA',
                    str_contains(strtolower($acc->name), 'mandiri') => 'Bank Mandiri',
                    str_contains(strtolower($acc->name), 'bri') => 'Bank BRI',
                    default => $acc->name,
                };

                // Query Saldo Berjalan (Debet - Kredit) dari journal_entry_items
                $journalQuery = JournalEntryItem::where('account_id', $acc->id)
                    ->whereHas('journalEntry', function ($j) use ($fiscalModeEnum) {
                        if ($fiscalModeEnum) {
                            $j->where('fiscal_mode', $fiscalModeEnum);
                        }
                    });

                $totalDebit = (float) (clone $journalQuery)->sum('debit');
                $totalCredit = (float) (clone $journalQuery)->sum('credit');
                $currentBalance = $totalDebit - $totalCredit;

                return [
                    'id'              => $acc->id,
                    'code'            => $acc->code,
                    'name'            => $acc->name,
                    'friendly_name'   => $friendlyName,
                    'current_balance' => $currentBalance,
                ];
            });

        // Master Kategori Pengeluaran (Tabel expense_categories terhubung ke COA)
        $expenseCategories = ExpenseCategory::with('account:id,code,name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_id', 'description'])
            ->map(function ($cat) {
                return [
                    'id'          => $cat->id,
                    'name'        => $cat->name,
                    'account_id'  => $cat->account_id,
                    'account_code'=> $cat->account?->code,
                    'account_name'=> $cat->account?->name,
                ];
            });

        // Akun Beban & Biaya (Leaf Nodes) untuk opsi create kategori baru
        $leafExpenseAccounts = ChartOfAccount::where('type', AccountType::EXPENSE)
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        // Ringkasan Statistik
        $statsBase = CashTransaction::query();
        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $statsBase->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $currentMonthTotal = (float) (clone $statsBase)
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $lastMonthTotal = (float) (clone $statsBase)
            ->whereMonth('transaction_date', now()->subMonth()->month)
            ->whereYear('transaction_date', now()->subMonth()->year)
            ->sum('amount');

        $totalFiltered = (float) (clone $filteredBaseQuery)->sum('amount');

        // Ringkasan Top Kategori Pengeluaran (Berdasarkan filter aktif)
        $topExpensesQuery = (clone $filteredBaseQuery)
            ->selectRaw('expense_account_id, SUM(amount) as total_amount, COUNT(*) as tx_count')
            ->groupBy('expense_account_id')
            ->reorder('total_amount', 'desc')
            ->take(5)
            ->with('expenseAccount:id,code,name')
            ->get();

        $topExpenses = $topExpensesQuery->map(function ($item) use ($totalFiltered) {
            $amt = (float) $item->total_amount;
            $pct = $totalFiltered > 0 ? round(($amt / $totalFiltered) * 100, 1) : 0;
            return [
                'account_id'   => $item->expense_account_id,
                'account_code' => $item->expenseAccount?->code ?? '-',
                'account_name' => $item->expenseAccount?->name ?? 'Lain-lain',
                'total_amount' => $amt,
                'tx_count'     => (int) $item->tx_count,
                'percentage'   => $pct,
            ];
        });

        // Ambil riwayat audit log aktivitas kas lengkap
        $recentAuditLogs = \App\Domains\Shared\Models\AuditLog::with('user:id,name')
            ->where('auditable_type', CashTransaction::class)
            ->latest()
            ->take(100)
            ->get()
            ->map(function ($log) {
                return [
                    'id'          => $log->id,
                    'event'       => $log->event,
                    'description' => $log->description,
                    'properties'  => $log->properties,
                    'user_name'   => $log->user?->name ?? 'System',
                    'created_at'  => $log->created_at?->toIso8601String(),
                ];
            });

        // Cek status lock periode untuk bulan & tahun yang sedang difilter
        $isPeriodLocked = false;
        if ($month !== 'all' && $year !== 'all' && ! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $isPeriodLocked = \App\Domains\Accounting\Models\ClosingPeriod::isClosed((int) $month, (int) $year, $fiscalModeEnum);
            }
        }

        return Inertia::render('CashOut', [
            'transactions' => $transactions,
            'paymentAccounts' => $paymentAccounts,
            'expenseCategories' => $expenseCategories,
            'leafExpenseAccounts' => $leafExpenseAccounts,
            'isPeriodLocked' => $isPeriodLocked,
            'auditLogs' => $recentAuditLogs,
            'stats' => [
                'currentMonthTotal' => $currentMonthTotal,
                'lastMonthTotal'    => $lastMonthTotal,
                'totalFiltered'     => $totalFiltered,
                'topExpenses'       => $topExpenses,
            ],
            'filters' => [
                'month'               => $month,
                'year'                => $year,
                'search'              => $search ?? '',
                'payment_account_id'  => $paymentAccountId ?? 'all',
                'expense_category_id' => $expenseCategoryId ?? 'all',
            ],
        ]);
    }

    /**
     * Membatalkan (Void) transaksi kas dan mencatat jurnal pembalik
     */
    public function void(
        Request $request,
        CashTransaction $cashTransaction,
        \App\Domains\Accounting\Actions\VoidCashTransaction $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        try {
            $action->execute($cashTransaction, $validated['reason'], (string) auth()->id());

            return redirect()->back()->with('success', "Transaksi {$cashTransaction->transaction_number} berhasil dibatalkan (Void) dan jurnal pembalik telah dibukukan.");
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors([
                'void_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Export spreadsheet Excel / CSV kompatibel dengan Microsoft Excel
     */
    public function exportCsv(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');
        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);
        $search = $request->query('search');
        $paymentAccountId = $request->query('payment_account_id');
        $expenseCategoryId = $request->query('expense_category_id');

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
            $category = ExpenseCategory::find($expenseCategoryId);
            if ($category) {
                $query->where('expense_account_id', $category->account_id);
            }
        }

        $transactions = $query->orderBy('transaction_date')
            ->orderBy('transaction_number')
            ->get();

        $filename = "Laporan_Pengeluaran_Kas_{$year}_{$month}.csv";

        return response()->streamDownload(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM untuk kompatibilitas sempurna dengan Microsoft Excel di Windows
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header Kolom
            fputcsv($handle, [
                'No',
                'No. Transaksi',
                'Tanggal',
                'Kategori Pengeluaran',
                'Sumber Kas',
                'Penerima',
                'Keterangan / Memo',
                'Nominal (Rp)',
                'Dicatat Oleh',
            ]);

            $total = 0;
            foreach ($transactions as $idx => $t) {
                $total += (float) $t->amount;
                fputcsv($handle, [
                    $idx + 1,
                    $t->transaction_number,
                    \Carbon\Carbon::parse($t->transaction_date)->format('Y-m-d'),
                    $t->expenseAccount?->name ?? '-',
                    $t->paymentAccount?->name ?? '-',
                    $t->recipient ?? '-',
                    $t->description ?? '-',
                    (float) $t->amount,
                    $t->creator?->name ?? '-',
                ]);
            }

            // Baris Total
            fputcsv($handle, [
                '', '', '', '', '', '', 'TOTAL', $total, '',
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function update(
        StoreCashTransactionRequest $request,
        CashTransaction $cashTransaction,
        \App\Domains\Accounting\Actions\UpdateCashTransaction $action,
    ): RedirectResponse {
        $validated = $request->validated();
        $validated['expense_account_id'] = $request->getExpenseAccountId();

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $originalName = $file->getClientOriginalName();
            $compressedPath = $this->compressAndStoreImage($file);

            $validated['attachment_path'] = $compressedPath;
            $validated['attachment_name'] = $originalName;
        }

        try {
            $action->execute($cashTransaction, $validated);
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['amount' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Pengeluaran kas berhasil diperbarui dan jurnal akuntansi telah disesuaikan.');
    }

    public function destroy(
        CashTransaction $cashTransaction,
        \App\Domains\Accounting\Actions\DeleteCashTransaction $action,
    ): RedirectResponse {
        try {
            $action->execute($cashTransaction);
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Pengeluaran kas dan jurnal akuntansi terkait berhasil dihapus.');
    }

    public function store(StoreCashTransactionRequest $request, CreateCashTransaction $action): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;
        $validated['expense_account_id'] = $request->getExpenseAccountId();

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $originalName = $file->getClientOriginalName();
            
            // Kompresi otomatis gambar ke WebP/JPEG berkualitas optimal dan ukuran ringkas
            $compressedPath = $this->compressAndStoreImage($file);
            
            $validated['attachment_path'] = $compressedPath;
            $validated['attachment_name'] = $originalName;
        }

        $action->execute($validated);

        return redirect()->back()->with('success', 'Pengeluaran kas berhasil dicatat dan jurnal akuntansi telah dibukukan.');
    }

    /**
     * Kompresi dan simpan gambar langsung ke folder public_path('uploads/...')
     * Aman untuk shared hosting tanpa ketergantungan 'php artisan storage:link' / symlink.
     */
    private function compressAndStoreImage(\Illuminate\Http\UploadedFile $file): string
    {
        $subDir = 'cash-attachments/' . date('Y/m');
        $filename = \Illuminate\Support\Str::random(40);
        $fullDir = public_path('uploads/' . $subDir);

        if (! file_exists($fullDir)) {
            mkdir($fullDir, 0755, true);
        }

        $imagePath = $file->getRealPath();
        $imageInfo = @getimagesize($imagePath);

        // Fallback jika GD tidak bisa membaca format khusus
        if (! $imageInfo) {
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
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
            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $file->move($fullDir, "{$filename}.{$extension}");
            return "uploads/{$subDir}/{$filename}.{$extension}";
        }

        // Perbaiki orientasi EXIF untuk kamera HP jika JPEG
        if ($imageType === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif = @exif_read_data($imagePath);
            if (! empty($exif['Orientation'])) {
                $sourceImage = match ($exif['Orientation']) {
                    3 => imagerotate($sourceImage, 180, 0),
                    6 => imagerotate($sourceImage, -90, 0),
                    8 => imagerotate($sourceImage, 90, 0),
                    default => $sourceImage,
                };
                $origWidth = imagesx($sourceImage);
                $origHeight = imagesy($sourceImage);
            }
        }

        // Hitung skala resize (Maksimal 1600px sisi terpanjang)
        $maxDimension = 1600;
        $newWidth = $origWidth;
        $newHeight = $origHeight;

        if ($origWidth > $maxDimension || $origHeight > $maxDimension) {
            if ($origWidth > $origHeight) {
                $newWidth = $maxDimension;
                $newHeight = (int) round(($origHeight / $origWidth) * $maxDimension);
            } else {
                $newHeight = $maxDimension;
                $newWidth = (int) round(($origWidth / $origHeight) * $maxDimension);
            }
        }

        $targetImage = imagecreatetruecolor($newWidth, $newHeight);

        // Pertahankan transparansi bila PNG/WebP
        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($targetImage, false);
            imagesavealpha($targetImage, true);
        }

        imagecopyresampled(
            $targetImage,
            $sourceImage,
            0, 0, 0, 0,
            $newWidth,
            $newHeight,
            $origWidth,
            $origHeight
        );

        // Simpan sebagai WebP (jika didukung) atau JPEG berkualitas 78%
        if (function_exists('imagewebp')) {
            $targetFile = "{$fullDir}/{$filename}.webp";
            imagewebp($targetImage, $targetFile, 78);
            $savedRelativePath = "uploads/{$subDir}/{$filename}.webp";
        } else {
            $targetFile = "{$fullDir}/{$filename}.jpg";
            imagejpeg($targetImage, $targetFile, 78);
            $savedRelativePath = "uploads/{$subDir}/{$filename}.jpg";
        }

        imagedestroy($sourceImage);
        imagedestroy($targetImage);

        return $savedRelativePath;
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100', 'unique:expense_categories,name'],
            'account_id' => ['required', 'string', 'exists:chart_of_accounts,id'],
            'description'=> ['nullable', 'string', 'max:500'],
        ]);

        $account = ChartOfAccount::findOrFail($validated['account_id']);
        if (! $account->isLeaf() || $account->type !== AccountType::EXPENSE) {
            return redirect()->back()->withErrors([
                'account_id' => 'Akun akuntansi yang dipilih harus akun beban/biaya tingkat transaksi (leaf).',
            ]);
        }

        ExpenseCategory::create([
            'name'        => $validated['name'],
            'account_id'  => $validated['account_id'],
            'description' => $validated['description'] ?? null,
            'is_active'   => true,
        ]);

        return redirect()->back()->with('success', "Kategori '{$validated['name']}' berhasil ditambahkan.");
    }
}
