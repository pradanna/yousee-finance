import React from 'react';
import { BillboardLocation, fmt, Project } from './projectTypes';

interface PrintablePODocumentProps {
    project: Project;
    vendorName: string;
    locations: BillboardLocation[];
    isPPN: boolean;
    poNumber: string;
    poDate?: string;
}

export const PrintablePODocument = React.forwardRef<
    HTMLDivElement,
    PrintablePODocumentProps
>(({ project, vendorName, locations, isPPN, poNumber, poDate }, ref) => {
    const currentDate =
        poDate ||
        new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

    const totalDPP = locations.reduce((sum, item) => sum + item.vendorCost, 0);
    const totalPPN = isPPN ? totalDPP * 0.11 : 0;
    const grandTotal = totalDPP + totalPPN;

    return (
        <div
            ref={ref}
            className="mx-auto box-border flex max-w-[210mm] flex-col justify-between border border-slate-200 bg-white p-10 font-sans text-[11px] leading-tight text-slate-900 shadow-lg print:max-w-none print:border-none print:p-0 print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm' }}
        >
            <div>
                {/* 1. HEADER LOGO & COMPANY INFO */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="max-w-[440px] space-y-1">
                        <img
                            src="/images/logo-yousee2.png"
                            alt="Yousee Indonesia"
                            className="mb-1 h-10 w-auto object-contain"
                        />
                        <div className="text-[11.5px] font-bold leading-none text-slate-900">
                            Yousee Indonesia - PT SS Indonesia
                        </div>
                        <div className="text-[9.5px] leading-[1.3] text-slate-800">
                            <p>
                                <span className="font-bold">
                                    Marketing Office :
                                </span>{' '}
                                Jl. Balai Pustaka No.23, RT.6/RW.15, Rawamangun,
                                Kec. Pulo Gadung, Kota Jakarta Timur, Daerah
                                Khusus Ibukota Jakarta 13220
                            </p>
                            <p>
                                <span className="font-bold">Head Office :</span>{' '}
                                Jl Yos Sudarso - Tanjung Anom No 19B, Kel
                                Kwarasan, Kec Grogol, Kab Sukoharjo, Jawa Tengah
                                57522
                            </p>
                            <p>
                                <span className="font-bold">Phone :</span> +62
                                813 9370 0771 |{' '}
                                <span className="font-bold">Email :</span>{' '}
                                official@yousee-indonesia.com |{' '}
                                <span className="font-bold">Web :</span>{' '}
                                www.yousee-indonesia.com
                            </p>
                        </div>
                    </div>

                    <div className="pt-1 text-right">
                        <h1 className="mb-1 text-2xl font-bold uppercase tracking-normal text-[#0088cc]">
                            PURCHASE ORDER
                        </h1>
                        <table className="ml-auto border-collapse text-[10.5px] text-slate-800">
                            <tbody>
                                <tr>
                                    <td className="py-0.5 pr-3 text-right font-medium">
                                        DATE
                                    </td>
                                    <td className="py-0.5 text-right font-mono">
                                        {currentDate}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-0.5 pr-3 text-right font-medium">
                                        PO #
                                    </td>
                                    <td className="py-0.5 text-right font-mono">
                                        {poNumber}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. VENDOR INFO & QR CODE */}
                <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="flex-1 rounded-none border border-[#0088cc]">
                        <div className="bg-[#0088cc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            ORDER TO
                        </div>
                        <div className="space-y-0.5 bg-white p-2.5 text-[10px] text-slate-800">
                            <div className="text-[11px] font-bold text-slate-900">
                                {vendorName}
                            </div>
                            <div>Parinding Sallao</div>
                            <div>
                                Jl Pandang Raya Ruko Saphire III-03 Makassar
                            </div>
                            <div className="font-mono font-medium">
                                0411-4663939/ 081338005004
                            </div>
                        </div>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="flex h-[100px] w-[100px] flex-shrink-0 items-center justify-center border border-slate-300 bg-white p-1">
                        <svg
                            className="h-full w-full text-slate-800"
                            viewBox="0 0 100 100"
                            fill="currentColor"
                        >
                            <path d="M0 0h30v30H0zM5 5v20h20V5zm5 5h10v10H10zM70 0h30v30H70zM75 5v20h20V5zm5 5h10v10H80zM0 70h30v30H0zM5 75v20h20V75zm5 5h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM30 40h10v10H30zM50 40h10v10H50zM70 40h20v10H70zM40 60h10v10H40zM60 60h10v20H60zM80 70h10v10H80zM30 80h10v20H30zM50 90h20v10H50z" />
                        </svg>
                    </div>
                </div>

                {/* 3. ITEM TABLE */}
                <table className="mb-0 w-full border-collapse border border-slate-400 text-[10px]">
                    <thead>
                        <tr className="bg-[#0088cc] text-center font-bold text-white">
                            <th className="w-10 border border-slate-400 px-2 py-1">
                                No
                            </th>
                            <th className="border border-slate-400 px-3 py-1 text-center">
                                Deskripsi
                            </th>
                            <th className="w-16 border border-slate-400 px-2 py-1">
                                Ukuran
                            </th>
                            <th className="w-12 border border-slate-400 px-2 py-1">
                                V/H
                            </th>
                            <th className="w-28 border border-slate-400 px-2 py-1">
                                Lama Tayang
                            </th>
                            <th className="w-32 border border-slate-400 px-3 py-1 text-center">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.map((item, index) => (
                            <tr key={item.id} className="h-10">
                                <td className="border border-slate-400 px-2 py-1 text-center align-top">
                                    {index + 1}
                                </td>
                                <td className="border border-slate-400 px-3 py-1 align-top">
                                    {item.description}
                                </td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top font-mono">
                                    {item.size || '4x6'}
                                </td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top font-semibold">
                                    V
                                </td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top">
                                    {project.period || '1 Minggu'}
                                </td>
                                <td className="border border-slate-400 px-3 py-1 align-top">
                                    <div className="flex w-full justify-between font-mono">
                                        <span>Rp</span>
                                        <span>
                                            {fmt(item.vendorCost)
                                                .replace('Rp ', '')
                                                .trim()}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {/* Minimum height rows matching the template height */}
                        {Array.from({
                            length: Math.max(0, 6 - locations.length),
                        }).map((_, idx) => (
                            <tr key={`empty-${idx}`} className="h-10">
                                <td className="border border-slate-400 px-2 py-1 text-center align-top">
                                    {locations.length + idx + 1}
                                </td>
                                <td className="border border-slate-400 px-3 py-1 align-top"></td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top"></td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top"></td>
                                <td className="border border-slate-400 px-2 py-1 text-center align-top"></td>
                                <td className="border border-slate-400 px-3 py-1 align-top"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 4. TOTAL SUMMARY & NOTES */}
                <div className="mb-4 mt-0 flex items-start justify-between gap-4">
                    {/* Notes & Special Instructions */}
                    <div className="w-[58%] space-y-2 pt-2">
                        <div className="space-y-0.5 text-[10px] text-slate-800">
                            <p>
                                <span className="font-bold">Rate* :</span>
                            </p>
                            <p>
                                <span className="font-bold">Materi :</span>{' '}
                                {project.name}
                            </p>
                            <p>
                                <span className="font-bold">Penerangan :</span>{' '}
                                {locations[0]?.lighting || 'Berlampu'}
                            </p>
                            <p>
                                <span className="font-bold">
                                    Term Of Payment :
                                </span>{' '}
                                {locations[0]?.topNotes ||
                                    'Lunas setelah visual terpasang'}
                            </p>
                        </div>

                        <div className="border border-slate-400 bg-slate-200/60 p-2 text-[9.5px]">
                            <div className="mb-0.5 font-bold text-slate-900">
                                Special Instructions
                            </div>
                            <p className="leading-tight text-slate-800">
                                Order dikerjakan setelah Purchasing Order
                                ditandatangani dan mohon dikirimkan kembali
                                melalui :{' '}
                                <a
                                    href="mailto:official@yousee-indonesia.com"
                                    className="text-blue-700 underline"
                                >
                                    official@yousee-indonesia.com
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Totals Table */}
                    <div className="w-[38%]">
                        <table className="w-full border-collapse border-b border-l border-r border-slate-400 text-[10px]">
                            <tbody>
                                <tr>
                                    <td className="border-r border-slate-400 px-2 py-1 text-right font-bold">
                                        Total
                                    </td>
                                    <td className="px-2 py-1 text-right font-mono">
                                        <div className="flex w-full justify-between">
                                            <span>Rp</span>
                                            <span>
                                                {fmt(totalDPP)
                                                    .replace('Rp ', '')
                                                    .trim()}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                {isPPN && (
                                    <tr>
                                        <td className="border-r border-slate-400 px-2 py-1 text-right font-bold">
                                            PPN 11%
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            <div className="flex w-full justify-between">
                                                <span>Rp</span>
                                                <span>
                                                    {fmt(totalPPN)
                                                        .replace('Rp ', '')
                                                        .trim()}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="border-r border-slate-400 px-2 py-1 text-right font-bold">
                                        Sub Total
                                    </td>
                                    <td className="px-2 py-1 text-right font-mono font-bold">
                                        <div className="flex w-full justify-between">
                                            <span>Rp</span>
                                            <span>
                                                {fmt(grandTotal)
                                                    .replace('Rp ', '')
                                                    .trim()}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. SIGNATURES SECTION */}
                <div className="mt-8 grid grid-cols-2 gap-8 pt-4 text-[10px]">
                    <div className="pl-4 text-left">
                        <div className="mb-1 text-slate-800">Vendor</div>
                        <div className="mb-16 font-bold text-slate-900">
                            {vendorName}
                        </div>
                        <div className="font-medium text-slate-900">
                            Parinding Sallao
                        </div>
                    </div>

                    <div className="pl-4 text-left">
                        <div className="mb-1 text-slate-800">Approved by</div>
                        <div className="mb-16 font-bold text-slate-900">
                            Yousee Indonesia
                        </div>
                        <div className="font-medium text-slate-900">Sukma</div>
                    </div>
                </div>

                {/* FOOTER WATERMARK */}
                <div className="mt-16 pt-2 text-center text-[8px] text-slate-500">
                    The project has been approved by Yousee Indonesia.
                    Intellectual Property & All Copyrights belongs to Yousee
                    Indonesia .
                </div>
            </div>
        </div>
    );
});

PrintablePODocument.displayName = 'PrintablePODocument';
