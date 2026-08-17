<?php

declare(strict_types=1);

namespace App\Http\Controllers\Client;

use App\Domains\Client\Actions\ArchiveClient;
use App\Domains\Client\Actions\CreateClient;
use App\Domains\Client\Actions\DeleteClient;
use App\Domains\Client\Actions\UpdateClient;
use App\Domains\Client\Models\Client;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Http\Resources\Client\ClientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status', 'active');
        $pkp = $request->query('pkp', 'all');
        $sortBy = (string) $request->query('sort_by', 'updated_at');
        $sortDirection = strtolower((string) $request->query('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'npwp', 'updated_at', 'created_at', 'total', 'count'];
        if (! in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'updated_at';
            $sortDirection = 'desc';
        }

        $query = Client::withCount('projects')
            ->withSum('projects', 'contract_value');

        if (! empty($search)) {
            $searchTerm = '%' . trim((string) $search) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('npwp', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm)
                  ->orWhere('phone', 'like', $searchTerm);
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
            $query->orderBy('projects_sum_contract_value', $sortDirection);
        } elseif ($sortBy === 'count') {
            $query->orderBy('projects_count', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $clients = $query->paginate(10)->withQueryString();

        // Calculate overview metrics for top cards across entire database
        $totalClients = Client::count();
        $activeClients = Client::where('is_archived', false)->count();
        $archivedClients = Client::where('is_archived', true)->count();
        $pkpCount = Client::where('is_archived', false)->whereNotNull('npwp')->where('npwp', '!=', '')->count();
        $nonPkpCount = max(0, $activeClients - $pkpCount);

        return Inertia::render('Clients', [
            'clients' => [
                'data' => ClientResource::collection($clients)->resolve(),
                'current_page' => $clients->currentPage(),
                'last_page' => $clients->lastPage(),
                'from' => $clients->firstItem(),
                'to' => $clients->lastItem(),
                'total' => $clients->total(),
                'per_page' => $clients->perPage(),
            ],
            'metrics' => [
                'totalClients' => $totalClients,
                'activeClients' => $activeClients,
                'archivedClients' => $archivedClients,
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
     * Get transaction history for a specific client.
     */
    public function transactions(Client $client): JsonResponse
    {
        $projects = $client->projects()
            ->latest()
            ->get()
            ->map(function ($project) {
                return [
                    'id' => (string) ($project->code ?: $project->id),
                    'date' => $project->created_at?->format('d M Y') ?? '-',
                    'project_name' => (string) $project->name,
                    'amount' => (float) ($project->contract_value ?? 0),
                    'fiscal_mode' => is_object($project->fiscal_mode) ? $project->fiscal_mode->value : (string) ($project->fiscal_mode ?? 'ppn'),
                    'status' => is_object($project->status) ? $project->status->value : (string) ($project->status ?? 'active'),
                ];
            });

        return response()->json([
            'client' => [
                'id' => (string) $client->id,
                'name' => (string) $client->name,
            ],
            'transactions' => $projects,
        ]);
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(StoreClientRequest $request, CreateClient $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->back()->with('success', 'Client berhasil ditambahkan.');
    }

    /**
     * Update the specified client in storage.
     */
    public function update(UpdateClientRequest $request, Client $client, UpdateClient $action): RedirectResponse
    {
        $action->execute($client, $request->validated());

        return redirect()->back()->with('success', 'Data client berhasil diperbarui.');
    }

    /**
     * Archive the specified client.
     */
    public function archive(Client $client, ArchiveClient $action): RedirectResponse
    {
        $action->execute($client, true);

        return redirect()->back()->with('success', 'Client berhasil diarsipkan.');
    }

    /**
     * Unarchive the specified client.
     */
    public function unarchive(Client $client, ArchiveClient $action): RedirectResponse
    {
        $action->execute($client, false);

        return redirect()->back()->with('success', 'Client berhasil diaktifkan kembali.');
    }

    /**
     * Remove the specified client from storage.
     */
    public function destroy(Client $client, DeleteClient $action): RedirectResponse
    {
        try {
            $action->execute($client);
            return redirect()->back()->with('success', 'Client berhasil dihapus.');
        } catch (\DomainException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus client. Pastikan client tidak memiliki transaksi aktif.');
        }
    }
}
