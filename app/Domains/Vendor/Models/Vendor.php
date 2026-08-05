<?php

namespace App\Domains\Vendor\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    protected static function newFactory()
    {
        return \Database\Factories\VendorFactory::new();
    }

    protected $fillable = [
        'name',
        'npwp',
        'is_archived',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    /**
     * Scope a query to only include active vendors.
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_archived', false);
    }
}
