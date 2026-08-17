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
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->foreignUuid('client_id')->constrained('clients');
            $table->foreignUuid('sales_id')->nullable()->constrained('sales');
            $table->string('fiscal_mode');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('contract_value', 15, 2);
            $table->unsignedSmallInteger('target_qty')->default(1);
            $table->string('status')->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['fiscal_mode', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
