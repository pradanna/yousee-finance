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
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number', 50)->nullable()->unique();
            $table->foreignUuid('client_id')->constrained('clients');
            $table->foreignUuid('project_id')->nullable()->constrained('projects');
            $table->foreignUuid('sales_id')->nullable()->constrained('sales');
            // revenue_account_id will get its FK constraint once chart_of_accounts (Accounting domain) lands.
            $table->uuid('revenue_account_id')->nullable();
            $table->string('fiscal_mode');
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('ppn', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['fiscal_mode', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
