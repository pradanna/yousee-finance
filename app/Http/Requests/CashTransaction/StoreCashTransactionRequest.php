<?php

declare(strict_types=1);

namespace App\Http\Requests\CashTransaction;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ExpenseCategory;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashTransactionRequest extends FormRequest
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
            'fiscal_mode'         => ['required', Rule::enum(FiscalMode::class)],
            'payment_account_id'  => ['required', 'string', 'exists:chart_of_accounts,id'],
            'expense_category_id' => ['nullable', 'string', 'exists:expense_categories,id'],
            'expense_account_id'  => ['nullable', 'string', 'exists:chart_of_accounts,id'],
            'project_id'          => ['nullable', 'string', 'exists:projects,id'],
            'amount'              => ['required', 'numeric', 'gt:0'],
            'transaction_date'    => ['required', 'date'],
            'recipient'           => ['nullable', 'string', 'max:255'],
            'description'         => ['required', 'string', 'max:1000'],
        ];
    }

    /**
     * Resolve expense_account_id if expense_category_id is provided
     */
    public function getExpenseAccountId(): string
    {
        if ($this->filled('expense_category_id')) {
            $category = ExpenseCategory::findOrFail($this->input('expense_category_id'));
            return $category->account_id;
        }

        return (string) $this->input('expense_account_id');
    }
}
