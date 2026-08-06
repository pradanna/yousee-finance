<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ClientInvoicePdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $project = $request->input('project', []);
        $clientName = $request->input('clientName', 'Bapak Sugiyamto, S.Pd., M.Pd.');
        $clientSubName = $request->input('clientSubName', 'Kepala SMK Binawiyata Karangmalang Sragen');
        $invoiceNumber = $request->input('invoiceNumber', 'INV-06/2026/001');
        $invoiceDate = $request->input('invoiceDate', date('d/m/Y'));
        $locations = $request->input('locations', []);
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

        $subtotal = 0;
        foreach ($locations as $item) {
            $subtotal += (float) ($item['vendorCost'] ?? $item['clientPrice'] ?? 0);
        }

        $ppnAmount = $isPPN ? ($subtotal * 0.11) : 0;
        $totalBeforeDp = $subtotal + $ppnAmount;
        $grandTotal = max(0, $totalBeforeDp - $dpAmount);

        $pdf = Pdf::loadView('pdf.client_invoice', [
            'project' => $project,
            'clientName' => $clientName,
            'clientSubName' => $clientSubName,
            'invoiceNumber' => $invoiceNumber,
            'invoiceDate' => $invoiceDate,
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
