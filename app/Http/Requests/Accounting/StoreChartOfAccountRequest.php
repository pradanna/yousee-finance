<?php

declare(strict_types=1);

namespace App\Http\Requests\Accounting;

use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreChartOfAccountRequest extends FormRequest
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
            'parent_id'      => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'code'           => ['required', 'string', 'max:20', 'unique:chart_of_accounts,code'],
            'name'           => ['required', 'string', 'max:255'],
            'type'           => ['required', new Enum(AccountType::class)],
            'normal_balance' => ['required', new Enum(NormalBalance::class)],
            'description'    => ['nullable', 'string'],
        ];
    }
}
