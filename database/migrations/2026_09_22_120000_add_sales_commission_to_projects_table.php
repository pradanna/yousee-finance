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
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'sales_commission')) {
                $table->decimal('sales_commission', 15, 2)->default(0)->after('contract_value');
            }
        });

        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'sales_commission')) {
                $table->dropColumn('sales_commission');
            }
        });

        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(2.00)->nullable(false)->change();
            }
        });
    }
};
