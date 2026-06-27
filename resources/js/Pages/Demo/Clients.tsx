import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';
import SlideOver from '@/Components/SlideOver';

interface ClientItem {
    id: number;
    name: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    ppnEnabled: boolean;
    status: string;
    count: number;
    total: string;
}

export default function Clients() {
    const fiscalMode = useDemoFiscalMode();
    const [isOpen, setIsOpen] = useState(false);
    const [clients, setClients] = useState<ClientItem[]>([
        { id: 1, name: 'PT. Gojek Tokopedia', npwp: '01.555.666.7-001.000', email: 'billing@gotocompany.com', phone: '021-30005000', address: 'Pasaraya Blok M Gedung B, Jakarta Selatan', ppnEnabled: true, status: 'Active', count: 18, total: 'IDR 150.000.000' },
        { id: 2, name: 'Shopee Indonesia', npwp: '02.444.888.9-002.000', email: 'finance@shopee.co.id', phone: '021-80647100', address: 'Pacific Century Place Tower Lt. 26, SCBD, Jakarta Selatan', ppnEnabled: true, status: 'Active', count: 14, total: 'IDR 240.000.000' },
        { id: 3, name: 'Traveloka Corp', npwp: '', email: 'ap@traveloka.com', phone: '021-29775800', address: 'Wisma Barito Pacific Tower B, Jakarta Barat', ppnEnabled: false, status: 'Active', count: 9, total: 'IDR 85.000.000' },
        { id: 4, name: 'PT. Toko Kelontong Jaya', npwp: '', email: 'kelontong@jaya.id', phone: '0813-9999-8888', address: 'Jl. Ahmad Yani No. 100, Semarang', ppnEnabled: false, status: 'Active', count: 2, total: 'IDR 15.000.000' }
    ]);

    const [form, setForm] = useState({ name: '', npwp: '', email: '', phone: '', address: '', ppnEnabled: false });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap client wajib diisi.';
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

        setClients([
            ...clients,
            {
                id: clients.length + 1,
                name: form.name,
                npwp: form.npwp || '',
                email: form.email || '—',
                phone: form.phone || '—',
                address: form.address || '—',
                ppnEnabled: form.ppnEnabled,
                status: 'Active',
                count: 0,
                total: 'IDR 0',
            },
        ]);

        setForm({ name: '', npwp: '', email: '', phone: '', address: '', ppnEnabled: false });
        setErrors({});
        setIsOpen(false);
    };

    const getClientStats = (client: ClientItem) => {
        if (client.id > 4) {
            return { count: client.count, total: client.total };
        }
        if (fiscalMode === 'ppn') {
            switch (client.id) {
                case 1: return { count: 18, total: 'IDR 150.000.000' };
                case 2: return { count: 14, total: 'IDR 240.000.000' };
                case 3: return { count: 9, total: 'IDR 85.000.000' };
                case 4: return { count: 2, total: 'IDR 15.000.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        } else {
            switch (client.id) {
                case 1: return { count: 10, total: 'IDR 90.000.000' };
                case 2: return { count: 8, total: 'IDR 145.000.000' };
                case 3: return { count: 6, total: 'IDR 55.000.000' };
                case 4: return { count: 2, total: 'IDR 15.000.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        }
    };

    return (
        <DemoLayout
            activePage="clients"
            title="Client Directory"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Master Data' }, { label: 'Clients' }]}
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Manajemen Pelanggan / Client</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Kelola data klien pengiklan Yousee Indonesia untuk penerbitan Invoice</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Daftarkan Client Baru
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Nama Client</th>
                                    <th className="px-6 py-4">NPWP Resmi</th>
                                    <th className="px-6 py-4">Kontak (Email / Telepon)</th>
                                    <th className="px-6 py-4">Alamat Kantor</th>
                                    <th className="px-6 py-4">Transaksi PPN</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Jumlah Invoice</th>
                                    <th className="px-6 py-4 text-right">Total Pendapatan (Mode {fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{client.name}</div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">ID: CLI-{client.id}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">{client.npwp || '—'}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-slate-600">{client.email}</div>
                                            <div className="text-[10px] text-slate-455 mt-0.5">{client.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate" title={client.address}>
                                            {client.address}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                                                client.ppnEnabled
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {client.ppnEnabled ? 'Wajib PPN' : 'Bebas PPN'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                client.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {client.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold font-mono text-slate-700">{getClientStats(client).count} Inv</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{getClientStats(client).total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <SlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} title="Daftarkan Client Baru">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                                Nama Lengkap Client <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Masukkan nama lengkap client (wajib)..."
                            />
                            {errors.name && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.name}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">NPWP</label>
                            <input
                                type="text"
                                value={form.npwp}
                                onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Masukkan NPWP client..."
                            />
                            {errors.npwp && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.npwp}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Email</label>
                            <input
                                type="text"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="client@example.com"
                            />
                            {errors.email && <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide block mt-1">{errors.email}</span>}
                        </div>

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

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Alamat</label>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all h-24 resize-none"
                                placeholder="Masukkan alamat lengkap client..."
                            />
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <input
                                type="checkbox"
                                checked={form.ppnEnabled}
                                onChange={(e) => setForm({ ...form, ppnEnabled: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                                id="ppn-checkbox"
                            />
                            <div className="space-y-0.5">
                                <label htmlFor="ppn-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer block">Status Wajib PPN (PKP)</label>
                                <span className="text-[10px] text-slate-400 font-semibold block">Centang jika client menghendaki faktur PPN Keluaran resmi atas jasa billboard/videotron yang disewa.</span>
                            </div>
                        </div>

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
                                Simpan Client
                            </button>
                        </div>
                    </form>
                </SlideOver>
            </div>
        </DemoLayout>
    );
}
