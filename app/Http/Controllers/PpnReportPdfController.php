<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PpnReportPdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $period = $request->input('period', '06-2026');
        $periodLabel = $request->input('periodLabel', 'Masa Juni 2026');
        
        $taxSettlement = $request->input('taxSettlement', [
            'taxPeriod' => 'Masa Juni 2026',
            'ppnKeluaranTotal' => 7480000,
            'ppnMasukanTotal' => 1342000,
            'netAmount' => 6138000,
            'status' => 'paid',
            'ntpn' => '2606271109281200',
            'paidDate' => '2026-07-10',
            'bankName' => 'Bank Mandiri Solo Baru',
        ]);

        $ppnKeluaran = $request->input('ppnKeluaran', [
            [
                'id' => 'PK-001',
                'docNo' => 'INV-PPN-001',
                'nsfp' => '010.000-26.88219001',
                'client' => 'PT. Gojek Tokopedia',
                'npwp' => '01.312.456.7-011.000',
                'date' => '2026-06-25',
                'dpp' => 10000000,
                'ppn' => 1100000,
                'total' => 11100000,
                'efakturStatus' => 'approved',
            ],
            [
                'id' => 'PK-002',
                'docNo' => 'INV-PPN-002',
                'nsfp' => '010.000-26.88219002',
                'client' => 'PT. Indofood Sukses Makmur',
                'npwp' => '01.442.889.1-012.000',
                'date' => '2026-06-20',
                'dpp' => 25000000,
                'ppn' => 2750000,
                'total' => 27750000,
                'efakturStatus' => 'approved',
            ],
            [
                'id' => 'PK-003',
                'docNo' => 'INV-PPN-003',
                'nsfp' => '010.000-26.88219003',
                'client' => 'CV. Surya Jaya Printing',
                'npwp' => '02.551.992.3-013.000',
                'date' => '2026-06-18',
                'dpp' => 8000000,
                'ppn' => 880000,
                'total' => 8880000,
                'efakturStatus' => 'ready',
            ],
            [
                'id' => 'PK-004',
                'docNo' => 'INV-PPN-004',
                'nsfp' => '010.000-26.88219004',
                'client' => 'PT. Sampoerna Agro Tbk',
                'npwp' => '01.992.113.5-014.000',
                'date' => '2026-06-10',
                'dpp' => 25000000,
                'ppn' => 2750000,
                'total' => 27750000,
                'efakturStatus' => 'approved',
            ],
        ]);

        $ppnMasukan = $request->input('ppnMasukan', [
            [
                'id' => 'PM-001',
                'docNo' => 'PO-PPN-001',
                'nsfp' => '010.000-26.11029801',
                'vendor' => 'PT. Megah Billboard Jaya',
                'npwp' => '01.882.331.0-522.000',
                'date' => '2026-06-24',
                'dpp' => 3000000,
                'ppn' => 330000,
                'total' => 3330000,
                'creditableStatus' => 'creditable',
                'efakturStatus' => 'approved',
            ],
            [
                'id' => 'PM-002',
                'docNo' => 'PO-PPN-002',
                'nsfp' => '010.000-26.11029802',
                'vendor' => 'PT. Promosi Outdoor Kreasindo',
                'npwp' => '02.991.442.8-511.000',
                'date' => '2026-06-20',
                'dpp' => 8000000,
                'ppn' => 880000,
                'total' => 8880000,
                'creditableStatus' => 'creditable',
                'efakturStatus' => 'approved',
            ],
            [
                'id' => 'PM-003',
                'docNo' => 'PO-PPN-003',
                'nsfp' => '010.000-26.11029803',
                'vendor' => 'CV. Media Ad Perkasa',
                'npwp' => '03.771.229.4-523.000',
                'date' => '2026-06-15',
                'dpp' => 1200000,
                'ppn' => 132000,
                'total' => 1332000,
                'creditableStatus' => 'creditable',
                'efakturStatus' => 'ready',
            ],
        ]);

        // Dynamic Calculations
        $totalKeluaranDpp = 0;
        $totalKeluaranPpn = 0;
        foreach ($ppnKeluaran as $k) {
            $totalKeluaranDpp += (float) ($k['dpp'] ?? 0);
            $totalKeluaranPpn += (float) ($k['ppn'] ?? 0);
        }

        $totalMasukanDpp = 0;
        $totalMasukanPpnCreditable = 0;
        foreach ($ppnMasukan as $m) {
            $totalMasukanDpp += (float) ($m['dpp'] ?? 0);
            if (($m['creditableStatus'] ?? 'creditable') === 'creditable') {
                $totalMasukanPpnCreditable += (float) ($m['ppn'] ?? 0);
            }
        }

        $netPpnAmount = $totalKeluaranPpn - $totalMasukanPpnCreditable;

        $pdf = Pdf::loadView('pdf.ppn_report', [
            'period' => $period,
            'periodLabel' => $periodLabel,
            'taxSettlement' => $taxSettlement,
            'ppnKeluaran' => $ppnKeluaran,
            'ppnMasukan' => $ppnMasukan,
            'totalKeluaranDpp' => $totalKeluaranDpp,
            'totalKeluaranPpn' => $totalKeluaranPpn,
            'totalMasukanDpp' => $totalMasukanDpp,
            'totalMasukanPpnCreditable' => $totalMasukanPpnCreditable,
            'netPpnAmount' => $netPpnAmount,
            'printedAt' => date('d/m/Y H:i'),
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = "Laporan_PPN_Masa_{$period}.pdf";

        if ($request->input('stream', true)) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
