<?php

declare(strict_types=1);

namespace App\Http\Requests\CashTransaction;

use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashInTransactionRequest extends FormRequest
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
            'fiscal_mode'        => ['required', Rule::enum(FiscalMode::class)],
            'deposit_account_id' => ['required', 'string', 'exists:chart_of_accounts,id'],
            'source_account_id'  => ['required', 'string', 'exists:chart_of_accounts,id'],
            'project_id'         => ['nullable', 'string', 'exists:projects,id'],
            'amount'             => ['required', 'numeric', 'gt:0'],
            'transaction_date'   => ['required', 'date'],
            'payer'              => ['nullable', 'string', 'max:255'],
            'description'        => ['required', 'string', 'max:1000'],
            'attachment'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:20480'],
        ];
    }

    /**
     * Custom messages
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'deposit_account_id.required' => 'Rekening Kas / Bank penerima wajib dipilih.',
            'source_account_id.required'  => 'Akun sumber dana / kategori pemasukan wajib dipilih.',
            'amount.required'             => 'Nominal penerimaan kas wajib diisi.',
            'amount.gt'                   => 'Nominal penerimaan kas harus lebih besar dari 0.',
            'transaction_date.required'   => 'Tanggal transaksi wajib diisi.',
            'description.required'        => 'Keterangan penerimaan kas wajib diisi.',
        ];
    }
}
