<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('procurement:sync-po-totals', function () {
    $pos = \App\Domains\Procurement\Models\PurchaseOrder::with(['items', 'paymentPlan.terms'])->get();
    $count = 0;
    foreach ($pos as $po) {
        $po->recalculateTotal();
        if ($po->paymentPlan) {
            $po->paymentPlan->total_amount = $po->total;
            $po->paymentPlan->saveQuietly();

            $terms = $po->paymentPlan->terms()->orderBy('sort_order')->get();
            $totalTerms = $terms->count();
            $sumTerms = 0;
            foreach ($terms as $idx => $t) {
                if ($idx === $totalTerms - 1) {
                    $t->amount = round($po->total - $sumTerms);
                } else {
                    $t->amount = round($po->total * ((float) $t->percent / 100));
                    $sumTerms += $t->amount;
                }
                $t->saveQuietly();
            }
        }
        $count++;
    }
    $this->info("Berhasil sinkronisasi {$count} dokumen Purchase Order dan termin pembayaran.");
})->purpose('Sinkronisasi dan hitung ulang total Purchase Order dan termin agar bulat tanpa selisih pembulatan');

