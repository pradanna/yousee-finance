<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vendor;

use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Vendor\Actions\ArchiveVendor;
use App\Domains\Vendor\Actions\CreateVendor;
use App\Domains\Vendor\Actions\DeleteVendor;
use App\Domains\Vendor\Actions\UpdateVendor;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Http\Resources\Vendor\VendorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorController extends Controller
{
    /**
     * Display a listing of the vendors.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status', 'active');
        $pkp = $request->query('pkp', 'all');
        $sortBy = (string) $request->query('sort_by', 'updated_at');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'code', 'pic', 'npwp', 'updated_at', 'created_at', 'total', 'count'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'updated_at';
            $sortDirection = 'desc';
        }

        $query = Vendor::withCount('purchaseOrders')
            ->withSum('purchaseOrders', 'total');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm)
                  ->orWhere('pic', 'like', $searchTerm)
                  ->orWhere('npwp', 'like', $searchTerm);
            });
        }

        if ($status === 'active') {
            $query->where('is_archived', false);
        } elseif ($status === 'archived') {
            $query->where('is_archived', true);
        }

        if ($pkp === 'pkp') {
            $query->whereNotNull('npwp')->where('npwp', '!=', '');
        } elseif ($pkp === 'non-pkp') {
            $query->where(function ($q) {
                $q->whereNull('npwp')->orWhere('npwp', '');
            });
        }

        // Apply sorting
        if ($sortBy === 'total') {
            $query->orderBy('purchase_orders_sum_total', $sortDirection);
        } elseif ($sortBy === 'count') {
            $query->orderBy('purchase_orders_count', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $vendors = $query->paginate(10)->withQueryString();

        // Calculate overview metrics for top cards across entire database
        $totalVendors = Vendor::count();
        $activeVendors = Vendor::where('is_archived', false)->count();
        $archivedVendors = Vendor::where('is_archived', true)->count();
        $pkpCount = Vendor::where('is_archived', false)->whereNotNull('npwp')->where('npwp', '!=', '')->count();
        $nonPkpCount = max(0, $activeVendors - $pkpCount);

        return Inertia::render('Vendors', [
            'vendors' => [
                'data' => VendorResource::collection($vendors)->resolve(),
                'current_page' => $vendors->currentPage(),
                'last_page' => $vendors->lastPage(),
                'from' => $vendors->firstItem(),
                'to' => $vendors->lastItem(),
                'total' => $vendors->total(),
                'per_page' => $vendors->perPage(),
            ],
            'metrics' => [
                'totalVendors' => $totalVendors,
                'activeVendors' => $activeVendors,
                'archivedVendors' => $archivedVendors,
                'pkpCount' => $pkpCount,
                'nonPkpCount' => $nonPkpCount,
            ],
            'filters' => [
                'search' => (string) ($search ?? ''),
                'status' => (string) $status,
                'pkp' => (string) $pkp,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created vendor in storage.
     */
    public function store(StoreVendorRequest $request, CreateVendor $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Vendor berhasil ditambahkan.');
    }

    /**
     * Update the specified vendor in storage.
     */
    public function update(UpdateVendorRequest $request, Vendor $vendor, UpdateVendor $action): RedirectResponse
    {
        $action->execute($vendor, $request->validated());

        return redirect()->back()->with('success', 'Data vendor berhasil diperbarui.');
    }

    /**
     * Archive the specified vendor.
     */
    public function archive(Vendor $vendor, ArchiveVendor $action): RedirectResponse
    {
        $action->execute($vendor, true);

        return redirect()->back()->with('success', 'Vendor berhasil diarsipkan.');
    }

    /**
     * Unarchive the specified vendor.
     */
    public function unarchive(Vendor $vendor, ArchiveVendor $action): RedirectResponse
    {
        $action->execute($vendor, false);

        return redirect()->back()->with('success', 'Vendor berhasil diaktifkan kembali.');
    }

    /**
     * Remove the specified vendor from storage.
     */
    public function destroy(Vendor $vendor, DeleteVendor $action): RedirectResponse
    {
        $action->execute($vendor);

        return redirect()->back()->with('success', 'Vendor berhasil dihapus.');
    }

    /**
     * Get transaction POs associated with a vendor.
     */
    public function transactions(Vendor $vendor): JsonResponse
    {
        $pos = $vendor->purchaseOrders()
            ->with('project:id,name,code')
            ->orderByDesc('transaction_date')
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'po_number' => $po->po_number ?? 'PO-' . substr($po->id, 0, 8),
                'project_name' => $po->project->name ?? 'Project Umum',
                'date' => $po->transaction_date ? $po->transaction_date->format('Y-m-d') : $po->created_at->format('Y-m-d'),
                'amount' => (float) $po->total,
                'status' => $po->status instanceof \BackedEnum ? $po->status->value : (string) $po->status,
                'fiscal_mode' => $po->fiscal_mode instanceof \BackedEnum ? $po->fiscal_mode->value : (string) $po->fiscal_mode,
            ]);

        return response()->json([
            'vendor' => [
                'id' => $vendor->id,
                'name' => $vendor->name,
                'npwp' => $vendor->npwp,
            ],
            'transactions' => $pos,
        ]);
    }

    /**
     * Export daftar vendor ke format spreadsheet Excel / CSV kompatibel Microsoft Excel.
     */
    public function export(Request $request): StreamedResponse
    {
        $search = $request->query('search');
        $status = $request->query('status', 'all');
        $pkp = $request->query('pkp', 'all');
        $sortBy = (string) $request->query('sort_by', 'code');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['code', 'name', 'pic', 'npwp', 'updated_at', 'created_at', 'total', 'count'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'code';
            $sortDirection = 'asc';
        }

        $query = Vendor::withCount('purchaseOrders')
            ->withSum('purchaseOrders', 'total');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm)
                  ->orWhere('pic', 'like', $searchTerm)
                  ->orWhere('npwp', 'like', $searchTerm);
            });
        }

        if ($status === 'active') {
            $query->where('is_archived', false);
        } elseif ($status === 'archived') {
            $query->where('is_archived', true);
        }

        if ($pkp === 'pkp') {
            $query->whereNotNull('npwp')->where('npwp', '!=', '');
        } elseif ($pkp === 'non-pkp') {
            $query->where(function ($q) {
                $q->whereNull('npwp')->orWhere('npwp', '');
            });
        }

        // Sorting
        if ($sortBy === 'total') {
            $query->orderBy('purchase_orders_sum_total', $sortDirection);
        } elseif ($sortBy === 'count') {
            $query->orderBy('purchase_orders_count', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $vendors = $query->get();

        $timestamp = now()->format('Ymd_His');
        $filename = "Daftar_Vendor_{$timestamp}.csv";

        return response()->streamDownload(function () use ($vendors) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM untuk kompatibilitas sempurna dengan Microsoft Excel di Windows
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header Kolom
            fputcsv($handle, [
                'No',
                'Kode Vendor',
                'Nama Vendor',
                'PIC / Kontak Person',
                'NPWP Resmi',
                'Status PKP',
                'Telepon / WhatsApp',
                'Email',
                'Alamat',
                'Status',
                'Total PO',
                'Total Nominal Transaksi (Rp)',
                'Terdaftar Pada',
            ]);

            foreach ($vendors as $idx => $v) {
                $hasNpwp = ! empty($v->npwp) && trim((string) $v->npwp) !== '';
                fputcsv($handle, [
                    $idx + 1,
                    (string) ($v->code ?? ''),
                    (string) $v->name,
                    (string) ($v->pic ?? '-'),
                    (string) ($v->npwp ?? '-'),
                    $hasNpwp ? 'PKP' : 'Non-PKP',
                    (string) ($v->phone ?? '-'),
                    (string) ($v->email ?? '-'),
                    (string) ($v->address ?? '-'),
                    $v->is_archived ? 'Diarsipkan' : 'Aktif',
                    (int) ($v->purchase_orders_count ?? 0),
                    (float) ($v->purchase_orders_sum_total ?? 0),
                    $v->created_at ? $v->created_at->format('Y-m-d H:i') : '-',
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
