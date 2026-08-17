<?php

declare(strict_types=1);

namespace App\Http\Controllers\Sales;

use App\Domains\Project\Models\Project;
use App\Domains\Sales\Actions\ArchiveSales;
use App\Domains\Sales\Actions\CreateSales;
use App\Domains\Sales\Actions\DeleteSales;
use App\Domains\Sales\Actions\UnarchiveSales;
use App\Domains\Sales\Actions\UpdateSales;
use App\Domains\Sales\Models\Sales;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\StoreSalesRequest;
use App\Http\Requests\Sales\UpdateSalesRequest;
use App\Http\Resources\Sales\SalesResource;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    /**
     * Display a listing of the sales team.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status', 'active');
        $sortBy = (string) $request->query('sort_by', 'updated_at');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'email', 'commission_rate', 'updated_at', 'created_at'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'updated_at';
            $sortDirection = 'desc';
        }

        $query = Sales::withCount('projects');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm)
                  ->orWhere('phone', 'like', $searchTerm);
            });
        }

        if ($status === 'active') {
            $query->where('is_archived', false);
        } elseif ($status === 'archived') {
            $query->where('is_archived', true);
        }

        $query->orderBy($sortBy, $sortDirection);

        $sales = $query->paginate(10)->withQueryString();

        // Calculate global overview metrics
        $totalSales = Sales::count();
        $activeSales = Sales::where('is_archived', false)->count();
        $archivedSales = Sales::where('is_archived', true)->count();
        $avgCommission = round((float) Sales::where('is_archived', false)->avg('commission_rate'), 1);
        $totalProjectsHandled = Project::whereNotNull('sales_id')->count();

        return Inertia::render('Sales', [
            'sales' => [
                'data' => SalesResource::collection($sales)->resolve(),
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'from' => $sales->firstItem(),
                'to' => $sales->lastItem(),
                'total' => $sales->total(),
                'per_page' => $sales->perPage(),
            ],
            'metrics' => [
                'totalSales' => $totalSales,
                'activeSales' => $activeSales,
                'archivedSales' => $archivedSales,
                'avgCommission' => $avgCommission,
                'totalProjectsHandled' => $totalProjectsHandled,
            ],
            'filters' => [
                'search' => (string) ($search ?? ''),
                'status' => (string) $status,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created sales rep in storage.
     */
    public function store(StoreSalesRequest $request, CreateSales $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Personil sales berhasil ditambahkan.');
    }

    /**
     * Update the specified sales rep in storage.
     */
    public function update(UpdateSalesRequest $request, Sales $sale, UpdateSales $action): RedirectResponse
    {
        $action->execute($sale, $request->validated());

        return redirect()->back()->with('success', 'Data personil sales berhasil diperbarui.');
    }

    /**
     * Archive the specified sales rep.
     */
    public function archive(Sales $sale, ArchiveSales $action): RedirectResponse
    {
        $action->execute($sale);

        return redirect()->back()->with('success', 'Personil sales berhasil diarsipkan.');
    }

    /**
     * Unarchive the specified sales rep.
     */
    public function unarchive(Sales $sale, UnarchiveSales $action): RedirectResponse
    {
        $action->execute($sale);

        return redirect()->back()->with('success', 'Personil sales berhasil diaktifkan kembali.');
    }

    /**
     * Remove the specified sales rep from storage.
     */
    public function destroy(Sales $sale, DeleteSales $action): RedirectResponse
    {
        try {
            $action->execute($sale);

            return redirect()->back()->with('success', 'Personil sales berhasil dihapus.');
        } catch (DomainException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
