<?php

namespace Database\Seeders;

use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name'  => 'Risa',
                'email' => 'admin1@yousee.com',
                'role'  => 'admin',
            ],
            [
                'name'  => 'Tia',
                'email' => 'admin2@yousee.com',
                'role'  => 'admin',
            ],
            [
                'name'  => 'Indung',
                'email' => 'pimpinan@yousee.com',
                'role'  => 'pimpinan',
            ],
        ];

        $createdUsers = [];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => Hash::make('password'),
                    'status'            => UserStatus::ACTIVE,
                    'email_verified_at' => now(),
                ]
            );

            $user->update([
                'name'              => $data['name'],
                'password'          => Hash::make('password'),
                'status'            => UserStatus::ACTIVE,
                'email_verified_at' => now(),
            ]);

            $user->syncRoles([$data['role']]);
            $createdUsers[$data['email']] = $user;
        }

        $admin1 = $createdUsers['admin1@yousee.com'];
        $officialEmails = array_column($users, 'email');

        // Cari semua user lain di database yang bukan user resmi ini
        $obsoleteUserIds = User::whereNotIn('email', $officialEmails)->pluck('id');

        if ($obsoleteUserIds->isNotEmpty()) {
            // Reassign foreign references ke admin1 agar tidak melanggar foreign key constraint
            $reassignments = [
                ['table' => 'cash_in_transactions', 'column' => 'created_by'],
                ['table' => 'cash_in_transactions', 'column' => 'voided_by'],
                ['table' => 'cash_transactions',    'column' => 'created_by'],
                ['table' => 'cash_transactions',    'column' => 'voided_by'],
                ['table' => 'journal_entries',      'column' => 'posted_by'],
                ['table' => 'closing_periods',      'column' => 'closed_by'],
                ['table' => 'audit_logs',           'column' => 'user_id'],
                ['table' => 'tax_settlements',      'column' => 'created_by'],
            ];

            foreach ($reassignments as $item) {
                if (Schema::hasTable($item['table']) && Schema::hasColumn($item['table'], $item['column'])) {
                    DB::table($item['table'])
                        ->whereIn($item['column'], $obsoleteUserIds)
                        ->update([$item['column'] => $admin1->id]);
                }
            }

            // Bersihkan relasi model_has_roles & model_has_permissions jika ada
            if (Schema::hasTable('model_has_roles')) {
                DB::table('model_has_roles')->whereIn('model_id', $obsoleteUserIds)->delete();
            }
            if (Schema::hasTable('model_has_permissions')) {
                DB::table('model_has_permissions')->whereIn('model_id', $obsoleteUserIds)->delete();
            }

            // Hapus semua user selain 3 user resmi
            User::whereIn('id', $obsoleteUserIds)->delete();
        }
    }
}
