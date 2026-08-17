<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\PaymentPlan;
use App\Domains\Billing\Models\PaymentTerm;
use App\Domains\Client\Models\Client;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Procurement\Models\PurchaseOrderItem;
use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ProjectTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clients = Client::all();
        $vendors = Vendor::all();
        $salesList = Sales::all();

        if ($clients->isEmpty() || $vendors->isEmpty() || $salesList->isEmpty()) {
            return;
        }

        $now = now();

        $projectTemplates = [
            [
                'name' => 'Kampanye Iklan Film Disney Toystory 5 - Jawa Tengah',
                'fiscal_mode' => FiscalMode::PPN,
                'target_qty' => 3,
                'status' => ProjectStatus::ACTIVE,
                'contract_value' => 280_000_000,
                'offset_months' => 0,
                'duration_months' => 3,
                'locations' => [
                    ['area' => 'Semarang', 'description' => 'Billboard Jl. Pandanaran KM 3', 'type' => LocationType::BILLBOARD, 'size' => '4x8m', 'cost' => 8_500_000, 'po' => true],
                    ['area' => 'Solo', 'description' => 'Videotron Jl. Slamet Riyadi Pusat', 'type' => LocationType::VIDEOTRON, 'size' => '3x5m', 'cost' => 22_000_000, 'po' => true],
                    ['area' => 'Yogyakarta', 'description' => 'Baliho Simpang Tugu Malioboro', 'type' => LocationType::BALIHO, 'size' => '5x10m', 'cost' => 15_000_000, 'po' => false],
                ],
                'invoice_status' => InvoiceStatus::ISSUED,
                'scheme' => PaymentScheme::TERMIN,
                'terms' => [
                    ['label' => 'Termin 1 – Uang Muka', 'percent' => 30, 'days' => 10, 'status' => PaymentTermStatus::PAID],
                    ['label' => 'Termin 2 – Progres', 'percent' => 40, 'days' => 35, 'status' => PaymentTermStatus::UNPAID],
                    ['label' => 'Termin 3 – Pelunasan', 'percent' => 30, 'days' => 60, 'status' => PaymentTermStatus::UNPAID],
                ],
            ],
            [
                'name' => 'Branding Shopee Mega Sale 9.9 - Simpang Lima',
                'fiscal_mode' => FiscalMode::PPN,
                'target_qty' => 2,
                'status' => ProjectStatus::ACTIVE,
                'contract_value' => 195_000_000,
                'offset_months' => 1,
                'duration_months' => 2,
                'locations' => [
                    ['area' => 'Semarang', 'description' => 'Videotron Kawasan Simpang Lima Utama', 'type' => LocationType::VIDEOTRON, 'size' => '6x12m', 'cost' => 35_000_000, 'po' => true],
                    ['area' => 'Semarang', 'description' => 'Billboard Jembatan Penyeberangan Pemuda', 'type' => LocationType::BILLBOARD, 'size' => '3x6m', 'cost' => 12_000_000, 'po' => true],
                ],
                'invoice_status' => InvoiceStatus::PAID,
                'scheme' => PaymentScheme::DP,
                'terms' => [
                    ['label' => 'Termin 1 – Uang Muka (DP)', 'percent' => 50, 'days' => 7, 'status' => PaymentTermStatus::PAID],
                    ['label' => 'Termin 2 – Pelunasan', 'percent' => 50, 'days' => 30, 'status' => PaymentTermStatus::PAID],
                ],
            ],
            [
                'name' => 'Signage Neonbox & Branding Soto Bangkong',
                'fiscal_mode' => FiscalMode::NON_PPN,
                'target_qty' => 2,
                'status' => ProjectStatus::ACTIVE,
                'contract_value' => 45_000_000,
                'offset_months' => 0,
                'duration_months' => 2,
                'locations' => [
                    ['area' => 'Semarang', 'description' => 'Neonbox Fasad Depan 3x1.5m', 'type' => LocationType::NEONBOX, 'size' => '3x1.5m', 'cost' => 9_000_000, 'po' => true],
                    ['area' => 'Semarang', 'description' => 'Pylon Sign Tiang Masuk Parkir', 'type' => LocationType::NEONBOX, 'size' => '1.2x4m', 'cost' => 14_000_000, 'po' => false],
                ],
                'invoice_status' => InvoiceStatus::ISSUED,
                'scheme' => PaymentScheme::FULL,
                'terms' => [
                    ['label' => 'Lunas Sekaligus', 'percent' => 100, 'days' => 14, 'status' => PaymentTermStatus::PAID],
                ],
            ],
            [
                'name' => 'Publikasi Promosi Wisata Kota Semarang',
                'fiscal_mode' => FiscalMode::PPN,
                'target_qty' => 4,
                'status' => ProjectStatus::COMPLETED,
                'contract_value' => 120_000_000,
                'offset_months' => 3,
                'duration_months' => 2,
                'locations' => [
                    ['area' => 'Semarang', 'description' => 'Billboard Exit Tol Banyumanik', 'type' => LocationType::BILLBOARD, 'size' => '4x8m', 'cost' => 10_000_000, 'po' => true],
                    ['area' => 'Semarang', 'description' => 'Billboard Bandara A. Yani Kedatangan', 'type' => LocationType::BILLBOARD, 'size' => '4x8m', 'cost' => 18_000_000, 'po' => true],
                ],
                'invoice_status' => InvoiceStatus::PAID,
                'scheme' => PaymentScheme::FULL,
                'terms' => [
                    ['label' => 'Lunas Sekaligus', 'percent' => 100, 'days' => 20, 'status' => PaymentTermStatus::PAID],
                ],
            ],
            [
                'name' => 'Instalasi Branding Flagship Store Samsung',
                'fiscal_mode' => FiscalMode::PPN,
                'target_qty' => 2,
                'status' => ProjectStatus::DRAFT,
                'contract_value' => 85_000_000,
                'offset_months' => 0,
                'duration_months' => 1,
                'locations' => [
                    ['area' => 'Solo', 'description' => 'Neonbox Logo Acrylic Mall Solo Paragon', 'type' => LocationType::NEONBOX, 'size' => '2x4m', 'cost' => 16_000_000, 'po' => false],
                ],
                'invoice_status' => InvoiceStatus::DRAFT,
                'scheme' => null,
                'terms' => [],
            ],
            [
                'name' => 'Pemasangan Baliho Event Budaya Pemkab Klaten',
                'fiscal_mode' => FiscalMode::NON_PPN,
                'target_qty' => 3,
                'status' => ProjectStatus::ACTIVE,
                'contract_value' => 35_000_000,
                'offset_months' => 1,
                'duration_months' => 1,
                'locations' => [
                    ['area' => 'Klaten', 'description' => 'Baliho Simpang Tiga Alun-Alun', 'type' => LocationType::BALIHO, 'size' => '4x6m', 'cost' => 6_500_000, 'po' => true],
                    ['area' => 'Klaten', 'description' => 'Baliho Perbatasan Jogja-Solo', 'type' => LocationType::BALIHO, 'size' => '4x6m', 'cost' => 7_000_000, 'po' => true],
                ],
                'invoice_status' => InvoiceStatus::PAID,
                'scheme' => PaymentScheme::FULL,
                'terms' => [
                    ['label' => 'Lunas Sekaligus', 'percent' => 100, 'days' => 14, 'status' => PaymentTermStatus::PAID],
                ],
            ],
        ];

        $globalPoSeq = 1;
        $globalInvSeq = 1;

        foreach ($projectTemplates as $idx => $tmpl) {
            $client = $clients[$idx % $clients->count()];
            $sales = $salesList[$idx % $salesList->count()];
            $startDate = (clone $now)->subMonths($tmpl['offset_months'])->startOfMonth()->addDays(5);
            $endDate = (clone $startDate)->addMonths($tmpl['duration_months']);
            $year = $startDate->year;
            $month = $startDate->month;
            $isPpn = $tmpl['fiscal_mode'] === FiscalMode::PPN;

            $codeTag = $isPpn ? 'PPN' : 'NON';
            $code = sprintf('PRJ-%d-%s%02d', $year, $codeTag, $idx + 1);

            $project = Project::create([
                'code' => $code,
                'name' => $tmpl['name'],
                'client_id' => $client->id,
                'sales_id' => $sales->id,
                'fiscal_mode' => $tmpl['fiscal_mode'],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'contract_value' => (float) $tmpl['contract_value'],
                'target_qty' => $tmpl['target_qty'],
                'status' => $tmpl['status'],
                'notes' => 'Proyek otomatis dari ProjectTransactionSeeder',
            ]);

            // 1. Locations & PO
            $poItemsByVendor = [];

            foreach ($tmpl['locations'] as $locIdx => $locTmpl) {
                $vendor = $vendors[($idx + $locIdx) % $vendors->count()];

                $location = ProjectLocation::create([
                    'project_id' => $project->id,
                    'vendor_id' => $vendor->id,
                    'code' => sprintf('LOC-%03d', $locIdx + 1),
                    'area' => $locTmpl['area'],
                    'description' => $locTmpl['description'],
                    'type' => $locTmpl['type'],
                    'size' => $locTmpl['size'],
                    'orientation' => LocationOrientation::VERTICAL,
                    'lighting' => LocationLighting::BERLAMPU,
                    'qty' => 1,
                    'vendor_cost' => (float) $locTmpl['cost'],
                    'top_notes' => 'Lunas setelah visual terpasang',
                ]);

                if ($locTmpl['po']) {
                    $vId = (string) $vendor->id;
                    if (! isset($poItemsByVendor[$vId])) {
                        $poItemsByVendor[$vId] = [
                            'vendor' => $vendor,
                            'locations' => [],
                        ];
                    }
                    $poItemsByVendor[$vId]['locations'][] = $location;
                }
            }

            // Create Purchase Orders for PO-issued locations
            foreach ($poItemsByVendor as $vGroup) {
                $vendor = $vGroup['vendor'];
                $vLocations = $vGroup['locations'];

                $tag = $isPpn ? 'PTSSI-PO' : 'YS-PO';
                $poNumber = sprintf('%03d/%s/%02d/%02d', $globalPoSeq++, $tag, $month, $year % 100);

                $po = PurchaseOrder::create([
                    'po_number' => $poNumber,
                    'vendor_id' => $vendor->id,
                    'project_id' => $project->id,
                    'fiscal_mode' => $project->fiscal_mode,
                    'transaction_date' => (clone $startDate)->addDays(7),
                    'issued_at' => (clone $startDate)->addDays(7),
                    'subtotal' => 0,
                    'ppn' => 0,
                    'total' => 0,
                    'status' => $tmpl['status'] === ProjectStatus::COMPLETED ? PurchaseOrderStatus::PAID : PurchaseOrderStatus::ISSUED,
                    'notes' => 'PO Produksi & Sewa Media Luar Ruang',
                ]);

                foreach ($vLocations as $vLoc) {
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $po->id,
                        'project_location_id' => $vLoc->id,
                        'name' => $vLoc->description,
                        'quantity' => $vLoc->qty,
                        'price' => $vLoc->vendor_cost,
                    ]);

                    $vLoc->update(['purchase_order_id' => $po->id]);
                }

                $po->recalculateTotal();
            }

            // 2. Invoice & Payment Plan
            if ($tmpl['invoice_status'] !== InvoiceStatus::DRAFT || ! empty($tmpl['scheme'])) {
                $invDpp = (float) $tmpl['contract_value'];
                $invPpn = $isPpn ? round($invDpp * 0.11, 2) : 0.0;
                $invTotal = $invDpp + $invPpn;

                $invNumber = $tmpl['invoice_status'] === InvoiceStatus::DRAFT
                    ? null
                    : sprintf('INV-%s-%d%02d-%03d', $codeTag, $year, $month, $globalInvSeq++);

                $invoice = Invoice::create([
                    'invoice_number' => $invNumber,
                    'client_id' => $client->id,
                    'sales_id' => $sales->id,
                    'project_id' => $project->id,
                    'fiscal_mode' => $project->fiscal_mode,
                    'transaction_date' => (clone $startDate)->addDays(5),
                    'due_date' => (clone $startDate)->addDays(25),
                    'subtotal' => $invDpp,
                    'ppn' => $invPpn,
                    'total' => $invTotal,
                    'status' => $tmpl['invoice_status'],
                    'notes' => 'Tagihan termin proyek media promosi',
                ]);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'name' => $project->name,
                    'quantity' => 1,
                    'price' => $invDpp,
                ]);

                if (! empty($tmpl['scheme']) && ! empty($tmpl['terms'])) {
                    $plan = PaymentPlan::create([
                        'payable_type' => Invoice::class,
                        'payable_id' => $invoice->id,
                        'scheme' => $tmpl['scheme'],
                        'total_amount' => $invTotal,
                        'notes' => 'Rencana pembayaran termin client',
                    ]);

                    $runningAmt = 0.0;
                    $termCount = count($tmpl['terms']);

                    foreach ($tmpl['terms'] as $tIdx => $tTmpl) {
                        $isLast = $tIdx === $termCount - 1;
                        $termAmt = $isLast
                            ? round($invTotal - $runningAmt, 2)
                            : round($invTotal * $tTmpl['percent'] / 100, 2);
                        $runningAmt += $termAmt;

                        PaymentTerm::create([
                            'payment_plan_id' => $plan->id,
                            'sort_order' => $tIdx + 1,
                            'label' => $tTmpl['label'],
                            'amount' => $termAmt,
                            'percent' => (float) $tTmpl['percent'],
                            'due_date' => (clone $startDate)->addDays($tTmpl['days']),
                            'status' => $tTmpl['status'],
                        ]);
                    }
                }
            }
        }
    }
}

