"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
    analyzeGreenBinsFromImage,
    DEFAULT_BINS,
    emptyCategoriesFromBins,
    type CategoryOut,
    type BinSpec,
    toCsv,
} from "@/lib/green-analyzer";
import Layout from "@/components/layouts/app";
import Swal from 'sweetalert2'

// Skeleton util
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />
);

// ApexCharts client-only + skeleton fallback
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
    loading: () => <Skeleton className="h-30 w-full" />,
});

function autoTargetPixels(totalPixels: number): number {
    let base = Math.min(Math.max(Math.floor(totalPixels / 16), 120_000), 600_000);
    const cores = (typeof navigator !== "undefined" && (navigator as any).hardwareConcurrency) || 4;
    const coreFactor = Math.min(1.5, Math.max(0.75, cores / 8));
    base = Math.floor(base * coreFactor);
    const devMem = (typeof navigator !== "undefined" && (navigator as any).deviceMemory) || 4;
    if (devMem && devMem < 4) base = Math.floor(base * 0.7);
    return Math.min(Math.max(base, 80_000), 800_000);
}

// Gauge kecil
function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
    const series = [Math.max(0, Math.min(100, value))];
    const options = {
        theme: { mode: "dark" },
        chart: {
            type: "radialBar",
            sparkline: { enabled: true },
            background: "transparent",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            toolbar: { show: false },
            foreColor: "#e5e7eb",
        },
        stroke: { lineCap: "round" },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: { background: "#e7e7e7", strokeWidth: "97%", margin: 4 },
                dataLabels: {
                    name: { show: true, offsetY: 28, color: "#9ca3af" },
                    value: { fontSize: "20px", offsetY: -8, formatter: (v: number) => `${Math.round(v)}%` },
                },
            },
        },
        fill: { colors: [color] },
        labels: [label],
        grid: { padding: { top: -8 } },
    } as const;

    return <ReactApexChart options={options as any} series={series} type="radialBar" height={180} />;
}

export default function Page() {
    const imgRef = useRef<HTMLImageElement>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [rows, setRows] = useState<CategoryOut[]>(emptyCategoriesFromBins(DEFAULT_BINS));
    const [headline, setHeadline] = useState("—");
    const [imgInfo, setImgInfo] = useState("—");
    const [status, setStatus] = useState("");
    const [maskOn, setMaskOn] = useState(true);
    const [bins] = useState<BinSpec[]>(DEFAULT_BINS);

    // Transisi awal (hydration)
    const [hydrating, setHydrating] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setHydrating(false), 250);
        return () => clearTimeout(t);
    }, []);

    // Loading gambar (untuk skeleton preview)
    const [imgLoading, setImgLoading] = useState(false);

    const onFile = (f?: File) => {
        if (!f) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        const url = URL.createObjectURL(f);
        setObjectUrl(url);
        setHeadline("—");
        setImgInfo("Memuat…");
        setStatus("");
        setImgLoading(true);
    };

    async function analyze() {
        const img = imgRef.current;
        if (!img || !objectUrl) {
            Swal.fire({
                icon: 'warning',
                title: 'Tidak ada gambar',
                text: 'Silakan unggah gambar terlebih dahulu.',
            });
            return;
        }
        setStatus("Menganalisis…");
        try {
            await img.decode();
        } catch { }

        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setImgInfo(`${width}×${height}px`);

        const computedTarget = autoTargetPixels(width * height);
        const t0 = performance.now();
        const out = await analyzeGreenBinsFromImage(img, {
            stepTargetPixels: computedTarget,
            useVegetationMask: maskOn,
            bins,
        });
        const dt = Math.round(performance.now() - t0);

        setRows(out.categories);
        const top = out.categories.reduce((a, b) => (b.count > a.count ? b : a), out.categories[0]);
        setHeadline(top?.count ? `${top.name} dominan (${top.pct}%)` : "Semua 0%");
        setStatus(
            `Selesai ${dt} ms. Auto target ≈ ${computedTarget.toLocaleString()}; sampled ~${out.sampledPixels.toLocaleString()}. ` +
            (maskOn ? "Masking vegetasi ON." : "OFF.")
        );
    }
    return (
        <Layout pageTitle="Green Analyzer">
            <div
                className={`space-y-4 h-screen transition-opacity duration-300 ${hydrating ? "opacity-0" : "opacity-100"
                    }`}
            >
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Kiri: Gambar & Input */}
                    <section className="flex-1 bg-white/5 border rounded-2xl p-4 h-full">
                        <h2 className="text-lg font-semibold mb-3">Gambar & Input</h2>
                        <div className="flex flex-col gap-4 items-start w-full">
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => onFile(e.target.files?.[0] || undefined)}
                                    className="block border rounded px-3 py-2"
                                />
                                <div className="text-sm text-gray-500">Info gambar: {imgInfo}</div>
                            </div>

                            <div className="flex-1 w-full h-full">
                                {objectUrl ? (
                                    <>
                                        {imgLoading && <Skeleton className="w-full h-64 md:h-[480px]" />}
                                        <img
                                            ref={imgRef}
                                            src={objectUrl}
                                            alt=""
                                            onLoad={() => setImgLoading(false)}
                                            className={`w-full max-h-[480px] object-contain border rounded-xl bg-black/5 transition-opacity duration-300 ${imgLoading ? "opacity-0" : "opacity-100"
                                                }`}
                                        />
                                    </>
                                ) : (
                                    <Skeleton className="w-full h-64 md:h-[480px]" />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Kanan: Tombol & Ringkasan + Hasil (gauge) */}
                    <aside className="w-full lg:w-[36%] flex flex-col gap-4">
                        <section className="bg-white/5 border rounded-2xl p-4">
                            <h2 className="text-lg font-semibold mb-3">Tombol & Ringkasan</h2>
                            <div className="flex flex-wrap items-center gap-3 justify-between">
                                <label className="inline-flex items-center gap-2 border rounded-full px-3 py-1">
                                    <input
                                        type="checkbox"
                                        checked={maskOn}
                                        onChange={(e) => setMaskOn(e.target.checked)}
                                    />
                                    Masking vegetasi (HSV)
                                </label>
                                <button
                                    onClick={analyze}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    Analisis
                                </button>
                            </div>
                            <div className="mt-4 space-y-1 h-full">
                                <div className="text-sm text-gray-500">Status</div>
                                <div className="text-sm text-wrap">{status || "—"}</div>
                                <div className="text-sm text-gray-500 mt-2">Ringkasan</div>
                                <div className="font-semibold text-wrap">{headline}</div>
                            </div>
                        </section>

                        {/* Hasil Gauge (punya fallback skeleton dari dynamic import) */}
                        <section className="bg-white/5 border rounded-2xl p-4">
                            <h2 className="text-lg font-semibold mb-3">Hasil</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {rows.map((r) => (
                                    <div key={r.name} className="rounded-xl border p-2">
                                        <Gauge label={r.name} value={r.pct} color={r.sampleHex} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </Layout>
    );
}
