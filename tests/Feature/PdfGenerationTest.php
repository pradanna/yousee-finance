<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PdfGenerationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_purchase_order_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/po-pdf?poNumber=PO-001/YS/09/26');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/po-pdf', [
            'vendorName' => 'CV. Taka Karya Abadi',
            'poNumber' => 'PO-001/YS/09/26',
            'isPPN' => true,
            'locations' => [
                [
                    'code' => 'LOC-01',
                    'city' => 'Semarang',
                    'size' => '4x8m',
                    'vendorCost' => 25000000,
                ],
            ],
        ]);
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));
    }

    public function test_client_invoice_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/client-invoice-pdf?invoiceNumber=INV-09/2026/001');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/client-invoice-pdf', [
            'clientName' => 'PT Klien Utama',
            'invoiceNumber' => 'INV-09/2026/001',
            'isPPN' => true,
            'subtotal' => 50000000,
            'locations' => [
                [
                    'type' => 'Billboard',
                    'size' => '4x8m',
                    'orientation' => 'V',
                    'area' => 'Semarang',
                    'clientPrice' => 50000000,
                ],
            ],
        ]);
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));

        // Test 5 Miliar inclusive deal with DPP 4.504.504.505
        $response5Miliar = $this->actingAs($this->user)->post('/client-invoice-pdf', [
            'clientName' => 'PT Paragon Technology and Innovation',
            'invoiceNumber' => 'INV-09/2026/002',
            'isPPN' => true,
            'subtotal' => 4504504505,
            'grandTotal' => 5000000000,
        ]);
        $response5Miliar->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response5Miliar->headers->get('content-type'));
    }

    public function test_kwitansi_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/kwitansi-pdf?receiptNumber=KW-09/2026/001');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/kwitansi-pdf', [
            'receiptNumber' => 'KW-09/2026/001',
            'receivedFrom' => 'PT Klien Utama',
            'amount' => 55500000,
            'forPaymentOf' => 'Pembayaran Sewa Billboard',
        ]);
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));
    }

    public function test_ppn_report_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/ppn-pdf?period=06-2026');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/ppn-pdf', [
            'period' => '06-2026',
            'periodLabel' => 'Masa Juni 2026',
        ]);
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));
    }

    public function test_cash_out_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/cash-out-pdf?month=9&year=2026');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/cash-out-pdf?month=9&year=2026');
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));
    }

    public function test_cashflow_pdf_generates_successfully_via_get_and_post(): void
    {
        // GET
        $responseGet = $this->actingAs($this->user)
            ->get('/cashflow-pdf?month=9&year=2026');
        $responseGet->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responseGet->headers->get('content-type'));

        // POST
        $responsePost = $this->actingAs($this->user)->post('/cashflow-pdf', [
            'month' => '9',
            'year' => '2026',
        ]);
        $responsePost->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $responsePost->headers->get('content-type'));
    }

    public function test_invoice_and_kwitansi_pdf_use_correct_bank_accounts_for_ppn_and_non_ppn(): void
    {
        // 1. Client Invoice PPN
        $resInvoicePpn = $this->actingAs($this->user)->post('/client-invoice-pdf', [
            'clientName' => 'PT Klien PPN',
            'invoiceNumber' => 'INV-SSI-09/2026/001',
            'isPPN' => true,
            'subtotal' => 10000000,
        ]);
        $resInvoicePpn->assertOk();

        // 2. Client Invoice Non-PPN
        $resInvoiceNonPpn = $this->actingAs($this->user)->post('/client-invoice-pdf', [
            'clientName' => 'Klien Personal',
            'invoiceNumber' => 'INV-09/2026/001',
            'isPPN' => false,
            'subtotal' => 10000000,
        ]);
        $resInvoiceNonPpn->assertOk();

        // 3. Kwitansi PPN
        $resKwitansiPpn = $this->actingAs($this->user)->post('/kwitansi-pdf', [
            'receiptNumber' => 'KW-INV-SSI-09/2026/001',
            'receivedFrom' => 'PT Klien PPN',
            'isPPN' => true,
            'amount' => 11100000,
        ]);
        $resKwitansiPpn->assertOk();

        // 4. Kwitansi Non-PPN
        $resKwitansiNonPpn = $this->actingAs($this->user)->post('/kwitansi-pdf', [
            'receiptNumber' => 'KW-INV-09/2026/001',
            'receivedFrom' => 'Klien Personal',
            'isPPN' => false,
            'amount' => 10000000,
        ]);
        $resKwitansiNonPpn->assertOk();

        // 5. Blade View Assertions for Bank Info
        $invoicePpnView = view('pdf.client_invoice', [
            'project' => [],
            'clientName' => 'PT Klien PPN',
            'clientAddress' => '-',
            'clientPhone' => '-',
            'clientSubName' => 'Attn: Finance',
            'invoiceNumber' => 'INV-SSI-001',
            'invoiceDate' => '25/09/2026',
            'dueDate' => '02/10/2026',
            'termLabel' => '',
            'contractTotalDpp' => 10000000,
            'contractTotalInvoice' => 11100000,
            'locations' => [],
            'isPPN' => true,
            'subtotal' => 10000000,
            'ppnAmount' => 1100000,
            'dpAmount' => 0,
            'grandTotal' => 11100000,
            'bankAccountName' => 'PT Sukma Setiawan Indonesia',
            'bankName' => 'Bank Mandiri',
            'bankAccountNumber' => '138-00-2010633-7',
            'bankBranch' => 'Cabang Solo Baru',
            'notes' => [],
            'directorName' => 'Yosua Eka S',
            'directorTitle' => 'Direktur',
        ])->render();

        $this->assertStringContainsString('PT Sukma Setiawan Indonesia', $invoicePpnView);
        $this->assertStringContainsString('138-00-2010633-7', $invoicePpnView);
        $this->assertStringContainsString('Bank Mandiri', $invoicePpnView);
        $this->assertStringContainsString('Cabang Solo Baru', $invoicePpnView);

        $kwitansiPpnView = view('pdf.kwitansi', [
            'receiptNumber' => 'KW-001',
            'receivedFrom' => 'PT Klien PPN',
            'amount' => 11100000,
            'terbilang' => 'SEBELAS JUTA SERATUS RIBU RUPIAH',
            'forPaymentOf' => 'Pembayaran Sewa Media',
            'city' => 'Sukoharjo',
            'dateFormatted' => '25 September 2026',
            'isPPN' => true,
            'bankAccountName' => 'PT Sukma Setiawan Indonesia',
            'bankName' => 'Bank Mandiri Cabang Solo Baru',
            'bankShortName' => 'Mandiri',
            'bankAccountNumber' => '138-00-2010633-7',
            'directorName' => 'Indung Sukma',
            'directorTitle' => 'Director Finance',
            'companyName' => 'PT SUKMA SETIAWAN INDONESIA',
            'brandName' => 'YOUSEE INDONESIA',
            'companyAddress' => 'Sukoharjo',
            'companyContact' => '-',
            'logoBase64' => null,
        ])->render();

        $this->assertStringContainsString('PT Sukma Setiawan Indonesia', $kwitansiPpnView);
        $this->assertStringContainsString('138-00-2010633-7', $kwitansiPpnView);
        $this->assertStringContainsString('Bank Mandiri Cabang Solo Baru', $kwitansiPpnView);
        $this->assertStringContainsString('Mandiri - 138-00-2010633-7', $kwitansiPpnView);
    }

    public function test_signature_is_added_if_name_is_josua_or_yosua(): void
    {
        // 1. Invoice with Yosua
        $invoiceWithYosua = view('pdf.client_invoice', [
            'project' => [],
            'clientName' => 'PT Klien',
            'clientAddress' => '-',
            'clientPhone' => '-',
            'clientSubName' => '',
            'invoiceNumber' => 'INV-001',
            'invoiceDate' => '25/09/2026',
            'dueDate' => '02/10/2026',
            'termLabel' => '',
            'contractTotalDpp' => 10000000,
            'contractTotalInvoice' => 10000000,
            'locations' => [],
            'isPPN' => false,
            'subtotal' => 10000000,
            'ppnAmount' => 0,
            'dpAmount' => 0,
            'grandTotal' => 10000000,
            'bankAccountName' => 'Yosua Eka Setiawan',
            'bankName' => 'BCA',
            'bankAccountNumber' => '1530509423',
            'bankBranch' => 'Cabang Solo Baru',
            'notes' => [],
            'directorName' => 'Yosua Eka S',
            'directorTitle' => 'Direktur',
        ])->render();
        $this->assertStringContainsString('ttd-yosua.png', $invoiceWithYosua);

        // 2. Invoice with other name
        $invoiceOther = view('pdf.client_invoice', [
            'project' => [],
            'clientName' => 'PT Klien',
            'clientAddress' => '-',
            'clientPhone' => '-',
            'clientSubName' => '',
            'invoiceNumber' => 'INV-001',
            'invoiceDate' => '25/09/2026',
            'dueDate' => '02/10/2026',
            'termLabel' => '',
            'contractTotalDpp' => 10000000,
            'contractTotalInvoice' => 10000000,
            'locations' => [],
            'isPPN' => false,
            'subtotal' => 10000000,
            'ppnAmount' => 0,
            'dpAmount' => 0,
            'grandTotal' => 10000000,
            'bankAccountName' => 'Yosua Eka Setiawan',
            'bankName' => 'BCA',
            'bankAccountNumber' => '1530509423',
            'bankBranch' => 'Cabang Solo Baru',
            'notes' => [],
            'directorName' => 'Budi Santoso',
            'directorTitle' => 'Direktur',
        ])->render();
        $this->assertStringNotContainsString('ttd-yosua.png', $invoiceOther);

        // 3. PO with Josua
        $poWithJosua = view('pdf.purchase_order', [
            'project' => [],
            'vendorName' => 'Vendor Test',
            'vendorAddress' => '-',
            'vendorPhone' => '-',
            'locations' => [],
            'isPPN' => false,
            'poNumber' => 'PO-001',
            'poDate' => '25/09/2026',
            'totalDPP' => 1000000,
            'totalPPN' => 0,
            'grandTotal' => 1000000,
            'lighting' => 'Berlampu',
            'topNotes' => 'Lunas',
            'qrCodeBase64' => '',
            'authorizedName' => 'Josua Eka Setiawan',
        ])->render();
        $this->assertStringContainsString('ttd-yosua.png', $poWithJosua);

        // 4. PO with other name
        $poOther = view('pdf.purchase_order', [
            'project' => [],
            'vendorName' => 'Vendor Test',
            'vendorAddress' => '-',
            'vendorPhone' => '-',
            'locations' => [],
            'isPPN' => false,
            'poNumber' => 'PO-001',
            'poDate' => '25/09/2026',
            'totalDPP' => 1000000,
            'totalPPN' => 0,
            'grandTotal' => 1000000,
            'lighting' => 'Berlampu',
            'topNotes' => 'Lunas',
            'qrCodeBase64' => '',
            'authorizedName' => 'Manajemen Keuangan',
        ])->render();
        $this->assertStringNotContainsString('ttd-yosua.png', $poOther);

        // 5. Kwitansi with Yosua
        $kwitansiYosua = view('pdf.kwitansi', [
            'receiptNumber' => 'KW-001',
            'receivedFrom' => 'PT Klien',
            'amount' => 10000000,
            'terbilang' => 'SEPULUH JUTA RUPIAH',
            'forPaymentOf' => 'Pembayaran Sewa Media',
            'city' => 'Sukoharjo',
            'dateFormatted' => '25 September 2026',
            'isPPN' => false,
            'bankAccountName' => 'Yosua Eka Setiawan',
            'bankName' => 'BCA',
            'bankShortName' => 'BCA',
            'bankAccountNumber' => '1530509423',
            'directorName' => 'Yosua Eka S',
            'directorTitle' => 'Direktur',
            'companyName' => 'YOUSEE INDONESIA',
            'brandName' => 'YOUSEE INDONESIA',
            'companyAddress' => 'Sukoharjo',
            'companyContact' => '-',
            'logoBase64' => null,
        ])->render();
        $this->assertStringContainsString('ttd-yosua.png', $kwitansiYosua);

        // 6. Kwitansi with Indung Sukma (no Josua signature)
        $kwitansiIndung = view('pdf.kwitansi', [
            'receiptNumber' => 'KW-001',
            'receivedFrom' => 'PT Klien',
            'amount' => 10000000,
            'terbilang' => 'SEPULUH JUTA RUPIAH',
            'forPaymentOf' => 'Pembayaran Sewa Media',
            'city' => 'Sukoharjo',
            'dateFormatted' => '25 September 2026',
            'isPPN' => true,
            'bankAccountName' => 'PT Sukma Setiawan Indonesia',
            'bankName' => 'Bank Mandiri',
            'bankShortName' => 'Mandiri',
            'bankAccountNumber' => '138-00-2010633-7',
            'directorName' => 'Indung Sukma',
            'directorTitle' => 'Director Finance',
            'companyName' => 'PT SUKMA SETIAWAN INDONESIA',
            'brandName' => 'YOUSEE INDONESIA',
            'companyAddress' => 'Sukoharjo',
            'companyContact' => '-',
            'logoBase64' => null,
        ])->render();
        $this->assertStringNotContainsString('ttd-yosua.png', $kwitansiIndung);
        $this->assertStringContainsString('ttd-sukma.png', $kwitansiIndung);

        // 7. Invoice with Sukma
        $invoiceWithSukma = view('pdf.client_invoice', [
            'project' => [],
            'clientName' => 'PT Klien',
            'clientAddress' => '-',
            'clientPhone' => '-',
            'clientSubName' => '',
            'invoiceNumber' => 'INV-001',
            'invoiceDate' => '25/09/2026',
            'dueDate' => '02/10/2026',
            'termLabel' => '',
            'contractTotalDpp' => 10000000,
            'contractTotalInvoice' => 10000000,
            'locations' => [],
            'isPPN' => true,
            'subtotal' => 10000000,
            'ppnAmount' => 1100000,
            'dpAmount' => 0,
            'grandTotal' => 11100000,
            'bankAccountName' => 'PT Sukma Setiawan Indonesia',
            'bankName' => 'Bank Mandiri',
            'bankAccountNumber' => '138-00-2010633-7',
            'bankBranch' => 'Cabang Solo Baru',
            'notes' => [],
            'directorName' => 'Indung Sukma',
            'directorTitle' => 'Director Finance',
        ])->render();
        $this->assertStringContainsString('ttd-sukma.png', $invoiceWithSukma);
        $this->assertStringNotContainsString('ttd-yosua.png', $invoiceWithSukma);

        // 8. PO with Sukma
        $poWithSukma = view('pdf.purchase_order', [
            'project' => [],
            'vendorName' => 'Vendor Test',
            'vendorAddress' => '-',
            'vendorPhone' => '-',
            'locations' => [],
            'isPPN' => false,
            'poNumber' => 'PO-001',
            'poDate' => '25/09/2026',
            'totalDPP' => 1000000,
            'totalPPN' => 0,
            'grandTotal' => 1000000,
            'lighting' => 'Berlampu',
            'topNotes' => 'Lunas',
            'qrCodeBase64' => '',
            'authorizedName' => 'Indung Sukma',
        ])->render();
        $this->assertStringContainsString('ttd-sukma.png', $poWithSukma);
        $this->assertStringNotContainsString('ttd-yosua.png', $poWithSukma);
    }
}
