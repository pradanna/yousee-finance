<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Vendor\Models\Vendor;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PurchaseOrderPdfController extends Controller
{
    public function generatePdf(Request $request)
    {
        $poNumber = $request->input('poNumber');
        $po = null;

        if ($poNumber) {
            try {
                $po = PurchaseOrder::with(['vendor', 'project.client', 'items.projectLocation', 'paymentPlan.terms'])
                    ->where('po_number', $poNumber)
                    ->first();
            } catch (\Throwable $e) {
                $po = null;
            }
        }

        $project = $request->input('project', []);
        if ($po && empty($project)) {
            $project = [
                'name'   => $po->project?->name ?? '',
                'code'   => $po->project?->code ?? '',
                'period' => $po->project?->period ?? '',
            ];
        }

        $vendorName = $request->input('vendorName');
        $vendorAddress = $request->input('vendorAddress');
        $vendorPhone = $request->input('vendorPhone');

        if ($po && $po->vendor) {
            $vendorName = $vendorName ?: $po->vendor->name;
            $vendorAddress = $vendorAddress ?: ($po->vendor->address ?? '-');
            $vendorPhone = $vendorPhone ?: ($po->vendor->phone ?? '-');
        } else if ($vendorName) {
            try {
                $vendorObj = Vendor::where('name', $vendorName)->first();
                if ($vendorObj) {
                    $vendorAddress = $vendorAddress ?: ($vendorObj->address ?? '-');
                    $vendorPhone = $vendorPhone ?: ($vendorObj->phone ?? '-');
                }
            } catch (\Throwable $e) {
                // Ignore DB error if running statelessly
            }
        }

        $vendorName = $vendorName ?: 'Vendor Rekanan';
        $vendorAddress = $vendorAddress ?: '-';
        $vendorPhone = $vendorPhone ?: '-';

        $locations = $request->input('locations', []);
        if ($po && $po->items->isNotEmpty() && ($po->items->count() > count($locations) || empty($locations))) {
            $locations = $po->items->map(function ($item) {
                return [
                    'id'          => $item->id,
                    'description' => $item->name ?: ($item->projectLocation?->description ?? '-'),
                    'size'        => $item->projectLocation?->size ?? '4x6',
                    'orientation' => $item->projectLocation?->orientation ?? 'V',
                    'vendorCost'  => (float) $item->price * (int) $item->quantity,
                    'lighting'    => $item->projectLocation?->lighting ?? 'Berlampu',
                ];
            })->toArray();
        }

        $isPPN = $request->has('isPPN') 
            ? filter_var($request->input('isPPN', false), FILTER_VALIDATE_BOOLEAN)
            : ($po ? $po->fiscal_mode->value === 'ppn' : false);

        $poDate = $request->input('poDate', $po?->issued_at?->format('d/m/Y') ?? date('d/m/Y'));
        $poNumber = $poNumber ?: ($po?->po_number ?? '001/YS-PO/' . date('m/y'));

        $totalDPP = 0;
        foreach ($locations as $item) {
            $totalDPP += (float) ($item['vendorCost'] ?? 0);
        }

        if ($isPPN) {
            if ($request->filled('grandTotal')) {
                $grandTotal = (float) $request->input('grandTotal');
                if ($request->filled('totalDPP')) {
                    $totalDPP = (float) $request->input('totalDPP');
                }
                $totalPPN = max(0, round($grandTotal - $totalDPP));
            } elseif ($po && (float) $po->total > 0) {
                $calculatedTarget = 0;
                foreach ($locations as $item) {
                    $cost = (float) ($item['vendorCost'] ?? 0);
                    $calculatedTarget += round($cost * 1.11);
                }
                if ($calculatedTarget > 0 && abs((float) $po->total - $calculatedTarget) == 1) {
                    $grandTotal = (float) $calculatedTarget;
                    try {
                        $po->recalculateTotal();
                    } catch (\Throwable $e) {
                        // Ignore DB write errors if running statelessly
                    }
                } else {
                    $grandTotal = (float) $po->total;
                }
                $totalDPP = (float) $po->subtotal ?: $totalDPP;
                $totalPPN = (float) $po->ppn ?: max(0, round($grandTotal - $totalDPP));
            } else {
                $grandTotal = 0;
                foreach ($locations as $item) {
                    $cost = (float) ($item['vendorCost'] ?? 0);
                    $grandTotal += round($cost * 1.11);
                }
                $totalPPN = max(0, round($grandTotal - $totalDPP));
            }
        } else {
            if ($po && (float) $po->total > 0) {
                $grandTotal = (float) $po->total;
                $totalDPP = (float) $po->subtotal ?: $grandTotal;
            } elseif ($request->filled('grandTotal')) {
                $grandTotal = (float) $request->input('grandTotal');
                $totalDPP = $request->filled('totalDPP') ? (float) $request->input('totalDPP') : $grandTotal;
            } else {
                $grandTotal = $totalDPP;
            }
            $totalPPN = 0.0;
        }

        $qrData = route('po.pdf') . '?poNumber=' . urlencode($poNumber);
        $qrCodeSvg = (string) \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->errorCorrection('M')->generate($qrData);
        $qrCodeBase64 = base64_encode($qrCodeSvg);

        $lighting = $request->input('locations.0.lighting', $request->input('lighting', 'Berlampu'));
        
        $topNotes = $request->input('locations.0.topNotes', $request->input('topNotes'));
        if (!$topNotes && $po && $po->paymentPlan) {
            $termsCount = $po->paymentPlan->terms->count();
            $scheme = $po->paymentPlan->scheme?->value ?? 'full';
            $topNotes = $po->paymentPlan->notes ?: ($scheme === 'full' ? 'Full Payment' : "Termin ({$termsCount} Tahap)");
        }
        $topNotes = $topNotes ?: 'Lunas setelah visual terpasang';
        $authorizedName = $request->input('authorizedName', $request->input('directorName', 'Yosua Eka S'));

        $pdf = Pdf::loadView('pdf.purchase_order', [
            'project'        => $project,
            'vendorName'     => $vendorName,
            'vendorAddress'  => $vendorAddress,
            'vendorPhone'    => $vendorPhone,
            'locations'      => $locations,
            'isPPN'          => $isPPN,
            'poNumber'       => $poNumber, 
            'poDate'         => $poDate,
            'totalDPP'       => $totalDPP,
            'totalPPN'       => $totalPPN,
            'grandTotal'     => $grandTotal,
            'lighting'       => $lighting,
            'topNotes'       => $topNotes,
            'qrCodeBase64'   => $qrCodeBase64,
            'authorizedName' => $authorizedName,
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
