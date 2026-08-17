<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;

class UpdateProject
{
    /**
     * Update Project. fiscal_mode TIDAK dikirim ke update() — immutable
     * setelah create, dijaga juga oleh guard di Project::boot().
     *
     * @param array<string, mixed> $data
     */
    public function execute(Project $project, array $data): Project
    {
        return DB::transaction(function () use ($project, $data) {
            $project->update([
                'name' => $data['name'] ?? $project->name,
                'client_id' => $data['client_id'] ?? $project->client_id,
                'sales_id' => array_key_exists('sales_id', $data) ? $data['sales_id'] : $project->sales_id,
                'start_date' => $data['start_date'] ?? $project->start_date,
                'end_date' => $data['end_date'] ?? $project->end_date,
                'contract_value' => array_key_exists('contract_value', $data)
                    ? $this->resolveDpp($project->fiscal_mode instanceof FiscalMode ? $project->fiscal_mode->value : $project->fiscal_mode, (float) $data['contract_value'], (bool) ($data['is_ppn_inclusive'] ?? false))
                    : $project->contract_value,
                'target_qty' => $data['target_qty'] ?? $project->target_qty,
                'status' => $data['status'] ?? $project->status,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $project->notes,
            ]);

            return $project;
        });
    }

    private function resolveDpp(string $fiscalMode, float $inputValue, bool $isInclusive): float
    {
        if ($fiscalMode !== FiscalMode::PPN->value) {
            return $inputValue;
        }

        return $isInclusive ? round($inputValue / 1.11, 2) : $inputValue;
    }
}
