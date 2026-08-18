<?php

declare(strict_types=1);

namespace App\Http\Controllers\Project;

use App\Domains\Client\Models\Client;
use App\Domains\Project\Actions\CreateProject;
use App\Domains\Project\Actions\DeleteProject;
use App\Domains\Project\Actions\UpdateProject;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Resources\Vendor\VendorOptionResource;
use App\Http\Resources\Client\ClientOptionResource;
use App\Http\Resources\Project\ProjectResource;
use App\Http\Resources\Sales\SalesOptionResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     */
    public function index(Request $request): Response
    {
        $clientId = $request->query('client_id');
        $salesId = $request->query('sales_id');
        $search = $request->query('search');

        $query = Project::with([
            'client',
            'sales',
            'locations.vendor',
            'locations.purchaseOrder',
            'purchaseOrders.vendor',
            'purchaseOrders.items',
            'purchaseOrders.paymentPlan.terms.settlements',
            'invoices.paymentPlan.terms',
        ]);

        if (! empty($clientId)) {
            $query->where('client_id', $clientId);
        }

        if (! empty($salesId)) {
            $query->where('sales_id', $salesId);
        }

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('code', 'like', $searchTerm);
            });
        }

        $projects = $query->orderByDesc('created_at')->paginate(10)->withQueryString();
        $clients = Client::active()->orderBy('name')->get(['id', 'name']);
        $sales = Sales::orderBy('name')->get(['id', 'name']);
        $vendors = Vendor::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Projects', [
            'projects' => ProjectResource::collection($projects),
            'clients' => ClientOptionResource::collection($clients)->resolve(),
            'sales' => SalesOptionResource::collection($sales)->resolve(),
            'vendors' => VendorOptionResource::collection($vendors)->resolve(),
            'filters' => [
                'client_id' => (string) ($clientId ?? ''),
                'sales_id' => (string) ($salesId ?? ''),
                'search' => (string) ($search ?? ''),
            ],
        ]);
    }

    /**
     * Display the specified project details.
     */
    public function show(Project $project): Response
    {
        $project->load([
            'client',
            'sales',
            'locations.vendor',
            'locations.purchaseOrder',
            'purchaseOrders.vendor',
            'purchaseOrders.items',
            'purchaseOrders.paymentPlan.terms.settlements',
            'invoices.paymentPlan.terms.settlements',
        ]);

        $clients = Client::active()->orderBy('name')->get(['id', 'name']);
        $sales = Sales::orderBy('name')->get(['id', 'name', 'commission_rate']);
        $vendors = Vendor::active()->orderBy('name')->get(['id', 'name']);

        $cashBankAccounts = \App\Domains\Accounting\Models\ChartOfAccount::where('is_active', true)
            ->where('code', 'like', '111%')
            ->orderBy('code')
            ->get()
            ->filter(fn (\App\Domains\Accounting\Models\ChartOfAccount $acc) => $acc->isLeaf())
            ->values()
            ->map(fn (\App\Domains\Accounting\Models\ChartOfAccount $acc) => [
                'id'           => $acc->id,
                'code'         => $acc->code,
                'name'         => $acc->name,
                'display_name' => "{$acc->code} - {$acc->name}",
            ]);

        return Inertia::render('Projects/Show', [
            'project'          => (new ProjectResource($project))->resolve(),
            'clients'          => ClientOptionResource::collection($clients)->resolve(),
            'sales'            => SalesOptionResource::collection($sales)->resolve(),
            'vendors'          => VendorOptionResource::collection($vendors)->resolve(),
            'cashBankAccounts' => $cashBankAccounts,
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(StoreProjectRequest $request, CreateProject $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Project berhasil ditambahkan.');
    }

    /**
     * Update the specified project in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project, UpdateProject $action): RedirectResponse
    {
        $action->execute($project, $request->validated());

        return redirect()->back()->with('success', 'Project berhasil diperbarui.');
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project, DeleteProject $action): RedirectResponse
    {
        try {
            $action->execute($project);
            return redirect()->back()->with('success', 'Project berhasil dibatalkan/dihapus.');
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
