<?php

declare(strict_types=1);

namespace App\Http\Controllers\Procurement;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Project\Models\Project;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Controllers\Controller;
use App\Http\Resources\Project\ProjectResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders & vendor procurement transactions.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $query = Project::query()
            ->with([
                'client',
                'sales',
                'locations.vendor',
                'purchaseOrders.items',
                'purchaseOrders.vendor',
                'purchaseOrders.paymentPlan.terms.settlements',
            ])
            ->whereHas('locations')
            ->latest('updated_at');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm)
                  ->orWhereHas('client', fn ($cq) => $cq->where('name', 'like', $searchTerm))
                  ->orWhereHas('purchaseOrders', fn ($pq) => $pq->where('po_number', 'like', $searchTerm));
            });
        }

        $projects = $query->get();

        $cashBankAccounts = ChartOfAccount::query()
            ->whereIn('type', ['asset'])
            ->where(function ($q) {
                $q->where('code', 'like', '111%')
                  ->orWhere('name', 'like', '%Kas%')
                  ->orWhere('name', 'like', '%Bank%')
                  ->orWhere('name', 'like', '%BCA%')
                  ->orWhere('name', 'like', '%Mandiri%');
            })
            ->whereDoesntHave('children')
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(fn ($acc) => [
                'id'           => $acc->id,
                'code'         => $acc->code,
                'name'         => $acc->name,
                'display_name' => "{$acc->code} - {$acc->name}",
            ]);

        $vendors = Vendor::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Purchases/index', [
            'projects' => ProjectResource::collection($projects)->resolve(),
            'vendors' => $vendors,
            'cashBankAccounts' => $cashBankAccounts,
        ]);
    }
}
