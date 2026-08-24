import { useState } from 'react';

interface PpnInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PpnInfoModal({ isOpen, onClose }: PpnInfoModalProps) {
    const [infoTab, setInfoTab] = useState<
        'status' | 'keluaran' | 'masukan' | 'ntpn'
    >('status');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                onClick={onClose}
            />
            <div className="animate-fade-in relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/30 text-blue-400">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Panduan Alur & Penjelasan Status e-Faktur PPN
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                                Pedoman operasional pajak perpajakan DJP Online
                                & YouSee Finance
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Sub Navigation Pills */}
                <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/80 px-6 py-2.5">
                    <button
                        type="button"
                        onClick={() => setInfoTab('status')}
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            infoTab === 'status'
                                ? 'shadow-2xs border border-slate-200 bg-white text-slate-900'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        📌 Status Approval
                    </button>
                    <button
                        type="button"
                        onClick={() => setInfoTab('keluaran')}
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            infoTab === 'keluaran'
                                ? 'shadow-2xs border border-blue-200 bg-white text-blue-700'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        📤 Alur PPN Keluaran
                    </button>
                    <button
                        type="button"
                        onClick={() => setInfoTab('masukan')}
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            infoTab === 'masukan'
                                ? 'shadow-2xs border border-emerald-200 bg-white text-emerald-700'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        📥 Alur PPN Masukan
                    </button>
                    <button
                        type="button"
                        onClick={() => setInfoTab('ntpn')}
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            infoTab === 'ntpn'
                                ? 'shadow-2xs border border-purple-200 bg-white text-purple-700'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        🏛️ Setor NTPN
                    </button>
                </div>

                {/* Modal Body Content */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
                    {infoTab === 'status' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Arti 3 Tahapan Status e-Faktur
                                </h4>
                                <p className="mt-0.5 text-[11.5px] text-slate-500">
                                    Setiap faktur pajak di sistem melewati
                                    siklus status berikut sebelum sah diakui
                                    oleh DJP:
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* 1. Draft */}
                                <div className="space-y-1.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                                Draft
                                            </span>
                                            <span className="text-xs font-bold text-slate-900">
                                                Tahap Awal / Belum Ada NSFP
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Dokumen transaksi baru dibuat di sistem.
                                        Data perpajakan masih dalam proses
                                        review internal atau nomor NSFP belum
                                        dialokasikan. Dokumen berstatus draft{' '}
                                        <strong>
                                            belum siap diekspor / diunggah ke
                                            DJP
                                        </strong>
                                        .
                                    </p>
                                </div>

                                {/* 2. Siap Upload DJP */}
                                <div className="space-y-1.5 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                                                Siap Upload DJP
                                            </span>
                                            <span className="text-xs font-bold text-slate-900">
                                                Data Lengkap & Fix (Ada NSFP)
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Dokumen transaksi sudah final (Invoice
                                        sudah <em>issued</em> atau PO
                                        disetujui), NPWP lawan transaksi valid,
                                        dan{' '}
                                        <strong>
                                            nomor NSFP resmi 16 digit sudah
                                            terisi
                                        </strong>
                                        . Faktur ini siap diekspor via tombol{' '}
                                        <strong>CSV e-Faktur</strong> untuk
                                        diunggah ke DJP.
                                    </p>
                                </div>

                                {/* 3. Sukses Upload DJP */}
                                <div className="space-y-1.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                ✓ Sukses Upload DJP
                                            </span>
                                            <span className="text-xs font-bold text-slate-900">
                                                Selesai Diunggah & Dikonfirmasi
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Admin telah selesai mengunggah file CSV
                                        ke aplikasi e-Faktur DJP dan menandai
                                        faktur ini berhasil di-approve di server
                                        DJP. PDF Faktur resmi ber-QR Code sudah
                                        terbit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {infoTab === 'keluaran' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                    Alur Penerbitan PPN Keluaran (Penjualan
                                    Client PKP)
                                </h4>
                                <p className="mt-0.5 text-[11.5px] text-slate-500">
                                    Faktur pajak yang diterbitkan oleh YouSee
                                    Indonesia saat menagih jasa/iklan ke Client:
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                                        1
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Buat Invoice Penjualan
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Pilih Client PKP dalam Mode PPN.
                                            Sistem otomatis menghitung DPP dan
                                            tarif PPN 11%. (Status:{' '}
                                            <em>Draft</em>)
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                                        2
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Alokasikan NSFP (Nomor Seri Faktur
                                            Pajak)
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Ambil nomor dari jatah e-Nofa DJP
                                            resmi perusahaan, lalu klik{' '}
                                            <strong>Edit NSFP</strong> di tabel
                                            untuk memasukkan nomor tersebut
                                            (Status otomatis menjadi{' '}
                                            <em>Siap Upload DJP</em>).
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                                        3
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Ekspor CSV e-Faktur (Keluaran)
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Klik tombol{' '}
                                            <strong>
                                                CSV e-Faktur (Keluaran)
                                            </strong>{' '}
                                            untuk mengunduh skema file{' '}
                                            <code>FK</code> standar resmi DJP.
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                                        4
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Import & Upload di Aplikasi DJP
                                            Online
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Import file CSV ke aplikasi e-Faktur
                                            DJP &rarr; Klik Upload Faktur &rarr;
                                            Server DJP memverifikasi hingga
                                            status di aplikasi DJP menjadi{' '}
                                            <strong>Approval Sukses</strong> dan
                                            PDF ber-QR Code terbit.
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        5
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Tandai Sukses Upload di YouSee
                                            Finance
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Klik menu aksi <code>⋮</code> di
                                            baris tabel &rarr; pilih{' '}
                                            <strong>
                                                "Tandai Sudah Di-upload ke DJP"
                                            </strong>{' '}
                                            (Status berubah menjadi{' '}
                                            <em>✓ Sukses Upload DJP</em>).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {infoTab === 'masukan' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                                    Alur Pencatatan PPN Masukan (Pembelian
                                    Vendor PKP)
                                </h4>
                                <p className="mt-0.5 text-[11.5px] text-slate-500">
                                    Faktur pajak yang diterima dari Vendor
                                    rekanan untuk dikreditkan sebagai pengurang
                                    pajak:
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        1
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Terbitkan Purchase Order (PO Vendor)
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            PO diterbitkan kepada Vendor PKP.
                                            Nilai DPP dan PPN 11% tercatat di
                                            sistem. (Status: <em>Draft</em>)
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        2
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Terima Faktur Pajak dari Vendor &
                                            Input NSFP
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Vendor mengirim tagihan + lembar PDF
                                            Faktur Pajak resmi. Finance klik{' '}
                                            <strong>Edit NSFP Vendor</strong>{' '}
                                            untuk menginput nomor NSFP vendor
                                            tersebut (Status otomatis menjadi{' '}
                                            <em>Siap Upload DJP</em>).
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        3
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Ekspor CSV e-Faktur (Masukan)
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Klik tombol{' '}
                                            <strong>
                                                CSV e-Faktur (Masukan)
                                            </strong>{' '}
                                            untuk mengunduh skema file{' '}
                                            <code>FM</code> resmi DJP.
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        4
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Persetujuan Faktur Masukan di
                                            e-Faktur DJP
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Import file CSV ke e-Faktur DJP
                                            &rarr; Lakukan Persetujuan Faktur
                                            Masukan di DJP.
                                        </p>
                                    </div>
                                </div>

                                <div className="shadow-2xs flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                                        5
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900">
                                            Tandai Sukses Upload di YouSee
                                            Finance
                                        </h5>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            Klik menu aksi <code>⋮</code> di
                                            baris tabel &rarr; pilih{' '}
                                            <strong>
                                                "Tandai Sudah Di-upload ke DJP"
                                            </strong>{' '}
                                            (Status berubah menjadi{' '}
                                            <em>✓ Sukses Upload DJP</em> dan sah
                                            dikreditkan).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {infoTab === 'ntpn' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                                    Alur Rekap SPT Masa & Penyetoran Kas Negara
                                    (NTPN)
                                </h4>
                                <p className="mt-0.5 text-[11.5px] text-slate-500">
                                    Proses penutupan masa pajak dan pembayaran
                                    Kurang Bayar PPN ke kas negara:
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                    <h5 className="font-bold text-slate-900">
                                        1. Rekonsiliasi Otomatis SPT Masa 1111
                                    </h5>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Sistem otomatis menghitung selisih:{' '}
                                        <code>
                                            Total PPN Keluaran - Total PPN
                                            Masukan (Dikreditkan) = PPN Net
                                            (Kurang Bayar)
                                        </code>
                                        .
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                    <h5 className="font-bold text-slate-900">
                                        2. Bayar ke Bank / Kantor Pos Persepsi
                                    </h5>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Finance membuat kode e-Billing DJP dan
                                        melakukan pembayaran ke Bank Persepsi
                                        (Mandiri, BCA, BRI, dll.). Bank akan
                                        menerbitkan Bukti Penerimaan Negara yang
                                        memuat <strong>16 karakter NTPN</strong>
                                        .
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                    <h5 className="font-bold text-slate-900">
                                        3. Catat Nomor NTPN di Aplikasi
                                    </h5>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Klik tombol{' '}
                                        <strong>Pembayaran PPN (NTPN)</strong>{' '}
                                        di pojok kanan atas. Masukkan kode NTPN,
                                        tanggal setor, dan nama bank. Status
                                        pada kartu metrik akan berubah menjadi{' '}
                                        <strong>✓ Lunas Disetor</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="shadow-2xs cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                    >
                        Tutup Panduan
                    </button>
                </div>
            </div>
        </div>
    );
}
