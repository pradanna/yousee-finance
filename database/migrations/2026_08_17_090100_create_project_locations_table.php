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
        Schema::create('project_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignUuid('vendor_id')->nullable()->constrained('vendors');
            $table->foreignUuid('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->string('code', 50);
            $table->string('area');
            $table->string('description');
            $table->string('type');
            $table->string('size', 50);
            $table->string('orientation', 10)->nullable();
            $table->string('lighting', 50)->nullable();
            $table->unsignedSmallInteger('qty')->default(1);
            $table->decimal('vendor_cost', 15, 2);
            $table->string('top_notes')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'code']);
            $table->index(['project_id', 'vendor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_locations');
    }
};
