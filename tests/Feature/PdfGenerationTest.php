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
}
