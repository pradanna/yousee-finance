<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_in_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_number', 50)->unique();
            $table->string('fiscal_mode', 20);
            $table->foreignUuid('deposit_account_id')
                ->constrained('chart_of_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('source_account_id')
                ->constrained('chart_of_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('transaction_date');
            $table->string('payer', 255)->nullable();
            $table->text('description');
            $table->string('attachment_path', 255)->nullable();
            $table->string('attachment_name', 255)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('voided_at')->nullable();
            $table->foreignUuid('voided_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('void_reason')->nullable();
            $table->foreignUuid('created_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamps();

            $table->index(['fiscal_mode', 'transaction_date']);
            $table->index(['status', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_in_transactions');
    }
};
