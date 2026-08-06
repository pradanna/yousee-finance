import React from "react";
import { BillboardLocation, Project, FiscalMode, fmt } from "./projectTypes";

interface PrintablePODocumentProps {
    project: Project;
    vendorName: string;
    locations: BillboardLocation[];
    isPPN: boolean;
    poNumber: string;
    poDate?: string;
}

export const PrintablePODocument = React.forwardRef<HTMLDivElement, PrintablePODocumentProps>(
    ({ project, vendorName, locations, isPPN, poNumber, poDate }, ref) => {
        const currentDate = poDate || new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });

        const totalDPP = locations.reduce((sum, item) => sum + item.vendorCost, 0);
        const totalPPN = isPPN ? totalDPP * 0.11 : 0;
        const grandTotal = totalDPP + totalPPN;

        return (
            <div
                ref={ref}
                className="bg-white text-slate-900 font-sans p-10 max-w-[210mm] mx-auto text-[11px] leading-tight print:p-0 print:max-w-none print:shadow-none shadow-lg border border-slate-200 print:border-none box-border flex flex-col justify-between"
                style={{ width: "210mm", minHeight: "297mm" }}
            >
                <div>
                    {/* 1. HEADER LOGO & COMPANY INFO */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1 max-w-[440px]">
                            <img
                                src="/images/logo-yousee2.png"
                                alt="Yousee Indonesia"
                                className="h-10 w-auto object-contain mb-1"
                            />
                            <div className="font-bold text-[11.5px] text-slate-900 leading-none">Yousee Indonesia - PT SS Indonesia</div>
                            <div className="text-[9.5px] text-slate-800 leading-[1.3]">
                                <p><span className="font-bold">Marketing Office :</span> Jl. Balai Pustaka No.23, RT.6/RW.15, Rawamangun, Kec. Pulo Gadung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13220</p>
                                <p><span className="font-bold">Head Office :</span> Jl Yos Sudarso - Tanjung Anom No 19B, Kel Kwarasan, Kec Grogol, Kab Sukoharjo, Jawa Tengah 57522</p>
                                <p><span className="font-bold">Phone :</span> +62 813 9370 0771 | <span className="font-bold">Email :</span> official@yousee-indonesia.com | <span className="font-bold">Web :</span> www.yousee-indonesia.com</p>
                            </div>
                        </div>

                        <div className="text-right pt-1">
                            <h1 className="text-2xl font-bold text-[#0088cc] uppercase tracking-normal mb-1">PURCHASE ORDER</h1>
                            <table className="text-[10.5px] text-slate-800 ml-auto border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="pr-3 py-0.5 text-right font-medium">DATE</td>
                                        <td className="py-0.5 text-right font-mono">{currentDate}</td>
                                    </tr>
                                    <tr>
                                        <td className="pr-3 py-0.5 text-right font-medium">PO #</td>
                                        <td className="py-0.5 text-right font-mono">{poNumber}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. VENDOR INFO & QR CODE */}
                    <div className="flex justify-between items-start mb-3 gap-4">
                        <div className="flex-1 border border-[#0088cc] rounded-none">
                            <div className="bg-[#0088cc] text-white font-bold px-3 py-1 text-[10px] uppercase tracking-wider">
                                ORDER TO
                            </div>
                            <div className="p-2.5 bg-white space-y-0.5 text-[10px] text-slate-800">
                                <div className="font-bold text-[11px] text-slate-900">{vendorName}</div>
                                <div>Parinding Sallao</div>
                                <div>Jl Pandang Raya Ruko Saphire III-03 Makassar</div>
                                <div className="font-mono font-medium">0411-4663939/ 081338005004</div>
                            </div>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="w-[100px] h-[100px] flex items-center justify-center border border-slate-300 p-1 bg-white flex-shrink-0">
                            <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                                <path d="M0 0h30v30H0zM5 5v20h20V5zm5 5h10v10H10zM70 0h30v30H70zM75 5v20h20V5zm5 5h10v10H80zM0 70h30v30H0zM5 75v20h20V75zm5 5h10v10H10zM40 10h10v10H40zM50 20h10v10H50zM30 40h10v10H30zM50 40h10v10H50zM70 40h20v10H70zM40 60h10v10H40zM60 60h10v20H60zM80 70h10v10H80zM30 80h10v20H30zM50 90h20v10H50z" />
                            </svg>
                        </div>
                    </div>

                    {/* 3. ITEM TABLE */}
                    <table className="w-full border-collapse border border-slate-400 mb-0 text-[10px]">
                        <thead>
                            <tr className="bg-[#0088cc] text-white font-bold text-center">
                                <th className="border border-slate-400 py-1 px-2 w-10">No</th>
                                <th className="border border-slate-400 py-1 px-3 text-center">Deskripsi</th>
                                <th className="border border-slate-400 py-1 px-2 w-16">Ukuran</th>
                                <th className="border border-slate-400 py-1 px-2 w-12">V/H</th>
                                <th className="border border-slate-400 py-1 px-2 w-28">Lama Tayang</th>
                                <th className="border border-slate-400 py-1 px-3 w-32 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((item, index) => (
                                <tr key={item.id} className="h-10">
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top">{index + 1}</td>
                                    <td className="border border-slate-400 py-1 px-3 align-top">
                                        {item.description}
                                    </td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top font-mono">{item.size || "4x6"}</td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top font-semibold">V</td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top">{project.period || "1 Minggu"}</td>
                                    <td className="border border-slate-400 py-1 px-3 align-top">
                                        <div className="flex justify-between w-full font-mono">
                                            <span>Rp</span>
                                            <span>{fmt(item.vendorCost).replace("Rp ", "").trim()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Minimum height rows matching the template height */}
                            {Array.from({ length: Math.max(0, 6 - locations.length) }).map((_, idx) => (
                                <tr key={`empty-${idx}`} className="h-10">
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top">{locations.length + idx + 1}</td>
                                    <td className="border border-slate-400 py-1 px-3 align-top"></td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top"></td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top"></td>
                                    <td className="border border-slate-400 py-1 px-2 text-center align-top"></td>
                                    <td className="border border-slate-400 py-1 px-3 align-top"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 4. TOTAL SUMMARY & NOTES */}
                    <div className="flex justify-between items-start gap-4 mb-4 mt-0">
                        {/* Notes & Special Instructions */}
                        <div className="w-[58%] space-y-2 pt-2">
                            <div className="text-[10px] text-slate-800 space-y-0.5">
                                <p><span className="font-bold">Rate* :</span></p>
                                <p><span className="font-bold">Materi :</span> {project.name}</p>
                                <p><span className="font-bold">Penerangan :</span> {locations[0]?.lighting || "Berlampu"}</p>
                                <p><span className="font-bold">Term Of Payment :</span> {locations[0]?.topNotes || "Lunas setelah visual terpasang"}</p>
                            </div>

                            <div className="border border-slate-400 bg-slate-200/60 p-2 text-[9.5px]">
                                <div className="font-bold text-slate-900 mb-0.5">Special Instructions</div>
                                <p className="text-slate-800 leading-tight">
                                    Order dikerjakan setelah Purchasing Order ditandatangani dan mohon dikirimkan kembali melalui :{" "}
                                    <a href="mailto:official@yousee-indonesia.com" className="text-blue-700 underline">
                                        official@yousee-indonesia.com
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Totals Table */}
                        <div className="w-[38%]">
                            <table className="w-full text-[10px] border-collapse border-b border-l border-r border-slate-400">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-slate-400 py-1 px-2 font-bold text-right">Total</td>
                                        <td className="py-1 px-2 text-right font-mono">
                                            <div className="flex justify-between w-full">
                                                <span>Rp</span>
                                                <span>{fmt(totalDPP).replace("Rp ", "").trim()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {isPPN && (
                                        <tr>
                                            <td className="border-r border-slate-400 py-1 px-2 font-bold text-right">PPN 11%</td>
                                            <td className="py-1 px-2 text-right font-mono">
                                                <div className="flex justify-between w-full">
                                                    <span>Rp</span>
                                                    <span>{fmt(totalPPN).replace("Rp ", "").trim()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="border-r border-slate-400 py-1 px-2 font-bold text-right">Sub Total</td>
                                        <td className="py-1 px-2 text-right font-mono font-bold">
                                            <div className="flex justify-between w-full">
                                                <span>Rp</span>
                                                <span>{fmt(grandTotal).replace("Rp ", "").trim()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 5. SIGNATURES SECTION */}
                    <div className="grid grid-cols-2 gap-8 text-[10px] pt-4 mt-8">
                        <div className="text-left pl-4">
                            <div className="text-slate-800 mb-1">Vendor</div>
                            <div className="font-bold text-slate-900 mb-16">{vendorName}</div>
                            <div className="text-slate-900 font-medium">
                                Parinding Sallao
                            </div>
                        </div>

                        <div className="text-left pl-4">
                            <div className="text-slate-800 mb-1">Approved by</div>
                            <div className="font-bold text-slate-900 mb-16">Yousee Indonesia</div>
                            <div className="text-slate-900 font-medium">
                                Sukma
                            </div>
                        </div>
                    </div>

                    {/* FOOTER WATERMARK */}
                    <div className="text-center text-[8px] text-slate-500 mt-16 pt-2">
                        The project has been approved by Yousee Indonesia. Intellectual Property & All Copyrights belongs to Yousee Indonesia .
                    </div>
                </div>
            </div>
        );
    }
);

PrintablePODocument.displayName = "PrintablePODocument";
