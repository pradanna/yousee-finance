<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseOrderPdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $project = $request->input('project', []);
        $vendorName = $request->input('vendorName', 'CV. Taka Karya Abadi');
        $locations = $request->input('locations', []);
        $isPPN = filter_var($request->input('isPPN', false), FILTER_VALIDATE_BOOLEAN);
        $poNumber = $request->input('poNumber', '004/PTSSI-PO/06/26');
        $poDate = $request->input('poDate', date('d/m/Y'));

        $totalDPP = 0;
        foreach ($locations as $item) {
            $totalDPP += (float) ($item['vendorCost'] ?? 0);
        }
        $totalPPN = $isPPN ? ($totalDPP * 0.11) : 0;
        $grandTotal = $totalDPP + $totalPPN;

        $qrData = "https://drive.google.com/file/d/1z4ikYYW_ZwNhQN7aZFaE2jbhtMjatgul/view?usp=sharing";
        $qrCodeBase64 = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->errorCorrection('M')->generate($qrData));

        $pdf = Pdf::loadView('pdf.purchase_order', [
            'project' => $project,
            'vendorName' => $vendorName,
            'locations' => $locations,
            'isPPN' => $isPPN,
            'poNumber' => $poNumber, 
            'poDate' => $poDate,
            'totalDPP' => $totalDPP,
            'totalPPN' => $totalPPN,
            'grandTotal' => $grandTotal,
            'qrCodeBase64' => $qrCodeBase64,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $safePoNumber = str_replace(['/', '\\'], '_', $poNumber);
        $filename = "Purchase_Order_{$safePoNumber}.pdf";

        if ($request->input('stream', true)) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
