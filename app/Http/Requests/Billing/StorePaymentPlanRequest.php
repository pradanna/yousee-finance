<?php

declare(strict_types=1);

namespace App\Http\Requests\Billing;

use App\Domains\Billing\Enums\PaymentScheme;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scheme' => ['required', Rule::enum(PaymentScheme::class)],
            'percents' => ['required', 'array', 'min:1'],
            'percents.*' => ['numeric', 'min:0', 'max:100'],
            'due_dates' => ['required', 'array', 'min:1'],
            'due_dates.*' => ['date'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $percents = $this->input('percents', []);
            $dueDates = $this->input('due_dates', []);

            if (count($percents) !== count($dueDates)) {
                $validator->errors()->add('due_dates', 'Jumlah tanggal jatuh tempo harus sama dengan jumlah termin.');

                return;
            }

            $sum = round(array_sum($percents), 2);
            if ($sum !== 100.0) {
                $validator->errors()->add('percents', "Total persentase termin harus tepat 100% (saat ini {$sum}%).");
            }
        });
    }
}
