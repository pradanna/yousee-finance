<?php

namespace App\Domains\Accounting\Models;

use Illuminate\Database\Eloquent\Model;

class CashExpense extends Model
{
    protected $table = 'cash_expenses';

    protected $fillable = [
        'payment_account_code',
        'expense_account_code',
        'amount',
        'transaction_date',
        'description',
        'fiscal_mode',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function journalEntries()
    {
        return $this->morphMany(JournalEntry::class, 'source');
    }

    protected static function booted()
    {
        static::saved(function (CashExpense $expense) {
            $expense->postJournalEntry();
        });
    }

    public function postJournalEntry(): void
    {
        // Hindari duplikasi jika sudah ada jurnal
        if ($this->journalEntries()->exists()) {
            return;
        }

        $journal = JournalEntry::create([
            'source_type' => self::class,
            'source_id' => $this->id,
            'fiscal_mode' => $this->fiscal_mode,
            'description' => "Pengeluaran Kas: " . ($this->description ?? '-'),
            'transaction_date' => $this->transaction_date,
        ]);

        // Mapping Expense Code to Account Name
        $expenseAccountName = 'Beban Lain-Lain';
        if ($this->expense_account_code === '5210') $expenseAccountName = 'Beban Operasional Listrik & Utilitas';
        elseif ($this->expense_account_code === '5220') $expenseAccountName = 'Beban Gaji & Honorarium Karyawan';
        elseif ($this->expense_account_code === '5230') $expenseAccountName = 'Beban Perlengkapan (ATK) & Fotocopy';
        elseif ($this->expense_account_code === '5240') $expenseAccountName = 'Beban Pemeliharaan & Perbaikan Gedung';
        elseif ($this->expense_account_code === '5250') $expenseAccountName = 'Beban Bensin, Tol & Parkir';
        elseif ($this->expense_account_code === '5260') $expenseAccountName = 'Beban Iklan & Promosi (Media Cetak/Online)';

        // Mapping Payment Code to Account Name
        $bankAccountName = 'Kas Tunai / Operasional';
        if ($this->payment_account_code === '1111') $bankAccountName = 'Bank Mandiri Solo Baru (138-00-2010633-7)';
        elseif ($this->payment_account_code === '1112') $bankAccountName = 'Bank BCA Operasional Utama';
        elseif ($this->payment_account_code === '1110') $bankAccountName = 'Kas Tunai / Operasional';

        // Debet Beban
        $journal->items()->create([
            'account_name' => $expenseAccountName,
            'debit' => $this->amount,
            'credit' => 0,
        ]);

        // Kredit Kas/Bank
        $journal->items()->create([
            'account_name' => $bankAccountName,
            'debit' => 0,
            'credit' => $this->amount,
        ]);
    }
}
