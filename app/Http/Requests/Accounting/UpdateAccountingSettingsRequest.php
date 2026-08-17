<?php

declare(strict_types=1);

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings'                       => ['required', 'array'],
            'settings.*.key'                 => ['required', 'string'],
            'settings.*.chart_of_account_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
        ];
    }
}
