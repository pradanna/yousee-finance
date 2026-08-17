<?php

namespace Database\Seeders;

use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Super Admin', 'email' => 'admin@yousee.test', 'role' => 'admin'],
            ['name' => 'Pimpinan', 'email' => 'pimpinan@yousee.test', 'role' => 'pimpinan'],
            ['name' => 'Akuntan', 'email' => 'akuntan@yousee.test', 'role' => 'akuntan'],
            ['name' => 'Staff', 'email' => 'staff@yousee.test', 'role' => 'staff'],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('password'),
                    'status' => UserStatus::ACTIVE,
                    'email_verified_at' => now(),
                ]
            );

            if (! $user->hasRole($data['role'])) {
                $user->assignRole($data['role']);
            }
        }

        User::factory()
            ->count(10)
            ->create(['status' => UserStatus::ACTIVE])
            ->each(fn (User $user) => $user->assignRole('staff'));
    }
}
