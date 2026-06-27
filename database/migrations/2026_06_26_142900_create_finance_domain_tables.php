<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Modifikasi tabel users
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('admin');
            $table->boolean('active')->default(true);
        });

        // 2. Vendor
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('npwp')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Client
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('npwp')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Sales
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
        });

        // 5. Project
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('status')->default('active'); // active, finished
            $table->timestamps();
        });

        // 6. Purchase Order
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained();
            $table->foreignId('project_id')->nullable()->constrained();
            $table->string('fiscal_mode'); // ppn, non-ppn
            $table->date('transaction_date');
            $table->boolean('has_ppn')->default(false);
            $table->decimal('total', 15, 2)->default(0);
            $table->timestamps();
        });

        // 7. Purchase Order Item
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('quantity');
            $table->decimal('price', 15, 2);
            $table->timestamps();
        });

        // 8. Attachment
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->timestamps();
        });

        // 9. Invoice
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained();
            $table->foreignId('sales_id')->nullable()->constrained();
            $table->foreignId('project_id')->nullable()->constrained();
            $table->string('fiscal_mode'); // ppn, non-ppn
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('ppn', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status')->default('draft'); // draft, issued, paid
            $table->timestamps();
        });

        // 10. Invoice Item
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('quantity');
            $table->decimal('price', 15, 2);
            $table->timestamps();
        });

        // 11. Kwitansi
        Schema::create('kwitansis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('receipt_number')->unique();
            $table->decimal('amount', 15, 2);
            $table->timestamp('paid_at');
            $table->timestamps();
        });

        // 12. Journal Entry
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('source');
            $table->string('fiscal_mode'); // ppn, non-ppn
            $table->string('description')->nullable();
            $table->date('transaction_date');
            $table->timestamps();
        });

        // 13. Journal Entry Item
        Schema::create('journal_entry_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $table->string('account_name');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->timestamps();
        });

        // 14. PPh Adjustment
        Schema::create('pph_adjustments', function (Blueprint $table) {
            $table->id();
            $table->morphs('source'); // PO atau Invoice
            $table->decimal('amount', 15, 2);
            $table->decimal('rate', 5, 4)->default(0); // e.g. 0.02
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 15. Closing Period
        Schema::create('closing_periods', function (Blueprint $table) {
            $table->id();
            $table->integer('month');
            $table->integer('year');
            $table->string('fiscal_mode'); // ppn, non-ppn
            $table->boolean('is_closed')->default(false);
            $table->unique(['month', 'year', 'fiscal_mode']);
            $table->timestamps();
        });

        // 16. Audit Log
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('action');
            $table->text('details');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('closing_periods');
        Schema::dropIfExists('pph_adjustments');
        Schema::dropIfExists('journal_entry_items');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('kwitansis');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('vendors');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'active']);
        });
    }
};
