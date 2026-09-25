<?php

namespace App\Http\Controllers;

use App\Helpers\TerbilangHelper;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class KwitansiPdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $receiptNumber = $request->input('receiptNumber') ?? $request->input('invoiceNumber') ?? 'INV-05/2026/016';
        $receivedFrom = $request->input('receivedFrom', 'YAYASAN SANDJOJO');
        $amount = (float) $request->input('amount', 53280000);

        $terbilangInput = $request->input('terbilang');
        $terbilang = !empty($terbilangInput) ? strtoupper($terbilangInput) : TerbilangHelper::convert($amount);

        $forPaymentOf = $request->input(
            'forPaymentOf',
            'Pembayaran Lunas Pemasangan Billboard 4x8 V Jl MT Haryono, Karangturi, Kec Semarang Tim, Kota Semarang, Jawa Tengah Durasi Tayang 2 Bulan dan Baliho 4x6 V Jl Yos Sudarso, Kec Semarang Selatan, Kota Semarang, Jawa Tengah Durasi Tayang 1 Bulan'
        );

        $rawDate = $request->input('date');
        if (!empty($rawDate)) {
            try {
                $dateFormatted = Carbon::parse($rawDate)->isoFormat('D MMMM YYYY');
            } catch (\Throwable $e) {
                $dateFormatted = $rawDate;
            }
        } else {
            $dateFormatted = Carbon::now()->isoFormat('D MMMM YYYY');
        }

        $city = $request->input('city', 'Sukoharjo');

        $isPPN = false;
        if ($request->has('isPPN')) {
            $isPPN = filter_var($request->input('isPPN'), FILTER_VALIDATE_BOOLEAN);
        } else {
            $cleanInvNumber = str_replace('KW-', '', (string) $receiptNumber);
            $invoice = \App\Domains\Billing\Models\Invoice::where('invoice_number', $cleanInvNumber)
                ->orWhere('invoice_number', $request->input('invoiceNumber'))
                ->first();
            if ($invoice) {
                $isPPN = $invoice->fiscal_mode->value === 'ppn';
            } elseif (str_contains((string) $receiptNumber, 'INV-SSI') || str_contains((string) $receiptNumber, '-SSI') || str_contains((string) $receiptNumber, 'PPN')) {
                $isPPN = true;
            }
        }

        if ($isPPN) {
            $defaultBankAccountName = 'PT Sukma Setiawan Indonesia';
            $defaultBankName = 'Bank Mandiri Cabang Solo Baru';
            $defaultBankShortName = 'Mandiri';
            $defaultBankAccountNumber = '138-00-2010633-7';
            $defaultDirectorName = 'Indung Sukma';
            $defaultDirectorTitle = 'Director Finance';
            $defaultCompanyName = 'PT SUKMA SETIAWAN INDONESIA';
        } else {
            $defaultBankAccountName = 'Yosua Eka Setiawan';
            $defaultBankName = 'BCA Cabang Singosaren Surakarta';
            $defaultBankShortName = 'BCA';
            $defaultBankAccountNumber = '1530509423';
            $defaultDirectorName = 'Yosua Eka S';
            $defaultDirectorTitle = 'Direktur';
            $defaultCompanyName = 'YOUSEE INDONESIA';
        }

        $bankAccountName = $request->filled('bankAccountName') ? $request->input('bankAccountName') : $defaultBankAccountName;
        $bankName = $request->filled('bankName') ? $request->input('bankName') : $defaultBankName;
        $bankShortName = $request->filled('bankShortName') ? $request->input('bankShortName') : $defaultBankShortName;
        $bankAccountNumber = $request->filled('bankAccountNumber') ? $request->input('bankAccountNumber') : $defaultBankAccountNumber;
        $directorName = $request->filled('directorName') ? $request->input('directorName') : $defaultDirectorName;
        $directorTitle = $request->filled('directorTitle') ? $request->input('directorTitle') : $defaultDirectorTitle;
        $companyName = $request->filled('companyName') ? $request->input('companyName') : $defaultCompanyName;

        $brandName = 'YOUSEE INDONESIA ADVERTISING AGENCY';
        $companyAddress = 'Jl Yos Sudarso No 19B - Tanjung Anom Kel Kwarasan, Kec Grogol, Kab Sukoharjo, Jawa Tengah 57522';
        $companyContact = 'Phone : +62 813 9370 0771 | Email : official@yousee-indonesia | web : www.yousee-indonesia.com';

        $logoPath = public_path('images/logo-yousee2.png');
        if (!file_exists($logoPath)) {
            $logoPath = public_path('images/yousee.png');
        }
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : null;

        $pdf = Pdf::loadView('pdf.kwitansi', [
            'receiptNumber' => $receiptNumber,
            'receivedFrom' => $receivedFrom,
            'amount' => $amount,
            'terbilang' => $terbilang,
            'forPaymentOf' => $forPaymentOf,
            'city' => $city,
            'dateFormatted' => $dateFormatted,
            'isPPN' => $isPPN,
            'bankAccountName' => $bankAccountName,
            'bankName' => $bankName,
            'bankShortName' => $bankShortName,
            'bankAccountNumber' => $bankAccountNumber,
            'directorName' => $directorName,
            'directorTitle' => $directorTitle,
            'companyName' => $companyName,
            'brandName' => $brandName,
            'companyAddress' => $companyAddress,
            'companyContact' => $companyContact,
            'logoBase64' => $logoBase64,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $safeReceiptNumber = str_replace(['/', '\\'], '_', $receiptNumber);
        $filename = "Kwitansi_{$safeReceiptNumber}.pdf";

        if ($request->input('stream', true)) {
            return $pdf->stream($filename);
        }

        return $pdf->download($filename);
    }
}
