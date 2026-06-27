<?php

namespace Tests\Feature;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\PPhAdjustment;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Master\Models\Client;
use App\Domains\Master\Models\Project;
use App\Domains\Master\Models\Sales;
use App\Domains\Master\Models\Vendor;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_roles_and_active_status(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@yousee.com',
            'password' => bcrypt('password'),
            'role' => UserRole::ADMIN,
            'active' => true,
        ]);

        $pimpinan = User::create([
            'name' => 'Pimpinan User',
            'email' => 'pimpinan@yousee.com',
            'password' => bcrypt('password'),
            'role' => UserRole::PIMPINAN,
            'active' => true,
        ]);

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isPimpinan());
        $this->assertTrue($pimpinan->isPimpinan());
        $this->assertTrue($admin->isActive());
    }

    public function test_admin_self_elevation_restriction(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@yousee.com',
            'password' => bcrypt('password'),
            'role' => UserRole::ADMIN,
            'active' => true,
        ]);

        // Simulasikan login sebagai Admin
        $this->actingAs($admin);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage("Admin tidak bisa self-elevate menjadi Pimpinan.");

        $admin->role = UserRole::PIMPINAN;
        $admin->save();
    }

    public function test_vendor_npwp_validation_and_delete_protection(): void
    {
        // 1. Validasi Nama
        $this->expectException(\InvalidArgumentException::class);
        Vendor::create([
            'name' => '',
            'npwp' => '123456789012345',
        ]);

        // Reset Exception handler untuk tes berikutnya
        $this->expectException(\InvalidArgumentException::class);
        Vendor::create([
            'name' => 'Vendor A',
            'npwp' => '12345', // NPWP tidak valid (kurang dari 15 digit)
        ]);
    }

    public function test_vendor_valid_npwp_and_delete(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor Maju Jaya',
            'npwp' => '12.345.678.9-012.345',
        ]);

        $this->assertDatabaseHas('vendors', ['name' => 'Vendor Maju Jaya']);

        // Test delete protection
        $project = Project::create(['name' => 'Project A', 'status' => 'active']);
        $po = PurchaseOrder::create([
            'vendor_id' => $vendor->id,
            'project_id' => $project->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now(),
            'has_ppn' => true,
        ]);
        $po->items()->create(['name' => 'PO Item', 'quantity' => 1, 'price' => 1000000]);

        try {
            $vendor->delete();
            $this->fail("Vendor tidak boleh terhapus jika sudah punya transaksi PO.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("tidak bisa dihapus secara permanen", $e->getMessage());
        }
    }

    public function test_client_npwp_validation_and_delete_protection(): void
    {
        $client = Client::create([
            'name' => 'Client Sukses',
            'npwp' => '98.765.432.1-098.765',
        ]);

        $this->assertDatabaseHas('clients', ['name' => 'Client Sukses']);

        $sales = Sales::create(['name' => 'Sales 1', 'email' => 'sales@yousee.com']);
        $invoice = Invoice::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now(),
            'status' => 'draft',
        ]);
        $invoice->items()->create(['name' => 'Invoice Item', 'quantity' => 1, 'price' => 5000000]);

        try {
            $client->delete();
            $this->fail("Client tidak boleh terhapus jika sudah punya transaksi Invoice.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("tidak bisa dihapus secara permanen", $e->getMessage());
        }
    }

    public function test_sales_and_project_mode_dependent_aggregations(): void
    {
        $client = Client::create(['name' => 'Client A']);
        $sales = Sales::create(['name' => 'Sales Bintang', 'email' => 'sales2@yousee.com']);
        $project = Project::create(['name' => 'Project Tower', 'status' => 'active']);

        // 1. Invoice PPN
        $invoice1 = Invoice::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'project_id' => $project->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now(),
            'status' => 'draft',
        ]);
        $invoice1->items()->create(['name' => 'Item 1', 'quantity' => 1, 'price' => 1000000]);
        $invoice1->status = 'issued';
        $invoice1->save();

        // 2. Invoice Non-PPN
        $invoice2 = Invoice::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'project_id' => $project->id,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'transaction_date' => now(),
            'status' => 'draft',
        ]);
        $invoice2->items()->create(['name' => 'Item 2', 'quantity' => 1, 'price' => 2000000]);
        $invoice2->status = 'issued';
        $invoice2->save();

        // Performa sales dihitung terpisah per mode
        $this->assertEquals(1110000, $sales->calculatePerformance(FiscalMode::PPN));
        $this->assertEquals(2000000, $sales->calculatePerformance(FiscalMode::NON_PPN));

        // P&L Project dihitung terpisah per mode
        $this->assertEquals(1110000, $project->calculateProfitLoss(FiscalMode::PPN));
        $this->assertEquals(2000000, $project->calculateProfitLoss(FiscalMode::NON_PPN));
    }

    public function test_purchase_order_mode_and_closed_period_restrictions(): void
    {
        $vendor = Vendor::create(['name' => 'Vendor S']);
        $project = Project::create(['name' => 'Project A']);

        // 1. Tutup periode akuntansi PPN untuk bulan Juni 2026
        ClosingPeriod::create([
            'month' => 6,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::PPN->value,
            'is_closed' => true,
        ]);

        // 2. Buat PO di periode yang ditutup (Mode PPN) -> Harus gagal
        try {
            $poPpn = PurchaseOrder::create([
                'vendor_id' => $vendor->id,
                'project_id' => $project->id,
                'fiscal_mode' => FiscalMode::PPN,
                'transaction_date' => '2026-06-15',
                'has_ppn' => false,
            ]);
            $poPpn->items()->create(['name' => 'Item', 'quantity' => 1, 'price' => 500000]);
            $this->fail("PO tidak boleh disimpan di periode yang sudah closing.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("sudah ditutup", $e->getMessage());
        }

        // 3. Buat PO di periode yang sama tetapi Mode Non-PPN (belum ditutup) -> Harus sukses
        $poNonPpn = PurchaseOrder::create([
            'vendor_id' => $vendor->id,
            'project_id' => $project->id,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'transaction_date' => '2026-06-15',
            'has_ppn' => false,
        ]);
        $poNonPpn->items()->create(['name' => 'Item', 'quantity' => 1, 'price' => 500000]);

        $this->assertDatabaseHas('purchase_orders', ['id' => $poNonPpn->id]);
    }

    public function test_invoice_status_flow_and_ppn_mode_restrictions(): void
    {
        $client = Client::create(['name' => 'Client X']);

        // 1. draft -> paid secara langsung (tanpa issued) -> Harus gagal
        $invoice = Invoice::create([
            'client_id' => $client->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now(),
            'status' => 'draft',
        ]);
        $invoice->items()->create(['name' => 'Item', 'quantity' => 1, 'price' => 1000000]);

        try {
            $invoice->status = 'paid';
            $invoice->save();
            $this->fail("Invoice tidak boleh langsung berstatus paid dari draft.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("harus melalui 'issued'", $e->getMessage());
        }

        // 2. Transisi yang benar: draft -> issued -> paid
        $invoice->status = 'issued';
        $invoice->save();
        $this->assertEquals('issued', $invoice->status);

        $invoice->status = 'paid';
        $invoice->save();
        $this->assertEquals('paid', $invoice->status);

        // 3. Status paid tidak bisa diubah kembali
        try {
            $invoice->status = 'draft';
            $invoice->save();
            $this->fail("Status invoice paid tidak bisa diganti.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("tidak bisa diubah kembali", $e->getMessage());
        }
    }

    public function test_automatic_journal_entry_posting_and_kwitansi(): void
    {
        $client = Client::create(['name' => 'Client Kwitansi']);
        $sales = Sales::create(['name' => 'Sales K', 'email' => 'salesk@yousee.com']);

        // 1. Buat Invoice Draft (Belum posting jurnal)
        $invoice = Invoice::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now(),
            'status' => 'draft',
        ]);
        $invoice->items()->create(['name' => 'Item', 'quantity' => 1, 'price' => 10000000]);

        $this->assertDatabaseMissing('journal_entries', [
            'source_type' => Invoice::class,
            'source_id' => $invoice->id,
        ]);

        // 2. Terbitkan Invoice (status -> issued) -> Terbit Jurnal Piutang
        $invoice->status = 'issued';
        $invoice->save();

        $this->assertDatabaseHas('journal_entries', [
            'source_type' => Invoice::class,
            'source_id' => $invoice->id,
            'description' => "Jurnal Piutang Invoice #{$invoice->id} - Client: Client Kwitansi",
        ]);

        $journalIssued = JournalEntry::where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->first();

        // Validasi invariant total debet = total kredit
        $this->assertTrue($journalIssued->isBalanced());

        // 3. Bayar Invoice (status -> paid) -> Terbit Kwitansi & Jurnal Pelunasan
        $invoice->status = 'paid';
        $invoice->save();

        $this->assertDatabaseHas('kwitansis', [
            'invoice_id' => $invoice->id,
            'amount' => 11100000.00,
        ]);

        $journalPaid = JournalEntry::where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->where('description', 'like', 'Jurnal Pelunasan%')
            ->first();

        $this->assertNotNull($journalPaid);
        $this->assertTrue($journalPaid->isBalanced());
    }

    public function test_closing_period_sequence_and_unlock(): void
    {
        $pimpinan = User::create([
            'name' => 'Boss',
            'email' => 'boss@yousee.com',
            'password' => bcrypt('password'),
            'role' => UserRole::PIMPINAN,
            'active' => true,
        ]);

        // 1. Buat penutupan periode bulan Januari 2026
        $periodJan = ClosingPeriod::create([
            'month' => 1,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::PPN->value,
            'is_closed' => true,
        ]);

        // 2. Coba tutup periode bulan Maret 2026 langsung (Januari closed, tetapi Februari belum) -> Harus gagal karena melompati Februari
        try {
            ClosingPeriod::create([
                'month' => 3,
                'year' => 2026,
                'fiscal_mode' => FiscalMode::PPN->value,
                'is_closed' => true,
            ]);
            $this->fail("Urutan closing salah tetapi berhasil disimpan.");
        } catch (\DomainException $e) {
            $this->assertStringContainsString("Urutan closing salah", $e->getMessage());
        }

        // 3. Tutup Februari terlebih dahulu -> Harus sukses
        $periodFeb = ClosingPeriod::create([
            'month' => 2,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::PPN->value,
            'is_closed' => true,
        ]);
        $this->assertDatabaseHas('closing_periods', ['month' => 2, 'year' => 2026, 'is_closed' => true]);

        // 4. Test unlock oleh Pimpinan
        $periodFeb->unlock($pimpinan, "Pembetulan data PPN");
        $this->assertFalse($periodFeb->is_closed);

        // Pastikan terbit audit log
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $pimpinan->id,
            'action' => 'UNLOCK_PERIOD',
        ]);
    }
}
