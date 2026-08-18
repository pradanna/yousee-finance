<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Http\Controllers\Controller;
use App\Http\Resources\Project\ProjectResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesTransactionController extends Controller
{
    /**
     * Display a listing of sales transactions & invoices.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $salesPic = $request->query('sales_pic');
        $status = $request->query('status'); // all, draft, issued, paid

        $query = Project::query()
            ->with([
                'client',
                'sales',
                'locations',
                'purchaseOrders.paymentPlan.terms.settlements',
                'purchaseOrders.vendor',
                'invoices.paymentPlan.terms.settlements',
            ])
            ->where('status', '!=', 'cancelled')
            ->latest('updated_at');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm)
                  ->orWhereHas('client', fn ($cq) => $cq->where('name', 'like', $searchTerm))
                  ->orWhereHas('invoices', fn ($iq) => $iq->where('invoice_number', 'like', $searchTerm));
            });
        }

        if (! empty($salesPic) && $salesPic !== 'all') {
            $query->whereHas('sales', fn ($sq) => $sq->where('name', $salesPic));
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

        $clients = Client::query()->orderBy('name')->get(['id', 'name']);
        $salesList = Sales::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('SalesTransactions', [
            'projects' => ProjectResource::collection($projects)->resolve(),
            'clients' => $clients,
            'sales' => $salesList,
            'cashBankAccounts' => $cashBankAccounts,
        ]);
    }
}
