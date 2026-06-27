<?php

namespace App\Domains\Shared\Traits;

use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait HasFiscalMode
{
    public static function bootHasFiscalMode(): void
    {
        static::saving(function (Model $model) {
            if (empty($model->fiscal_mode)) {
                throw new \InvalidArgumentException("fiscal_mode wajib diisi saat membuat transaksi.");
            }

            // Validasi format enum jika bertipe string
            if (is_string($model->fiscal_mode)) {
                $enum = FiscalMode::tryFrom($model->fiscal_mode);
                if (!$enum) {
                    throw new \InvalidArgumentException("fiscal_mode tidak valid.");
                }
            }
        });

        static::updating(function (Model $model) {
            if ($model->isDirty('fiscal_mode')) {
                throw new \DomainException("fiscal_mode bersifat fixed dan tidak bisa diubah setelah tersimpan.");
            }
        });
    }

    /**
     * Scope query to only include transactions of a given fiscal mode.
     */
    public function scopeForMode(Builder $query, FiscalMode|string $mode): Builder
    {
        $value = $mode instanceof FiscalMode ? $mode->value : $mode;
        return $query->where('fiscal_mode', $value);
    }
}
