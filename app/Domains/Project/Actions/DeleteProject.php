<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\Project;

class DeleteProject
{
    /**
     * Soft delete Project.
     */
    public function execute(Project $project): ?bool
    {
        return $project->delete();
    }
}
