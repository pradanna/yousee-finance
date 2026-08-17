<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentPlan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class GeneratePaymentTerms
{
    /**
     * Buat (atau regenerate) skema pembayaran buat 1 dokumen (Invoice atau
     * PurchaseOrder — payable-nya polimorfik, satu Action buat client &
     * vendor). `$payable` wajib punya properti `total` (PPN-inclusive) yang
     * jadi basis nominal tiap termin.
     *
     * @param list<float> $percents  jumlahnya harus tepat 100
     * @param list<string> $dueDates format YYYY-MM-DD, sejajar sama $percents
     */
    public function execute(Model $payable, PaymentScheme $scheme, array $percents, array $dueDates, ?string $notes = null): PaymentPlan
    {
        if (count($percents) === 0 || count($percents) !== count($dueDates)) {
            throw new \DomainException('Jumlah persentase dan tanggal jatuh tempo termin harus sama dan tidak boleh kosong.');
        }

        $sum = round(array_sum($percents), 2);
        if ($sum !== 100.0) {
            throw new \DomainException("Total persentase termin harus tepat 100% (saat ini {$sum}%).");
        }

        return DB::transaction(function () use ($payable, $scheme, $percents, $dueDates, $notes) {
            $totalAmount = (float) $payable->total;

            $plan = PaymentPlan::updateOrCreate(
                ['payable_type' => $payable::class, 'payable_id' => $payable->id],
                ['scheme' => $scheme, 'total_amount' => $totalAmount, 'notes' => $notes],
            );

            // Regenerate bersih — "Ubah Skema" gantiin seluruh rincian termin.
            $plan->terms()->delete();

            $count = count($percents);
            $runningAmount = 0.0;

            foreach ($percents as $index => $percent) {
                $isLast = $index === $count - 1;
                $amount = $isLast
                    ? round($totalAmount - $runningAmount, 2)
                    : round($totalAmount * $percent / 100, 2);
                $runningAmount += $amount;

                $plan->terms()->create([
                    'sort_order' => $index + 1,
                    'label' => $this->labelFor($scheme, $index, $count),
                    'amount' => $amount,
                    'percent' => $percent,
                    'due_date' => $dueDates[$index],
                    'status' => PaymentTermStatus::UNPAID,
                ]);
            }

            return $plan->fresh('terms');
        });
    }

    private function labelFor(PaymentScheme $scheme, int $index, int $count): string
    {
        return match ($scheme) {
            PaymentScheme::FULL => 'Lunas Sekaligus',
            PaymentScheme::DP => $index === 0 ? 'Termin 1 – Uang Muka (DP)' : 'Termin 2 – Pelunasan',
            PaymentScheme::TERMIN => match (true) {
                $index === 0 => 'Termin 1 – Uang Muka',
                $index === $count - 1 => 'Termin ' . ($index + 1) . ' – Pelunasan',
                default => 'Termin ' . ($index + 1) . ' – Progres',
            },
            PaymentScheme::INSTALLMENT => 'Cicilan ' . ($index + 1) . ' dari ' . $count,
        };
    }
}
