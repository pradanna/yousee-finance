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
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
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

        // Monthly variation data (subtotal DPP) to make data look organic & realistic
        $monthlyProfiles = [
            5 => ['ppn_inv' => 45_000_000, 'ppn_po' => 18_000_000, 'np_inv' => 20_000_000, 'np_po' => 8_000_000],   // 5 months ago
            4 => ['ppn_inv' => 60_000_000, 'ppn_po' => 25_000_000, 'np_inv' => 30_000_000, 'np_po' => 12_000_000],  // 4 months ago
            3 => ['ppn_inv' => 85_000_000, 'ppn_po' => 35_000_000, 'np_inv' => 42_000_000, 'np_po' => 18_000_000],  // 3 months ago
            2 => ['ppn_inv' => 110_000_000, 'ppn_po' => 48_000_000, 'np_inv' => 55_000_000, 'np_po' => 22_000_000], // 2 months ago
            1 => ['ppn_inv' => 95_000_000, 'ppn_po' => 40_000_000, 'np_inv' => 48_000_000, 'np_po' => 19_000_000],  // 1 month ago (Juli)
            0 => ['ppn_inv' => 125_000_000, 'ppn_po' => 52_000_000, 'np_inv' => 65_000_000, 'np_po' => 26_000_000], // current month (Agustus)
        ];

        foreach ($monthlyProfiles as $offset => $prof) {
            $date = (clone $now)->subMonths($offset);
            $month = $date->month;
            $year = $date->year;

            // 1. PPN Projects & Transactions
            $clientPpn = $clients->random();
            $salesPpn = $salesList->random();
            $vendorPpn = $vendors->random();

            $projectPpn = Project::create([
                'code' => sprintf('PRJ-%d-PPN%02d', $year, $month * 10 + 1),
                'name' => sprintf('Campaign Media Billboard %s', $clientPpn->name),
                'client_id' => $clientPpn->id,
                'sales_id' => $salesPpn->id,
                'fiscal_mode' => FiscalMode::PPN,
                'start_date' => Carbon::createFromDate($year, $month, 5),
                'end_date' => Carbon::createFromDate($year, $month, 5)->addMonths(3),
                'contract_value' => (float) round($prof['ppn_inv'] * 1.11, 2),
                'target_qty' => 2,
                'status' => ProjectStatus::ACTIVE,
                'notes' => 'Sewa space media luar ruang PPN',
            ]);

            $invSubtotal = (float) $prof['ppn_inv'];
            $invPpnAmount = (float) round($invSubtotal * 0.11, 2);
            $invTotal = $invSubtotal + $invPpnAmount;

            $invPpn = Invoice::create([
                'invoice_number' => sprintf('INV-PPN-%d%02d-001', $year, $month),
                'client_id' => $clientPpn->id,
                'sales_id' => $salesPpn->id,
                'project_id' => $projectPpn->id,
                'fiscal_mode' => FiscalMode::PPN,
                'transaction_date' => Carbon::createFromDate($year, $month, 10),
                'due_date' => Carbon::createFromDate($year, $month, 25),
                'subtotal' => $invSubtotal,
                'ppn' => $invPpnAmount,
                'total' => $invTotal,
                'status' => $offset === 0 ? InvoiceStatus::ISSUED : InvoiceStatus::PAID,
                'notes' => 'Tagihan termin publikasi media billboard',
            ]);

            InvoiceItem::create([
                'invoice_id' => $invPpn->id,
                'name' => 'Sewa Spot Billboard Lokasi Strategis',
                'quantity' => 1,
                'price' => $invSubtotal,
            ]);

            $planPpn = PaymentPlan::create([
                'payable_type' => Invoice::class,
                'payable_id' => $invPpn->id,
                'scheme' => PaymentScheme::DP,
                'total_amount' => $invTotal,
            ]);

            PaymentTerm::create([
                'payment_plan_id' => $planPpn->id,
                'sort_order' => 1,
                'label' => 'DP 50%',
                'amount' => round($invTotal / 2, 2),
                'percent' => 50.0,
                'due_date' => Carbon::createFromDate($year, $month, 15),
                'status' => PaymentTermStatus::PAID,
            ]);

            PaymentTerm::create([
                'payment_plan_id' => $planPpn->id,
                'sort_order' => 2,
                'label' => 'Pelunasan 50%',
                'amount' => round($invTotal / 2, 2),
                'percent' => 50.0,
                'due_date' => Carbon::createFromDate($year, $month, 28),
                'status' => $offset === 0 ? PaymentTermStatus::UNPAID : PaymentTermStatus::PAID,
            ]);

            // Purchase Order PPN
            $poSubtotal = (float) $prof['ppn_po'];
            $poPpnAmount = (float) round($poSubtotal * 0.11, 2);
            $poTotal = $poSubtotal + $poPpnAmount;

            $poPpn = PurchaseOrder::create([
                'po_number' => sprintf('PO-PPN-%d%02d-001', $year, $month),
                'vendor_id' => $vendorPpn->id,
                'project_id' => $projectPpn->id,
                'fiscal_mode' => FiscalMode::PPN,
                'transaction_date' => Carbon::createFromDate($year, $month, 12),
                'subtotal' => $poSubtotal,
                'ppn' => $poPpnAmount,
                'total' => $poTotal,
                'status' => $offset === 0 ? PurchaseOrderStatus::ISSUED : PurchaseOrderStatus::PAID,
                'notes' => 'Konstruksi & Pasang Banner MMT',
            ]);

            PurchaseOrderItem::create([
                'purchase_order_id' => $poPpn->id,
                'name' => 'Jasa Konstruksi Rangka & Pemasangan Lampu',
                'quantity' => 1,
                'price' => $poSubtotal,
            ]);

            // 2. Non-PPN Projects & Transactions
            $clientNp = $clients->random();
            $salesNp = $salesList->random();
            $vendorNp = $vendors->random();

            $projectNp = Project::create([
                'code' => sprintf('PRJ-%d-NON%02d', $year, $month * 10 + 2),
                'name' => sprintf('Branding Outlet & Neonbox %s', $clientNp->name),
                'client_id' => $clientNp->id,
                'sales_id' => $salesNp->id,
                'fiscal_mode' => FiscalMode::NON_PPN,
                'start_date' => Carbon::createFromDate($year, $month, 3),
                'end_date' => Carbon::createFromDate($year, $month, 3)->addMonths(2),
                'contract_value' => (float) $prof['np_inv'],
                'target_qty' => 1,
                'status' => ProjectStatus::ACTIVE,
                'notes' => 'Proyek signage toko non-ppn',
            ]);

            $npInvTotal = (float) $prof['np_inv'];
            $invNp = Invoice::create([
                'invoice_number' => sprintf('INV-NP-%d%02d-001', $year, $month),
                'client_id' => $clientNp->id,
                'sales_id' => $salesNp->id,
                'project_id' => $projectNp->id,
                'fiscal_mode' => FiscalMode::NON_PPN,
                'transaction_date' => Carbon::createFromDate($year, $month, 8),
                'due_date' => Carbon::createFromDate($year, $month, 22),
                'subtotal' => $npInvTotal,
                'ppn' => 0,
                'total' => $npInvTotal,
                'status' => $offset === 0 ? InvoiceStatus::ISSUED : InvoiceStatus::PAID,
                'notes' => 'Pelunasan pekerjaan neonbox akrilik',
            ]);

            InvoiceItem::create([
                'invoice_id' => $invNp->id,
                'name' => 'Produksi Neonbox Custom Ukuran 2x1m',
                'quantity' => 1,
                'price' => $npInvTotal,
            ]);

            $npPoTotal = (float) $prof['np_po'];
            $poNp = PurchaseOrder::create([
                'po_number' => sprintf('PO-NP-%d%02d-001', $year, $month),
                'vendor_id' => $vendorNp->id,
                'project_id' => $projectNp->id,
                'fiscal_mode' => FiscalMode::NON_PPN,
                'transaction_date' => Carbon::createFromDate($year, $month, 14),
                'subtotal' => $npPoTotal,
                'ppn' => 0,
                'total' => $npPoTotal,
                'status' => $offset === 0 ? PurchaseOrderStatus::ISSUED : PurchaseOrderStatus::PAID,
                'notes' => 'Pembelian modul LED & Akrilik Sheet',
            ]);

            PurchaseOrderItem::create([
                'purchase_order_id' => $poNp->id,
                'name' => 'Bahan Akrilik 3mm & Power Supply 12V',
                'quantity' => 1,
                'price' => $npPoTotal,
            ]);
        }
    }
}
