<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;

class CreateProject
{
    /**
     * Buat Project baru. Kode di-generate server-side dan contract_value
     * selalu disimpan sebagai DPP murni (server merekonstruksi dari toggle
     * "Belum PPN" / "Sudah Inc. PPN" yang dikirim frontend).
     *
     * @param array<string, mixed> $data
     */
    public function execute(array $data): Project
    {
        return DB::transaction(function () use ($data) {
            $fiscalMode = $data['fiscal_mode'];

            return Project::create([
                'code' => $this->generateCode($fiscalMode),
                'name' => $data['name'],
                'client_id' => $data['client_id'],
                'sales_id' => $data['sales_id'] ?? null,
                'fiscal_mode' => $fiscalMode,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'contract_value' => $this->resolveDpp($fiscalMode, (float) $data['contract_value'], (bool) ($data['is_ppn_inclusive'] ?? false)),
                'target_qty' => $data['target_qty'] ?? 1,
                'status' => ProjectStatus::DRAFT,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * Rekonstruksi nominal DPP murni dari input kontrak.
     * non-ppn         -> dpp = input
     * ppn + tax dpp   -> dpp = input
     * ppn + tax inc   -> dpp = round(input / 1.11, 2)
     */
    private function resolveDpp(string $fiscalMode, float $inputValue, bool $isInclusive): float
    {
        if ($fiscalMode !== FiscalMode::PPN->value) {
            return $inputValue;
        }

        return $isInclusive ? round($inputValue / 1.11, 2) : $inputValue;
    }

    private function generateCode(string $fiscalMode): string
    {
        $year = now()->year;
        $modeTag = $fiscalMode === FiscalMode::PPN->value ? 'PPN' : 'NON';
        $prefix = "PRJ-{$year}-{$modeTag}";

        $sequence = Project::withTrashed()
            ->where('code', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->count() + 1;

        return $prefix . str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);
    }
}
