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
        $bankAccountName = $request->input('bankAccountName', 'PT Sukma Setiawan Indonesia');
        $bankName = $request->input('bankName', 'Bank Mandiri Cabang Solo Baru');
        $bankAccountNumber = $request->input('bankAccountNumber', '138 00 2010633 7');
        $directorName = $request->input('directorName', 'Indung Sukma');
        $directorTitle = $request->input('directorTitle', 'Director Finance');

        $companyName = 'PT SUKMA SETIAWAN INDONESIA';
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
            'bankAccountName' => $bankAccountName,
            'bankName' => $bankName,
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
