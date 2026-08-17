<?php

declare(strict_types=1);

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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('number', 50)->unique(); // JE-{YYYYMM}-{NNNN}
            $table->nullableUuidMorphs('source'); // source_type & source_id (Invoice, PurchaseOrder, PaymentSettlement, CashExpense)
            $table->foreignUuid('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();
            $table->string('fiscal_mode'); // ppn | non-ppn
            $table->date('transaction_date');
            $table->string('description', 255)->nullable();
            $table->boolean('is_reversal')->default(false);
            $table->foreignUuid('reverses_journal_id')
                ->nullable()
                ->constrained('journal_entries')
                ->nullOnDelete();
            $table->foreignUuid('posted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['fiscal_mode', 'transaction_date']);
        });

        Schema::create('journal_entry_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('journal_entry_id')
                ->constrained('journal_entries')
                ->cascadeOnDelete();
            $table->foreignUuid('account_id')
                ->constrained('chart_of_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->string('memo', 255)->nullable();
            $table->timestamps();

            $table->index('journal_entry_id');
            $table->index('account_id');
            $table->index('project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entry_items');
        Schema::dropIfExists('journal_entries');
    }
};
