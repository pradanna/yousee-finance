<?php

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
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients.
     */
    public function index(): Response
    {
        $clients = Client::orderBy('name')->paginate(10);
        
        return Inertia::render('Client/Index', [
            'clients' => ClientResource::collection($clients),
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

        return redirect()->back()->with('success', 'Client berhasil diperbarui.');
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
        $action->execute($client);

        return redirect()->back()->with('success', 'Client berhasil dihapus.');
    }
}
