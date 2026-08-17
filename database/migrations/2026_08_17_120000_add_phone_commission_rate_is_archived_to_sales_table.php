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
        Schema::table('sales', function (Blueprint $table) {
            if (! Schema::hasColumn('sales', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('sales', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(2.00)->after('phone');
            }
            if (! Schema::hasColumn('sales', 'is_archived')) {
                $table->boolean('is_archived')->default(false)->after('commission_rate');
            }
            if (! Schema::hasColumn('sales', 'deleted_at')) {
                $table->softDeletes()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['phone', 'commission_rate', 'is_archived']);
        });
    }
};
