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
        Schema::create('closing_periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedTinyInteger('month'); // 1..12
            $table->unsignedSmallInteger('year');
            $table->string('fiscal_mode'); // ppn | non-ppn
            $table->boolean('is_closed')->default(false);
            $table->timestamp('closed_at')->nullable();
            $table->foreignUuid('closed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['month', 'year', 'fiscal_mode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('closing_periods');
    }
};
