<?php

declare(strict_types=1);

namespace App\Http\Controllers\Project;

use App\Domains\Project\Actions\CreateProjectLocation;
use App\Domains\Project\Actions\DeleteProjectLocation;
use App\Domains\Project\Actions\UpdateProjectLocation;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectLocationRequest;
use App\Http\Requests\Project\UpdateProjectLocationRequest;
use Illuminate\Http\RedirectResponse;

class ProjectLocationController extends Controller
{
    /**
     * Store a newly created project location in storage.
     */
    public function store(StoreProjectLocationRequest $request, Project $project, CreateProjectLocation $action): RedirectResponse
    {
        $action->execute($project, $request->validated());

        return redirect()->back()->with('success', 'Titik lokasi berhasil ditambahkan.');
    }

    /**
     * Update the specified project location in storage.
     */
    public function update(UpdateProjectLocationRequest $request, Project $project, ProjectLocation $location, UpdateProjectLocation $action): RedirectResponse
    {
        abort_unless($location->project_id === $project->id, 404);

        $action->execute($location, $request->validated());

        return redirect()->back()->with('success', 'Titik lokasi berhasil diperbarui.');
    }

    /**
     * Remove the specified project location from storage.
     */
    public function destroy(Project $project, ProjectLocation $location, DeleteProjectLocation $action): RedirectResponse
    {
        abort_unless($location->project_id === $project->id, 404);

        $action->execute($location);

        return redirect()->back()->with('success', 'Titik lokasi berhasil dihapus.');
    }
}
