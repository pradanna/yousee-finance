<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;

class CreateProjectLocation
{
    /**
     * Tambah titik lokasi baru ke Project. Kode di-generate server-side dan
     * vendor_cost selalu disimpan sebagai DPP murni (server merekonstruksi
     * dari toggle "Belum PPN" / "Sudah Inc. PPN" yang dikirim frontend).
     *
     * @param array<string, mixed> $data
     */
    public function execute(Project $project, array $data): ProjectLocation
    {
        return DB::transaction(function () use ($project, $data) {
            return ProjectLocation::create([
                'project_id' => $project->id,
                'vendor_id' => $data['vendor_id'],
                'code' => $this->generateCode($project),
                'area' => $data['area'],
                'description' => $data['description'],
                'type' => $data['type'],
                'size' => $data['size'],
                'orientation' => $data['orientation'] ?? null,
                'lighting' => $data['lighting'] ?? null,
                'qty' => $data['qty'] ?? 1,
                'vendor_cost' => $this->resolveDpp($project, (float) $data['vendor_cost'], (bool) ($data['is_ppn_inclusive'] ?? false)),
                'top_notes' => $data['top_notes'] ?? null,
            ]);
        });
    }

    /**
     * Rekonstruksi nominal DPP murni dari input biaya titik.
     * non-ppn         -> dpp = input
     * ppn + tax dpp   -> dpp = input
     * ppn + tax inc   -> dpp = round(input / 1.11, 2)
     */
    private function resolveDpp(Project $project, float $inputValue, bool $isInclusive): float
    {
        if ($project->fiscal_mode !== FiscalMode::PPN) {
            return $inputValue;
        }

        return $isInclusive ? round($inputValue / 1.11, 2) : $inputValue;
    }

    private function generateCode(Project $project): string
    {
        $existingCodes = ProjectLocation::where('project_id', $project->id)
            ->lockForUpdate()
            ->pluck('code');

        $maxSeq = 0;
        foreach ($existingCodes as $code) {
            $numPart = substr($code, 4); // Strip 'LOC-'
            if (is_numeric($numPart)) {
                $maxSeq = max($maxSeq, (int) $numPart);
            }
        }

        $nextSeq = $maxSeq + 1;

        return 'LOC-' . str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
    }
}
