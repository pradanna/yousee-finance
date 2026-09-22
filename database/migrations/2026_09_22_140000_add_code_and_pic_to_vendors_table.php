<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('id');
            $table->string('pic', 255)->nullable()->after('name');
        });

        // Berikan kode berurutan untuk existing vendors yang belum memiliki kode
        $vendors = DB::table('vendors')->whereNull('code')->orderBy('created_at')->get();
        $counter = 1;
        foreach ($vendors as $v) {
            $code = sprintf('VND-%04d', $counter++);
            DB::table('vendors')->where('id', $v->id)->update(['code' => $code]);
        }

        Schema::table('vendors', function (Blueprint $table) {
            $table->string('code', 50)->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['code', 'pic']);
        });
    }
};
