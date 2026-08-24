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
        Schema::create('tax_settlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->string('fiscal_mode', 20)->default('ppn');
            $table->string('ntpn', 16);
            $table->date('paid_date');
            $table->string('bank_name');
            $table->decimal('ppn_keluaran_total', 15, 2)->default(0);
            $table->decimal('ppn_masukan_total', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2)->default(0);
            $table->string('status', 50)->default('paid');
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['month', 'year', 'fiscal_mode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_settlements');
    }
};
