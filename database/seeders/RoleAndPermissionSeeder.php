<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Enums\UserRole;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create basic roles
        $rolePimpinan = Role::create(['name' => 'pimpinan']);
        $roleAdmin = Role::create(['name' => 'admin']);
        $roleAkuntan = Role::create(['name' => 'akuntan']);
        $roleStaff = Role::create(['name' => 'staff']);

        // Create some default permissions (can be expanded later)
        Permission::create(['name' => 'unlock-closing-period']);
        Permission::create(['name' => 'manage-users']);
        Permission::create(['name' => 'approve-po']);
        Permission::create(['name' => 'create-invoice']);

        // Assign permissions to roles
        $rolePimpinan->syncPermissions(Permission::whereIn('name', ['unlock-closing-period', 'approve-po'])->get());
        $roleAdmin->syncPermissions(Permission::where('name', 'manage-users')->get());
        $roleAkuntan->syncPermissions(Permission::where('name', 'create-invoice')->get());

        // Create a default admin user for testing
        $admin = User::firstOrCreate(
            ['email' => 'admin@yousee.test'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
            ]
        );
        $admin->assignRole('admin');
        
        // Create a pimpinan
        $pimpinan = User::firstOrCreate(
            ['email' => 'pimpinan@yousee.test'],
            [
                'name' => 'Pimpinan',
                'password' => bcrypt('password'),
            ]
        );
        $pimpinan->assignRole('pimpinan');
    }
}
