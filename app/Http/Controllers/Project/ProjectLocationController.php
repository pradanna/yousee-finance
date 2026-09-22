<?php

declare(strict_types=1);

namespace App\Http\Controllers\Project;

use App\Domains\Project\Actions\CreateProjectLocation;
use App\Domains\Project\Actions\DeleteProjectLocation;
use App\Domains\Project\Actions\ImportProjectLocations;
use App\Domains\Project\Actions\UpdateProjectLocation;
use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\ProjectLocationImportRequest;
use App\Http\Requests\Project\StoreProjectLocationRequest;
use App\Http\Requests\Project\UpdateProjectLocationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    /**
     * Unduh template file Excel/CSV untuk pengisian titik lokasi.
     */
    public function downloadTemplate(Project $project): StreamedResponse
    {
        $filename = "Template_Titik_Lokasi_Project_{$project->code}.csv";

        $sampleVendor = Vendor::active()->first();
        $sampleVendorCode = $sampleVendor ? $sampleVendor->code : 'VND-0001';

        return response()->streamDownload(function () use ($sampleVendorCode) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM untuk kompatibilitas sempurna dengan Microsoft Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header Kolom
            fputcsv($handle, [
                'Kode Vendor',
                'Area',
                'Keterangan Lokasi',
                'Jenis',
                'Ukuran',
                'Orientasi',
                'Penerangan',
                'Qty',
                'Biaya Vendor DPP (Rp)',
                'Catatan TOP',
            ]);

            // Baris Contoh 1
            fputcsv($handle, [
                $sampleVendorCode,
                'Semarang',
                'Billboard Simpang Lima Sudut Barat',
                'Billboard',
                '4x8m',
                'V',
                'Berlampu',
                1,
                15000000,
                'Termin 50:50',
            ]);

            // Baris Contoh 2
            fputcsv($handle, [
                $sampleVendorCode,
                'Solo',
                'Videotron Jl. Slamet Riyadi KM 2',
                'Videotron',
                '5x10m',
                'H',
                'Berlampu',
                1,
                25000000,
                'Pelunasan 30 hari',
            ]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Preview dan validasi file Excel/CSV sebelum diimpor ke database.
     */
    public function previewImport(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120'],
        ]);

        $file = $request->file('file');
        if (! $file) {
            return response()->json(['message' => 'File tidak ditemukan.'], 422);
        }

        $handle = fopen($file->getRealPath(), 'r');
        if (! $handle) {
            return response()->json(['message' => 'Gagal membuka file.'], 422);
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return response()->json(['message' => 'File kosong.'], 422);
        }

        // Strip UTF-8 BOM
        $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $firstLine);
        $delimiter = str_contains($firstLine, ';') ? ';' : ',';
        $headerCols = str_getcsv($firstLine, $delimiter);

        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), $headerCols);

        // Petakan index kolom
        $colVendor = $this->findColumnIndex($headers, ['kode vendor', 'vendor', 'kode_vendor']);
        $colArea = $this->findColumnIndex($headers, ['area', 'kota', 'wilayah']);
        $colDesc = $this->findColumnIndex($headers, ['keterangan lokasi', 'keterangan', 'lokasi', 'deskripsi']);
        $colType = $this->findColumnIndex($headers, ['jenis', 'tipe', 'type']);
        $colSize = $this->findColumnIndex($headers, ['ukuran', 'size']);
        $colOrientation = $this->findColumnIndex($headers, ['orientasi', 'orientation']);
        $colLighting = $this->findColumnIndex($headers, ['penerangan', 'lighting', 'lampu']);
        $colQty = $this->findColumnIndex($headers, ['qty', 'jumlah', 'quantity']);
        $colCost = $this->findColumnIndex($headers, ['biaya vendor dpp (rp)', 'biaya vendor', 'biaya', 'vendor_cost', 'cost']);
        $colTop = $this->findColumnIndex($headers, ['catatan top', 'top', 'catatan']);

        // Cache master vendor
        $vendors = Vendor::all();
        $vendorsByCode = [];
        $vendorsByName = [];
        foreach ($vendors as $v) {
            if ($v->code) {
                $vendorsByCode[strtoupper(trim((string) $v->code))] = $v;
            }
            $vendorsByName[strtolower(trim((string) $v->name))] = $v;
        }

        $previewItems = [];
        $errors = [];
        $rowNum = 1;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $rowNum++;

            // Skip empty rows
            $hasData = false;
            foreach ($row as $cell) {
                if (trim((string) $cell) !== '') {
                    $hasData = true;
                    break;
                }
            }
            if (! $hasData) {
                continue;
            }

            $rawVendor = trim((string) ($row[$colVendor] ?? ''));
            $rawArea = trim((string) ($row[$colArea] ?? ''));
            $rawDesc = trim((string) ($row[$colDesc] ?? ''));
            $rawType = trim((string) ($row[$colType] ?? 'Billboard'));
            $rawSize = trim((string) ($row[$colSize] ?? ''));
            $rawOrientation = strtoupper(trim((string) ($row[$colOrientation] ?? 'V')));
            $rawLighting = trim((string) ($row[$colLighting] ?? 'Berlampu'));
            $rawQty = (int) ($row[$colQty] ?? 1);
            $rawCostStr = trim((string) ($row[$colCost] ?? '0'));
            $rawTop = trim((string) ($row[$colTop] ?? ''));

            // Match Vendor
            $vendor = $vendorsByCode[strtoupper($rawVendor)] ?? $vendorsByName[strtolower($rawVendor)] ?? null;
            if (! $vendor) {
                $errors[] = "Baris {$rowNum}: Vendor dengan kode/nama '{$rawVendor}' tidak ditemukan di database.";
                continue;
            }

            $isProjectPpn = $project->fiscal_mode instanceof FiscalMode
                ? $project->fiscal_mode === FiscalMode::PPN
                : $project->fiscal_mode === FiscalMode::PPN->value;

            if ($isProjectPpn && ! $vendor->isPkp()) {
                $errors[] = "Baris {$rowNum}: Vendor '{$vendor->name}' berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN. Silakan lengkapi NPWP vendor di menu Master Vendor atau gunakan vendor PKP.";
                continue;
            }

            // Validasi Area & Deskripsi
            if ($rawArea === '') {
                $errors[] = "Baris {$rowNum}: Kolom 'Area' tidak boleh kosong.";
                continue;
            }
            if ($rawDesc === '') {
                $errors[] = "Baris {$rowNum}: Kolom 'Keterangan Lokasi' tidak boleh kosong.";
                continue;
            }

            // Validasi Jenis / Tipe
            $validTypes = ['Billboard', 'Videotron', 'Baliho', 'Neonbox'];
            $resolvedType = 'Billboard';
            foreach ($validTypes as $vt) {
                if (strcasecmp($vt, $rawType) === 0) {
                    $resolvedType = $vt;
                    break;
                }
            }

            // Validasi Ukuran
            if ($rawSize === '') {
                $rawSize = '4x8m';
            }

            // Validasi Orientasi
            if ($rawOrientation !== 'H') {
                $rawOrientation = 'V';
            }

            // Validasi Penerangan
            $resolvedLighting = str_contains(strtolower($rawLighting), 'tidak') ? 'Tidak Berlampu' : 'Berlampu';

            // Validasi Qty
            if ($rawQty < 1) {
                $rawQty = 1;
            }

            // Validasi Biaya
            $cleanCost = (float) preg_replace('/[^0-9.]/', '', $rawCostStr);
            if ($cleanCost <= 0) {
                $errors[] = "Baris {$rowNum}: Biaya vendor harus berupa angka nominal lebih dari 0.";
                continue;
            }

            $previewItems[] = [
                'vendor_id' => (string) $vendor->id,
                'vendor_code' => (string) ($vendor->code ?? ''),
                'vendor_name' => (string) $vendor->name,
                'area' => $rawArea,
                'description' => $rawDesc,
                'type' => $resolvedType,
                'size' => $rawSize,
                'orientation' => $rawOrientation,
                'lighting' => $resolvedLighting,
                'qty' => $rawQty,
                'vendor_cost' => $cleanCost,
                'is_ppn_inclusive' => false,
                'top_notes' => $rawTop !== '' ? $rawTop : null,
            ];
        }

        fclose($handle);

        return response()->json([
            'items' => $previewItems,
            'errors' => $errors,
            'total_rows' => count($previewItems) + count($errors),
            'valid_rows' => count($previewItems),
        ]);
    }

    /**
     * Simpan titik lokasi hasil review import ke database project.
     */
    public function import(ProjectLocationImportRequest $request, Project $project, ImportProjectLocations $action): RedirectResponse
    {
        $action->execute($project, $request->validated()['items']);

        return redirect()->back()->with('success', count($request->validated()['items']) . ' titik lokasi berhasil diimpor.');
    }

    /**
     * Helper untuk mencari index kolom header berdasarkan kata kunci.
     *
     * @param array<int, string> $headers
     * @param array<int, string> $candidates
     */
    private function findColumnIndex(array $headers, array $candidates): int
    {
        foreach ($candidates as $cand) {
            foreach ($headers as $idx => $header) {
                if (str_contains($header, $cand)) {
                    return $idx;
                }
            }
        }

        return 0;
    }
}
