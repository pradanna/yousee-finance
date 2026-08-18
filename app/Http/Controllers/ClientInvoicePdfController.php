<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ClientInvoicePdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $project = $request->input('project', []);
        $clientName = $request->input('clientName', 'PT. Pakuwon Jati Tbk');
        $clientSubName = $request->input('clientSubName', 'Attn: Finance & Procurement');
        $invoiceNumber = $request->input('invoiceNumber', 'INV-06/2026/001');
        $invoiceDate = $request->input('invoiceDate', date('d/m/Y'));
        $locations = $request->input('locations', []);
        if (empty($locations)) {
            $locations = [
                [
                    'type' => 'Sewa Media Iklan',
                    'size' => '4x6m',
                    'orientation' => 'V',
                    'description' => 'Kampanye Iklan - Grand Opening Pakuwon Mall Yogyakarta',
                    'area' => 'Yogyakarta',
                    'qty' => 1,
                    'clientPrice' => 390000000,
                    'vendorCost' => 390000000,
                ]
            ];
        }
        $isPPN = filter_var($request->input('isPPN', false), FILTER_VALIDATE_BOOLEAN);
        $dpAmount = (float) $request->input('dpAmount', 0);
        $bankAccountName = $request->input('bankAccountName', 'Yosua Eka Setiawan');
        $bankName = $request->input('bankName', 'BCA');
        $bankAccountNumber = $request->input('bankAccountNumber', '1530509423');
        $bankBranch = $request->input('bankBranch', 'BCA Cabang Singosaren Surakarta');
        $notes = $request->input('notes', [
            'Perawatan Selama Kontrak (Visual sobek, kerusakan media, dsb)',
            'Free cetak & pasang visual 1 kali',
            'Berlampu',
            'Durasi Tayang Baliho 1 Bulan',
        ]);
        $directorName = $request->input('directorName', 'Yosua Eka S');
        $directorTitle = $request->input('directorTitle', 'Direktur');

        $termLabel = $request->input('termLabel', '');
        $contractTotalDpp = (float) $request->input('contractTotalDpp', 0);
        $contractTotalInvoice = (float) $request->input('contractTotalInvoice', 0);

        if ($request->filled('subtotal')) {
            $subtotal = (float) $request->input('subtotal');
        } else {
            $subtotal = 0;
            foreach ($locations as $item) {
                $subtotal += (float) ($item['vendorCost'] ?? $item['clientPrice'] ?? 0);
            }
        }

        $ppnAmount = $isPPN ? round($subtotal * 0.11, 2) : 0;
        $totalBeforeDp = round($subtotal + $ppnAmount, 2);
        $grandTotal = max(0, round($totalBeforeDp - $dpAmount, 2));

        $pdf = Pdf::loadView('pdf.client_invoice', [
            'project' => $project,
            'clientName' => $clientName,
            'clientSubName' => $clientSubName,
            'invoiceNumber' => $invoiceNumber,
            'invoiceDate' => $invoiceDate,
            'termLabel' => $termLabel,
            'contractTotalDpp' => $contractTotalDpp,
            'contractTotalInvoice' => $contractTotalInvoice,
            'locations' => $locations,
            'isPPN' => $isPPN,
            'subtotal' => $subtotal,
            'ppnAmount' => $ppnAmount,
            'dpAmount' => $dpAmount,
            'grandTotal' => $grandTotal,
            'bankAccountName' => $bankAccountName,
            'bankName' => $bankName,
            'bankAccountNumber' => $bankAccountNumber,
            'bankBranch' => $bankBranch,
            'notes' => $notes,
            'directorName' => $directorName,
            'directorTitle' => $directorTitle,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $safeInvoiceNumber = str_replace(['/', '\\'], '_', $invoiceNumber);
        $filename = "Invoice_{$safeInvoiceNumber}.pdf";

        if ($request->input('stream', true)) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
