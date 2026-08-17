<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_term_id')
                ->constrained('payment_terms')
                ->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('paid_at');
            $table->string('payment_method', 100);
            $table->string('payment_ref', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settlements');
    }
};
