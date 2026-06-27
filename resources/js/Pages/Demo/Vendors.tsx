import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';
import SlideOver from '@/Components/SlideOver';

interface VendorItem {
    id: number;
    name: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    pkp: boolean;
    status: string;
    count: number;
    total: string;
}

export default function Vendors() {
    const fiscalMode = useDemoFiscalMode();
    const [isOpen, setIsOpen] = useState(false);
    const [vendors, setVendors] = useState<VendorItem[]>([
        { id: 1, name: 'PT. Megah Billboard Jaya', npwp: '01.234.567.8-901.000', email: 'sales@megahbillboard.com', phone: '021-5551234', address: 'Jl. Jend. Sudirman No. 12, Jakarta Pusat', pkp: true, status: 'Active', count: 12, total: 'IDR 45.000.000' },
        { id: 2, name: 'PT. Promosi Outdoor Kreasindo', npwp: '12.345.678.9-012.000', email: 'info@promosicreative.co.id', phone: '021-5555678', address: 'Kawasan Industri Pulogadung Blok B3, Jakarta Timur', pkp: true, status: 'Active', count: 8, total: 'IDR 24.300.000' },
        { id: 3, name: 'CV. Media Ad Perkasa', npwp: '', email: 'contact@mediaadperkasa.net', phone: '0812-3456-7890', address: 'Jl. Kemang Raya No. 45, Jakarta Selatan', pkp: false, status: 'Active', count: 15, total: 'IDR 5.200.000' },
        { id: 4, name: 'CV. Citra Bali Billboard', npwp: '89.123.456.7-891.000', email: 'bali@citrabillboard.com', phone: '0361-223344', address: 'Jl. Sunset Road No. 88, Kuta, Bali', pkp: false, status: 'Archived', count: 3, total: 'IDR 1.500.000' },
    ]);

    const [form, setForm] = useState({ name: '', npwp: '', email: '', phone: '', address: '', pkp: false });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap vendor wajib diisi.';
        }

        if (form.npwp.trim()) {
            const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
            if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                newErrors.npwp = 'Format NPWP tidak valid. Harus terdiri dari 15 atau 16 digit angka.';
            }
        }

        if (form.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.email)) {
                newErrors.email = 'Format email tidak valid.';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Add dummy vendor
        setVendors([
            ...vendors,
            {
                id: vendors.length + 1,
                name: form.name,
                npwp: form.npwp || '',
                email: form.email || '—',
                phone: form.phone || '—',
                address: form.address || '—',
                pkp: form.pkp,
                status: 'Active',
                count: 0,
                total: 'IDR 0',
            },
        ]);

        // Reset
        setForm({ name: '', npwp: '', email: '', phone: '', address: '', pkp: false });
        setErrors({});
        setIsOpen(false);
    };

    const getVendorStats = (vendor: VendorItem) => {
        if (vendor.id > 4) {
            return { count: vendor.count, total: vendor.total };
        }
        if (fiscalMode === 'ppn') {
            switch (vendor.id) {
                case 1: return { count: 12, total: 'IDR 45.000.000' };
                case 2: return { count: 8, total: 'IDR 24.300.000' };
                case 3: return { count: 15, total: 'IDR 5.200.000' };
                case 4: return { count: 3, total: 'IDR 1.500.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        } else {
            switch (vendor.id) {
                case 1: return { count: 6, total: 'IDR 18.000.000' };
                case 2: return { count: 4, total: 'IDR 12.000.000' };
                case 3: return { count: 10, total: 'IDR 3.500.000' };
                case 4: return { count: 1, total: 'IDR 500.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        }
    };

    return (
        <DemoLayout
            activePage="vendors"
            title="Vendor Directory"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Master Data' }, { label: 'Vendors' }]}
        >
            <div className="space-y-6">
                {/* Header CTA */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Direktori Vendor Partner</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Kelola data vendor untuk transaksi Purchase Order (PO)</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Daftarkan Vendor Baru
                    </button>
                </div>

                {/* Vendors Table List */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Nama Vendor</th>
                                    <th className="px-6 py-4">NPWP Resmi</th>
                                    <th className="px-6 py-4">Kontak (Email / Telepon)</th>
                                    <th className="px-6 py-4">Alamat</th>
                                    <th className="px-6 py-4">Status PKP</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Jumlah Transaksi PO</th>
                                    <th className="px-6 py-4 text-right">Total Belanja (Mode {fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {vendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{vendor.name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">ID: VND-{vendor.id}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{vendor.npwp || '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-slate-600">{vendor.email}</div>
                                            <div className="text-[10px] text-slate-450 mt-0.5">{vendor.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate" title={vendor.address}>
                                            {vendor.address}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                                vendor.pkp
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {vendor.pkp ? 'PKP (Bisa PPN)' : 'Non-PKP'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                vendor.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold font-mono text-slate-700">{getVendorStats(vendor).count} PO</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{getVendorStats(vendor).total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form SlideOver Drawer */}
                <SlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} title="Daftarkan Vendor Baru">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        {/* Vendor Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                Nama Lengkap Vendor <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Masukkan nama lengkap vendor (wajib)..."
                            />
                            {errors.name && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.name}</span>}
                        </div>

                        {/* NPWP */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">NPWP</label>
                            <input
                                type="text"
                                value={form.npwp}
                                onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Masukkan NPWP vendor..."
                            />
                            {errors.npwp && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.npwp}</span>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Email</label>
                            <input
                                type="text"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="vendor@example.com"
                            />
                            {errors.email && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.email}</span>}
                        </div>

                        {/* Telepon */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Telepon</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Contoh: 0812-xxxx-xxxx"
                            />
                        </div>

                        {/* Alamat */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Alamat</label>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all h-24 resize-none"
                                placeholder="Masukkan alamat lengkap vendor..."
                            />
                        </div>

                        {/* PKP Checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <input
                                type="checkbox"
                                checked={form.pkp}
                                onChange={(e) => setForm({ ...form, pkp: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                                id="pkp-checkbox"
                            />
                            <div className="space-y-0.5">
                                <label htmlFor="pkp-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer block">Status Pengusaha Kena Pajak (PKP)</label>
                                <span className="text-[10px] text-slate-400 font-semibold block">Centang jika vendor memiliki sertifikat PKP resmi untuk menerbitkan faktur PPN Masukan.</span>
                            </div>
                        </div>

                        {/* Form Action Footer */}
                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                                Simpan Vendor
                            </button>
                        </div>
                    </form>
                </SlideOver>
            </div>
        </DemoLayout>
    );
}
