<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Client\Models\Client;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ClientInvoicePdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $invoiceNumber = $request->input('invoiceNumber');
        $invoice = null;

        if ($invoiceNumber) {
            $invoice = Invoice::with(['client', 'sales', 'project.locations', 'paymentPlan.terms'])
                ->where('invoice_number', $invoiceNumber)
                ->first();
        }

        $project = $request->input('project', []);
        if ($invoice && empty($project)) {
            $project = [
                'name'   => $invoice->project?->name ?? '',
                'code'   => $invoice->project?->code ?? '',
                'period' => $invoice->project?->period ?? '',
            ];
        }

        $clientName = $request->input('clientName');
        $clientAddress = $request->input('clientAddress');
        $clientPhone = $request->input('clientPhone');

        if ($invoice && $invoice->client) {
            $clientName = $clientName ?: $invoice->client->name;
            $clientAddress = $clientAddress ?: ($invoice->client->address ?? '-');
            $clientPhone = $clientPhone ?: ($invoice->client->phone ?? '-');
        } else if ($clientName) {
            $clientObj = Client::where('name', $clientName)->first();
            if ($clientObj) {
                $clientAddress = $clientAddress ?: ($clientObj->address ?? '-');
                $clientPhone = $clientPhone ?: ($clientObj->phone ?? '-');
            }
        }

        $clientName = $clientName ?: 'Klien Rekanan';
        $clientSubName = $request->input('clientSubName', 'Attn: Finance & Procurement');
        $invoiceDate = $request->input('invoiceDate', $invoice?->transaction_date?->format('d/m/Y') ?? date('d/m/Y'));
        $dueDate = $request->input('dueDate', $invoice?->due_date?->format('d/m/Y') ?? '');

        $locations = $request->input('locations', []);
        if (empty($locations) && $invoice && $invoice->project && $invoice->project->locations->isNotEmpty()) {
            $locations = $invoice->project->locations->map(function ($loc) {
                return [
                    'type'        => $loc->type ?: 'Sewa Media Iklan',
                    'size'        => $loc->size ?: '4x6m',
                    'orientation' => $loc->orientation ?: 'V',
                    'description' => $loc->description ?: '-',
                    'area'        => $loc->area ?: '-',
                    'qty'         => $loc->qty ?: 1,
                    'clientPrice' => (float) $loc->client_price,
                    'vendorCost'  => (float) $loc->vendor_cost,
                ];
            })->toArray();
        }

        if (empty($locations)) {
            $locations = [
                [
                    'type'        => 'Sewa Media Iklan',
                    'size'        => '4x6m',
                    'orientation' => 'V',
                    'description' => 'Penempatan Media Reklame',
                    'area'        => 'Indonesia',
                    'qty'         => 1,
                    'clientPrice' => (float) ($invoice?->subtotal ?? 0),
                    'vendorCost'  => (float) ($invoice?->subtotal ?? 0),
                ]
            ];
        }

        $isPPN = $request->has('isPPN')
            ? filter_var($request->input('isPPN', false), FILTER_VALIDATE_BOOLEAN)
            : ($invoice ? $invoice->fiscal_mode->value === 'ppn' : false);

        $dpAmount = (float) $request->input('dpAmount', 0);
        $bankAccountName = $request->input('bankAccountName', 'Yosua Eka Setiawan');
        $bankName = $request->input('bankName', 'BCA');
        $bankAccountNumber = $request->input('bankAccountNumber', '1530509423');
        $bankBranch = $request->input('bankBranch', 'BCA Cabang Singosaren Surakarta');
        $notes = $request->input('notes', [
            'Perawatan Selama Kontrak (Visual sobek, kerusakan media, dsb)',
            'Free cetak & pasang visual 1 kali',
            'Berlampu',
            'Durasi Tayang Baliho Sesuai Periode Kontrak',
        ]);
        $directorName = $request->input('directorName', 'Yosua Eka S');
        $directorTitle = $request->input('directorTitle', 'Direktur');

        $termLabel = $request->input('termLabel', '');
        $contractTotalDpp = (float) $request->input('contractTotalDpp', $invoice?->subtotal ?? 0);
        $contractTotalInvoice = (float) $request->input('contractTotalInvoice', $invoice?->total ?? 0);

        if ($request->filled('subtotal')) {
            $subtotal = (float) $request->input('subtotal');
        } else {
            $subtotal = 0;
            foreach ($locations as $item) {
                $subtotal += (float) ($item['clientPrice'] ?? $item['vendorCost'] ?? 0);
            }
        }

        $ppnAmount = $isPPN ? round($subtotal * 0.11, 2) : 0.0;
        $totalBeforeDp = round($subtotal + $ppnAmount, 2);
        $grandTotal = max(0, round($totalBeforeDp - $dpAmount, 2));
        $invoiceNumber = $invoiceNumber ?: ($invoice?->invoice_number ?? 'INV-' . date('m/y') . '/001');

        $pdf = Pdf::loadView('pdf.client_invoice', [
            'project'              => $project,
            'clientName'           => $clientName,
            'clientAddress'        => $clientAddress,
            'clientPhone'          => $clientPhone,
            'clientSubName'        => $clientSubName,
            'invoiceNumber'        => $invoiceNumber,
            'invoiceDate'          => $invoiceDate,
            'dueDate'              => $dueDate,
            'termLabel'            => $termLabel,
            'contractTotalDpp'     => $contractTotalDpp,
            'contractTotalInvoice' => $contractTotalInvoice,
            'locations'            => $locations,
            'isPPN'                => $isPPN,
            'subtotal'             => $subtotal,
            'ppnAmount'            => $ppnAmount,
            'dpAmount'             => $dpAmount,
            'grandTotal'           => $grandTotal,
            'bankAccountName'      => $bankAccountName,
            'bankName'             => $bankName,
            'bankAccountNumber'    => $bankAccountNumber,
            'bankBranch'           => $bankBranch,
            'notes'                => $notes,
            'directorName'         => $directorName,
            'directorTitle'        => $directorTitle,
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
