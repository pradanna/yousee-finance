<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Billing\Actions\GeneratePaymentTerms;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Models\PaymentPlan;
use App\Domains\Billing\Models\PaymentSettlement;
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

        // Resolving default COA mappings
        $receivableAccId = AccountingSetting::getAccountId('default_receivable');
        $salesRevAccId = AccountingSetting::getAccountId('default_sales_revenue');
        $vatOutputAccId = AccountingSetting::getAccountId('default_vat_output');
        $expenseAccId = AccountingSetting::getAccountId('default_project_expense');
        $payableAccId = AccountingSetting::getAccountId('default_payable');
        $vatInputAccId = AccountingSetting::getAccountId('default_vat_input');
        $bankAccId = AccountingSetting::getAccountId('default_bank');
        $cashAccId = AccountingSetting::getAccountId('default_cash');

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
        $postJournal = new PostJournalEntry();

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
                $poDate = (clone $startDate)->addDays(7);

                $po = PurchaseOrder::create([
                    'po_number' => $poNumber,
                    'vendor_id' => $vendor->id,
                    'project_id' => $project->id,
                    'fiscal_mode' => $project->fiscal_mode,
                    'transaction_date' => $poDate,
                    'issued_at' => $poDate,
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

                // Setup vendor payment plan & terms (Default full)
                $poPlan = PaymentPlan::create([
                    'payable_type' => PurchaseOrder::class,
                    'payable_id' => $po->id,
                    'scheme' => PaymentScheme::FULL,
                    'total_amount' => $po->total,
                    'notes' => 'Termin PO Vendor',
                ]);

                $isPoPaid = ($tmpl['status'] === ProjectStatus::COMPLETED || $idx % 2 === 1);
                $poTerm = PaymentTerm::create([
                    'payment_plan_id' => $poPlan->id,
                    'sort_order' => 1,
                    'label' => 'Pelunasan PO',
                    'amount' => $po->total,
                    'percent' => 100,
                    'due_date' => (clone $poDate)->addDays(14),
                    'status' => $isPoPaid ? PaymentTermStatus::PAID : PaymentTermStatus::UNPAID,
                ]);

                // Post PO Journal: (Dr) Beban Project + (Dr) PPN Masukan (if PPN) = (Cr) Hutang Vendor
                if ($expenseAccId && $payableAccId) {
                    $poJournalItems = [
                        [
                            'account_id' => $expenseAccId,
                            'debit'      => (float) $po->subtotal,
                            'credit'     => 0,
                            'project_id' => $project->id,
                            'memo'       => "HPP Billboard PO {$po->po_number} - {$vendor->name}",
                        ],
                    ];

                    if ((float) $po->ppn > 0 && $vatInputAccId) {
                        $poJournalItems[] = [
                            'account_id' => $vatInputAccId,
                            'debit'      => (float) $po->ppn,
                            'credit'     => 0,
                            'project_id' => $project->id,
                            'memo'       => "PPN Masukan PO {$po->po_number}",
                        ];
                    }

                    $poJournalItems[] = [
                        'account_id' => $payableAccId,
                        'debit'      => 0,
                        'credit'     => (float) $po->total,
                        'project_id' => $project->id,
                        'memo'       => "Hutang Vendor PO {$po->po_number} - {$vendor->name}",
                    ];

                    $postJournal->execute(
                        headerData: [
                            'fiscal_mode'      => $project->fiscal_mode,
                            'transaction_date' => $poDate->format('Y-m-d'),
                            'description'      => "Penerbitan PO {$po->po_number} untuk Vendor {$vendor->name} ({$project->name})",
                            'project_id'       => $project->id,
                        ],
                        items: $poJournalItems,
                        source: $po,
                    );
                }

                // If PO is marked paid, record Settlement & Journal
                if ($isPoPaid && $payableAccId && $bankAccId) {
                    $settleDate = (clone $poDate)->addDays(10);
                    $settlement = PaymentSettlement::create([
                        'payment_term_id' => $poTerm->id,
                        'amount'          => (float) $po->total,
                        'paid_at'         => $settleDate,
                        'payment_method'  => 'Transfer Bank BCA',
                        'payment_ref'     => "TRX-V-{$po->id}",
                        'notes'           => "Pelunasan PO {$po->po_number}",
                    ]);

                    $postJournal->execute(
                        headerData: [
                            'fiscal_mode'      => $project->fiscal_mode,
                            'transaction_date' => $settleDate->format('Y-m-d'),
                            'description'      => "Pelunasan Hutang PO {$po->po_number} - {$poTerm->label} ({$vendor->name})",
                            'project_id'       => $project->id,
                        ],
                        items: [
                            [
                                'account_id' => $payableAccId,
                                'debit'      => (float) $po->total,
                                'credit'     => 0,
                                'project_id' => $project->id,
                                'memo'       => "Pelunasan Hutang Vendor {$po->po_number}",
                            ],
                            [
                                'account_id' => $bankAccId,
                                'debit'      => 0,
                                'credit'     => (float) $po->total,
                                'project_id' => $project->id,
                                'memo'       => "Pengeluaran Bank BCA untuk PO {$po->po_number}",
                            ],
                        ],
                        source: $settlement,
                    );
                }
            }

            // 2. Invoice & Payment Plan
            if ($tmpl['invoice_status'] !== InvoiceStatus::DRAFT || ! empty($tmpl['scheme'])) {
                $invDpp = (float) $tmpl['contract_value'];
                $invPpn = $isPpn ? round($invDpp * 0.11, 2) : 0.0;
                $invTotal = $invDpp + $invPpn;

                $invNumber = $tmpl['invoice_status'] === InvoiceStatus::DRAFT
                    ? null
                    : sprintf('INV-%s-%d%02d-%03d', $codeTag, $year, $month, $globalInvSeq++);
                $invDate = (clone $startDate)->addDays(5);

                $invoice = Invoice::create([
                    'invoice_number' => $invNumber,
                    'client_id' => $client->id,
                    'sales_id' => $sales->id,
                    'project_id' => $project->id,
                    'fiscal_mode' => $project->fiscal_mode,
                    'transaction_date' => $invDate,
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

                // If invoice is issued/paid, Post Client Invoice Journal:
                // (Dr) Piutang Dagang Client = (Cr) Pendapatan Sewa + (Cr) PPN Keluaran
                if ($invoice->status !== InvoiceStatus::DRAFT && $receivableAccId && $salesRevAccId) {
                    $invJournalItems = [
                        [
                            'account_id' => $receivableAccId,
                            'debit'      => $invTotal,
                            'credit'     => 0,
                            'project_id' => $project->id,
                            'memo'       => "Piutang Invoice {$invoice->invoice_number} - {$client->name}",
                        ],
                        [
                            'account_id' => $salesRevAccId,
                            'debit'      => 0,
                            'credit'     => $invDpp,
                            'project_id' => $project->id,
                            'memo'       => "Pendapatan Proyek {$project->name} ({$invoice->invoice_number})",
                        ],
                    ];

                    if ($invPpn > 0 && $vatOutputAccId) {
                        $invJournalItems[] = [
                            'account_id' => $vatOutputAccId,
                            'debit'      => 0,
                            'credit'     => $invPpn,
                            'project_id' => $project->id,
                            'memo'       => "PPN Keluaran Invoice {$invoice->invoice_number}",
                        ];
                    }

                    $postJournal->execute(
                        headerData: [
                            'fiscal_mode'      => $project->fiscal_mode,
                            'transaction_date' => $invDate->format('Y-m-d'),
                            'description'      => "Penerbitan Invoice {$invoice->invoice_number} ke {$client->name} ({$project->name})",
                            'project_id'       => $project->id,
                        ],
                        items: $invJournalItems,
                        source: $invoice,
                    );
                }

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
                            ? round($invTotal - $runningAmt, 0)
                            : round($invTotal * $tTmpl['percent'] / 100, 0);
                        $runningAmt += $termAmt;
                        $termDueDate = (clone $startDate)->addDays($tTmpl['days']);

                        $term = PaymentTerm::create([
                            'payment_plan_id' => $plan->id,
                            'sort_order' => $tIdx + 1,
                            'label' => $tTmpl['label'],
                            'amount' => $termAmt,
                            'percent' => (float) $tTmpl['percent'],
                            'due_date' => $termDueDate,
                            'status' => $tTmpl['status'],
                        ]);

                        // If client term is PAID, record PaymentSettlement & Journal:
                        // (Dr) Bank BCA = (Cr) Piutang Dagang Client
                        if ($tTmpl['status'] === PaymentTermStatus::PAID && $receivableAccId && $bankAccId) {
                            $paidDate = (clone $termDueDate)->subDays(1);
                            $settlement = PaymentSettlement::create([
                                'payment_term_id' => $term->id,
                                'amount'          => $termAmt,
                                'paid_at'         => $paidDate,
                                'payment_method'  => 'Transfer Bank BCA',
                                'payment_ref'     => "TRX-INV-{$invoice->id}-{$tIdx}",
                                'notes'           => "Penerimaan {$term->label} dari {$client->name}",
                            ]);

                            $postJournal->execute(
                                headerData: [
                                    'fiscal_mode'      => $project->fiscal_mode,
                                    'transaction_date' => $paidDate->format('Y-m-d'),
                                    'description'      => "Penerimaan Pembayaran {$invoice->invoice_number} - {$term->label} ({$client->name})",
                                    'project_id'       => $project->id,
                                ],
                                items: [
                                    [
                                        'account_id' => $bankAccId,
                                        'debit'      => $termAmt,
                                        'credit'     => 0,
                                        'project_id' => $project->id,
                                        'memo'       => "Penerimaan Bank BCA untuk Invoice {$invoice->invoice_number}",
                                    ],
                                    [
                                        'account_id' => $receivableAccId,
                                        'debit'      => 0,
                                        'credit'     => $termAmt,
                                        'project_id' => $project->id,
                                        'memo'       => "Pelunasan Piutang {$invoice->invoice_number} - {$term->label}",
                                    ],
                                ],
                                source: $settlement,
                            );
                        }
                    }
                }
            }
        }
    }
}

