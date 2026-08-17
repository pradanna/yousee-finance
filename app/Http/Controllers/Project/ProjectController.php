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
use App\Http\Resources\Client\ClientOptionResource;
use App\Http\Resources\Project\ProjectResource;
use App\Http\Resources\Sales\SalesOptionResource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     */
    public function index(): Response
    {
        $projects = Project::with(['client', 'sales'])->orderByDesc('created_at')->paginate(10);
        $clients = Client::active()->orderBy('name')->get(['id', 'name']);
        $sales = Sales::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Projects', [
            'projects' => ProjectResource::collection($projects),
            'clients' => ClientOptionResource::collection($clients)->resolve(),
            'sales' => SalesOptionResource::collection($sales)->resolve(),
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
        $action->execute($project);

        return redirect()->back()->with('success', 'Project berhasil dihapus.');
    }
}
