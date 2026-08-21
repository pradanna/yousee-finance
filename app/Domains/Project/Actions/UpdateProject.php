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
            $oldContractValue = (float) $project->contract_value;
            $oldStatus = $project->status instanceof \App\Domains\Project\Enums\ProjectStatus ? $project->status->value : (string) $project->status;

            $newContractValue = array_key_exists('contract_value', $data)
                ? $this->resolveDpp($project->fiscal_mode instanceof FiscalMode ? $project->fiscal_mode->value : $project->fiscal_mode, (float) $data['contract_value'], (bool) ($data['is_ppn_inclusive'] ?? false))
                : (float) $project->contract_value;

            $newStatus = isset($data['status'])
                ? ($data['status'] instanceof \App\Domains\Project\Enums\ProjectStatus ? $data['status']->value : (string) $data['status'])
                : $oldStatus;

            $project->update([
                'name' => $data['name'] ?? $project->name,
                'client_id' => $data['client_id'] ?? $project->client_id,
                'sales_id' => array_key_exists('sales_id', $data) ? $data['sales_id'] : $project->sales_id,
                'start_date' => $data['start_date'] ?? $project->start_date,
                'end_date' => $data['end_date'] ?? $project->end_date,
                'contract_value' => $newContractValue,
                'target_qty' => $data['target_qty'] ?? $project->target_qty,
                'status' => $data['status'] ?? $project->status,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $project->notes,
            ]);

            // Deteksi jenis event dan buat deskripsi spesifik
            $event = 'updated';
            $descParts = [];

            if ($oldStatus !== $newStatus) {
                $event = 'status_changed';
                $descParts[] = "Status berubah dari " . strtoupper($oldStatus) . " menjadi " . strtoupper($newStatus);
            }

            if (round($oldContractValue, 2) !== round($newContractValue, 2)) {
                $descParts[] = "Nilai kontrak berubah dari Rp " . number_format($oldContractValue, 0, ',', '.') . " menjadi Rp " . number_format($newContractValue, 0, ',', '.');
            }

            $description = ! empty($descParts)
                ? "Memperbarui proyek [{$project->code}]: " . implode('; ', $descParts)
                : "Memperbarui informasi proyek [{$project->code}] \"{$project->name}\"";

            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => Project::class,
                'auditable_id'   => $project->id,
                'event'          => $event,
                'user_id'        => auth()->id(),
                'description'    => $description,
                'properties'     => [
                    'code'               => $project->code,
                    'old_contract_value' => $oldContractValue,
                    'new_contract_value' => $newContractValue,
                    'old_status'         => $oldStatus,
                    'new_status'         => $newStatus,
                ],
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
