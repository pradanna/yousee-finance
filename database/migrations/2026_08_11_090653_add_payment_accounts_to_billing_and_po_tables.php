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
        Schema::table('kwitansis', function (Blueprint $table) {
            $table->string('payment_account_code')->nullable()->after('amount');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->string('status')->default('draft')->after('total'); // draft, issued, paid
            $table->timestamp('paid_at')->nullable()->after('status');
            $table->string('payment_account_code')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['status', 'paid_at', 'payment_account_code']);
        });

        Schema::table('kwitansis', function (Blueprint $table) {
            $table->dropColumn('payment_account_code');
        });
    }
};
