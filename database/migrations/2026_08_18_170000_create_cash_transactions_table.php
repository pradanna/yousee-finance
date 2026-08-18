<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_number', 50)->unique();
            $table->string('fiscal_mode', 20);
            $table->foreignUuid('payment_account_id')
                ->constrained('chart_of_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('expense_account_id')
                ->constrained('chart_of_accounts')
                ->restrictOnDelete();
            $table->foreignUuid('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('transaction_date');
            $table->string('recipient', 255)->nullable();
            $table->text('description');
            $table->foreignUuid('created_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamps();

            $table->index(['fiscal_mode', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
