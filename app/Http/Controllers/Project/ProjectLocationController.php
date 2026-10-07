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
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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
     * Sheet 1: Template Titik Lokasi (Formulir Pengisian)
     * Sheet 2: Data Master Vendor (Daftar Vendor & Kode yang bisa dicopy)
     */
    public function downloadTemplate(Project $project): StreamedResponse
    {
        $filename = "Template_Titik_Lokasi_Project_{$project->code}.xlsx";

        $sampleVendor = Vendor::active()->first();
        $sampleVendorCode = $sampleVendor ? $sampleVendor->code : 'VND-0001';
        $vendors = Vendor::active()->orderBy('name')->get();

        return response()->streamDownload(function () use ($sampleVendorCode, $vendors) {
            $spreadsheet = new Spreadsheet();

            // ─────────────────────────────────────────────────────────────────
            // SHEET 1: TEMPLATE TITIK LOKASI
            // ─────────────────────────────────────────────────────────────────
            $sheet1 = $spreadsheet->getActiveSheet();
            $sheet1->setTitle('Template Titik Lokasi');

            $headers1 = [
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
            ];

            foreach ($headers1 as $colIdx => $header) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet1->setCellValue("{$colLetter}1", $header);
            }

            // Styling Header Sheet 1 (Biru Modern #2563EB)
            $sheet1->getStyle('A1:J1')->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF2563EB'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            $sheet1->getRowDimension(1)->setRowHeight(26);

            // Baris Contoh 1
            $sheet1->fromArray([
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
            ], null, 'A2');

            // Baris Contoh 2
            $sheet1->fromArray([
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
            ], null, 'A3');

            // Format angka untuk kolom Biaya & Qty
            $sheet1->getStyle('H2:H100')->getNumberFormat()->setFormatCode('#,##0');
            $sheet1->getStyle('I2:I100')->getNumberFormat()->setFormatCode('#,##0');

            // Auto-size kolom Sheet 1
            foreach (range(1, 10) as $colIdx) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx);
                $sheet1->getColumnDimension($colLetter)->setAutoSize(true);
            }

            // ─────────────────────────────────────────────────────────────────
            // SHEET 2: DATA MASTER VENDOR (Bisa dicopy kodenya)
            // ─────────────────────────────────────────────────────────────────
            $sheet2 = $spreadsheet->createSheet();
            $sheet2->setTitle('Data Master Vendor');

            $headers2 = [
                'Kode Vendor (Copy Kolom Ini)',
                'Nama Vendor',
                'Status PKP',
                'NPWP',
                'Kontak / PIC',
            ];

            foreach ($headers2 as $colIdx => $header) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx + 1);
                $sheet2->setCellValue("{$colLetter}1", $header);
            }

            // Styling Header Sheet 2 (Emerald Green #059669)
            $sheet2->getStyle('A1:E1')->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF059669'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            $sheet2->getRowDimension(1)->setRowHeight(26);

            $vendorRow = 2;
            foreach ($vendors as $v) {
                $isPkp = $v->isPkp();
                $sheet2->fromArray([
                    $v->code ?? '-',
                    $v->name,
                    $isPkp ? 'PKP' : 'Non-PKP',
                    $v->npwp ?: '-',
                    $v->phone ?: ($v->pic_name ?: '-'),
                ], null, "A{$vendorRow}");

                // Highlight status PKP
                if (! $isPkp) {
                    $sheet2->getStyle("C{$vendorRow}")->getFont()->getColor()->setARGB('FFDC2626');
                } else {
                    $sheet2->getStyle("C{$vendorRow}")->getFont()->getColor()->setARGB('FF059669');
                }

                $sheet2->getStyle("A{$vendorRow}")->getFont()->setBold(true);
                $vendorRow++;
            }

            // Auto-size kolom Sheet 2
            foreach (range(1, 5) as $colIdx) {
                $colLetter = Coordinate::stringFromColumnIndex($colIdx);
                $sheet2->getColumnDimension($colLetter)->setAutoSize(true);
            }

            // Set tampilan aktif kembali ke Sheet 1
            $spreadsheet->setActiveSheetIndex(0);

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Preview dan validasi file Excel/CSV sebelum diimpor ke database.
     */
    public function previewImport(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $request->file('file');
        if (! $file) {
            return response()->json(['message' => 'File tidak ditemukan.'], 422);
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $isExcel = in_array($extension, ['xlsx', 'xls'], true);

        // Siapkan array baris dari file (Excel atau CSV)
        $rawRows = [];

        if ($isExcel) {
            try {
                $spreadsheet = IOFactory::load($file->getRealPath());
                // Baca Sheet 1 (Template Titik Lokasi)
                $sheet = $spreadsheet->getSheet(0);
                $rawRows = $sheet->toArray();
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Gagal membaca file Excel: ' . $e->getMessage()], 422);
            }

            if (empty($rawRows)) {
                return response()->json(['message' => 'File Excel kosong.'], 422);
            }

            $headerCols = array_shift($rawRows);
        } else {
            // Format CSV / Text
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

            // Jika baris pertama terbungkus tanda kutip luar (misal hasil ekspor kolom tunggal dari spreadsheet)
            if (count($headerCols) === 1 && isset($headerCols[0]) && (str_contains($headerCols[0], ',') || str_contains($headerCols[0], ';'))) {
                $innerDelimiter = str_contains($headerCols[0], ';') ? ';' : ',';
                $headerCols = str_getcsv($headerCols[0], $innerDelimiter);
                $delimiter = $innerDelimiter;
            }

            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                // Jika baris terbungkus tanda kutip luar
                if (count($row) === 1 && isset($row[0]) && (str_contains($row[0], ',') || str_contains($row[0], ';'))) {
                    $row = str_getcsv($row[0], $delimiter);
                }
                $rawRows[] = $row;
            }
            fclose($handle);
        }

        $headers = array_map(fn ($h) => strtolower(trim((string) $h)), (array) $headerCols);

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

        foreach ($rawRows as $row) {
            $rowNum++;

            // Skip empty rows
            $hasData = false;
            foreach ((array) $row as $cell) {
                if (trim((string) $cell) !== '') {
                    $hasData = true;
                    break;
                }
            }
            if (! $hasData) {
                continue;
            }

            $rawVendor = $colVendor !== null ? trim((string) ($row[$colVendor] ?? '')) : '';
            $rawArea = $colArea !== null ? trim((string) ($row[$colArea] ?? '')) : '';
            $rawDesc = $colDesc !== null ? trim((string) ($row[$colDesc] ?? '')) : '';
            $rawType = $colType !== null ? trim((string) ($row[$colType] ?? 'Billboard')) : 'Billboard';
            $rawSize = $colSize !== null ? trim((string) ($row[$colSize] ?? '')) : '';
            $rawOrientation = $colOrientation !== null ? strtoupper(trim((string) ($row[$colOrientation] ?? 'V'))) : 'V';
            $rawLighting = $colLighting !== null ? trim((string) ($row[$colLighting] ?? 'Berlampu')) : 'Berlampu';
            $rawQty = $colQty !== null ? (int) ($row[$colQty] ?? 1) : 1;
            $rawCostStr = $colCost !== null ? trim((string) ($row[$colCost] ?? '0')) : '0';
            $rawTop = $colTop !== null ? trim((string) ($row[$colTop] ?? '')) : '';

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
            $cleanCost = $this->parseCurrencyNominal($rawCostStr);
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
    private function findColumnIndex(array $headers, array $candidates): ?int
    {
        foreach ($candidates as $cand) {
            foreach ($headers as $idx => $header) {
                if (str_contains($header, $cand)) {
                    return $idx;
                }
            }
        }

        return null;
    }

    /**
     * Parse string nominal uang (mendukung titik ribuan Indonesia misal 16.000.000,
     * koma ribuan internasional 16,000,000, dan prefix Rp/IDR).
     */
    private function parseCurrencyNominal(string $rawCostStr): float
    {
        $val = trim($rawCostStr);
        $val = preg_replace('/^(rp|idr)\.?\s*/i', '', $val);
        $val = trim((string) $val);

        if (preg_match('/\.\d{3}/', $val)) {
            // Format titik ribuan Indonesia
            $val = str_replace('.', '', $val);
            $val = str_replace(',', '.', $val);
        } elseif (preg_match('/,\d{3}/', $val)) {
            // Format koma ribuan internasional
            $val = str_replace(',', '', $val);
        } else {
            $val = str_replace(',', '.', $val);
        }

        return (float) preg_replace('/[^0-9.]/', '', $val);
    }
}
