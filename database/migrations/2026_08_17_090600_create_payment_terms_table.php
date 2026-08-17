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
        Schema::create('payment_terms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_plan_id')->constrained('payment_plans')->cascadeOnDelete();
            $table->unsignedTinyInteger('sort_order');
            $table->string('label');
            $table->decimal('amount', 15, 2);
            $table->decimal('percent', 5, 2);
            $table->date('due_date');
            $table->string('status')->default('unpaid');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['payment_plan_id', 'sort_order']);
            $table->index(['status', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_terms');
    }
};
