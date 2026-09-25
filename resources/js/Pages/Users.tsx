import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import SelectInput, { SelectOption } from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import Toast, { ToastType } from '@/Components/UI/Toast';
import DeleteUserModal from '@/Features/Users/Components/DeleteUserModal';
import UserModal from '@/Features/Users/Components/UserModal';
import {
    UserData,
    UserFilters,
    UserMetrics,
    UserPaginationData,
} from '@/Features/Users/types';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

interface UsersPageProps extends PageProps {
    users: UserPaginationData;
    metrics: UserMetrics;
    filters: UserFilters;
    flash?: {
        success?: string;
        error?: string;
    };
}

const ROLE_FILTER_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'Semua Peran' },
    { value: 'pimpinan', label: 'Pimpinan / Owner' },
    { value: 'admin', label: 'Administrator' },
    { value: 'akuntan', label: 'Akuntan / Finance' },
    { value: 'staff', label: 'Staff Operasional' },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
];

export default function Users({ users, metrics, filters }: UsersPageProps) {
    const { flash, auth } = usePage<UsersPageProps>().props;
    const currentUserId = auth?.user?.id;

    // Filter states
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

    // Toast state
    const [toast, setToast] = useState<{
        show: boolean;
        type: ToastType;
        message: string;
    }>({
        show: false,
        type: 'success',
        message: '',
    });

    useEffect(() => {
        if (flash?.success) {
            setToast({
                show: true,
                type: 'success',
                message: flash.success,
            });
        } else if (flash?.error) {
            setToast({
                show: true,
                type: 'error',
                message: flash.error,
            });
        }
    }, [flash]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchQuery, roleFilter, statusFilter);
    };

    const applyFilters = (search: string, role: string, status: string) => {
        router.get(
            route('users.index'),
            {
                search: search || undefined,
                role: role !== 'all' ? role : undefined,
                status: status !== 'all' ? status : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleRoleChange = (e: { target: { value: string } }) => {
        const val = e.target.value;
        setRoleFilter(val);
        applyFilters(searchQuery, val, statusFilter);
    };

    const handleStatusChange = (e: { target: { value: string } }) => {
        const val = e.target.value;
        setStatusFilter(val);
        applyFilters(searchQuery, roleFilter, val);
    };

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditModal = (user: UserData) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleToggleStatus = (user: UserData) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        router.post(
            route('users.toggle-status', user.id),
            { status: newStatus },
            { preserveScroll: true },
        );
    };

    const formatDate = (isoString?: string | null): string => {
        if (!isoString) return '—';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '—';
        }
    };

    const getRoleBadge = (roleName?: string) => {
        const role = (roleName || '').toLowerCase();
        switch (role) {
            case 'pimpinan':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        Pimpinan
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Admin
                    </span>
                );
            case 'akuntan':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Akuntan
                    </span>
                );
            case 'staff':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Staff
                    </span>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Aktif
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Nonaktif
            </span>
        );
    };

    const getRowMenuItems = (user: UserData): ActionMenuItem[] => {
        const isSelf = String(user.id) === String(currentUserId);
        const items: ActionMenuItem[] = [
            {
                label: 'Ubah Data Pengguna',
                icon: (
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                ),
                onClick: () => handleOpenEditModal(user),
            },
        ];

        if (!isSelf) {
            items.push({
                label:
                    user.status === 'active'
                        ? 'Nonaktifkan Akun'
                        : 'Aktifkan Akun',
                icon: (
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ),
                onClick: () => handleToggleStatus(user),
            });

            items.push({
                label: 'Hapus Pengguna',
                variant: 'danger',
                icon: (
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                ),
                onClick: () => setDeletingUser(user),
            });
        }

        return items;
    };

    return (
        <AppLayout
            activePage="users"
            title="Manajemen User"
            breadcrumbs={[
                { label: 'Dashboard', href: '/overview' },
                { label: 'Manajemen User' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header Page Title */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Manajemen User &amp; Akun
                        </h1>
                        <p className="text-xs text-slate-500 sm:text-sm">
                            Kelola daftar pengguna sistem dan hak akses peran
                            aplikasi Yousee Finance
                        </p>
                    </div>

                    <PrimaryButton
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="shrink-0 gap-2"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Tambah User Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title="Total Pengguna"
                        value={metrics.totalUsers}
                        badgeText="Aktif"
                        badgeColorClass="bg-blue-50 text-blue-700 border-blue-200"
                        icon={
                            <svg
                                className="h-4 w-4 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Pimpinan / Owner"
                        value={metrics.pimpinanCount}
                        badgeText="Super Access"
                        badgeColorClass="bg-purple-50 text-purple-700 border-purple-200"
                        icon={
                            <svg
                                className="h-4 w-4 text-purple-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Akuntan / Finance"
                        value={metrics.akuntanCount}
                        badgeText="Jurnal & Pajak"
                        badgeColorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                        icon={
                            <svg
                                className="h-4 w-4 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                        }
                    />
                    <MetricCard
                        title="Staff Operasional"
                        value={metrics.staffCount}
                        badgeText="Project & PO"
                        badgeColorClass="bg-slate-100 text-slate-700 border-slate-200"
                        icon={
                            <svg
                                className="h-4 w-4 text-slate-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        }
                    />
                </div>

                {/* Filter Panel Bar */}
                <div className="shadow-xs flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        {/* Search Input */}
                        <div className="w-full space-y-1 sm:max-w-xs">
                            <label
                                htmlFor="search_user"
                                className="block text-[10px] font-bold uppercase tracking-wider text-slate-400"
                            >
                                Cari Nama / Email
                            </label>
                            <div className="relative">
                                <TextInput
                                    id="search_user"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Cari pengguna..."
                                    className="w-full rounded-xl border-slate-200 bg-white pl-9 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-blue-600/20"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Role */}
                        <div className="w-full space-y-1 sm:w-48">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Peran / Role
                            </span>
                            <SelectInput
                                value={roleFilter}
                                options={ROLE_FILTER_OPTIONS}
                                onChange={handleRoleChange}
                            />
                        </div>

                        {/* Filter Status */}
                        <div className="w-full space-y-1 sm:w-44">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Status Akun
                            </span>
                            <SelectInput
                                value={statusFilter}
                                options={STATUS_FILTER_OPTIONS}
                                onChange={handleStatusChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="hidden items-center justify-center rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 sm:inline-flex"
                        >
                            Filter
                        </button>
                    </form>
                </div>

                {/* Users Table Container */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Pengguna</th>
                                    <th className="px-6 py-4">
                                        Peran / Hak Akses
                                    </th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">
                                        Terakhir Login
                                    </th>
                                    <th className="px-6 py-4">
                                        Tanggal Dibuat
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8">
                                            <EmptyState
                                                title="Tidak ada pengguna ditemukan"
                                                description="Coba ubah kata kunci pencarian atau filter peran yang dipilih."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const initial = user.name
                                            ? user.name.charAt(0).toUpperCase()
                                            : 'U';
                                        const isSelf =
                                            String(user.id) ===
                                            String(currentUserId);

                                        return (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-slate-50/60"
                                            >
                                                {/* Nama & Email */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="truncate font-bold text-slate-900">
                                                                    {user.name}
                                                                </span>
                                                                {isSelf && (
                                                                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                                                        Anda
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="truncate text-[11px] text-slate-400">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Peran */}
                                                <td className="px-6 py-4">
                                                    {getRoleBadge(user.role)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(
                                                        user.status,
                                                    )}
                                                </td>

                                                {/* Terakhir Login */}
                                                <td className="px-6 py-4 text-slate-500">
                                                    {formatDate(
                                                        user.last_login_at,
                                                    )}
                                                </td>

                                                {/* Tanggal Dibuat */}
                                                <td className="px-6 py-4 text-slate-500">
                                                    {formatDate(
                                                        user.created_at,
                                                    )}
                                                </td>

                                                {/* Aksi */}
                                                <td className="px-6 py-4 text-right">
                                                    <ActionDropdown
                                                        items={getRowMenuItems(
                                                            user,
                                                        )}
                                                        align="right"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.data.length > 0 && (
                        <div className="border-t border-slate-100 px-6 py-4">
                            <Pagination
                                currentPage={users.current_page}
                                totalPages={users.last_page}
                                totalItems={users.total}
                                itemsPerPage={users.per_page}
                                onPageChange={(page) => {
                                    router.get(
                                        route('users.index'),
                                        {
                                            page,
                                            search: searchQuery || undefined,
                                            role:
                                                roleFilter !== 'all'
                                                    ? roleFilter
                                                    : undefined,
                                            status:
                                                statusFilter !== 'all'
                                                    ? statusFilter
                                                    : undefined,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <UserModal
                show={isUserModalOpen}
                onClose={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser}
            />

            <DeleteUserModal
                show={deletingUser !== null}
                onClose={() => setDeletingUser(null)}
                user={deletingUser}
            />

            {/* Toast Notification */}
            <Toast
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
        </AppLayout>
    );
}
