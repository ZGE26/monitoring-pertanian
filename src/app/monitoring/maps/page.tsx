"use client";

import Layout from "@/components/layouts/app";
import dynamic from "next/dynamic";
import { useState } from "react";

// cukup satu komponen peta
const AppMap = dynamic(() => import("../../../components/AppMaps"), {
    ssr: false,
    loading: () => (
        <div className="h-96 w-full grid place-items-center text-sm text-gray-500">
            Loading map…
        </div>
    ),
});

export default function Page() {
    const [preset, setPreset] = useState<"light" | "dark">("light");

    return (
        <Layout pageTitle="Maps">
            <h1 className="text-2xl font-bold mb-4">Monitoring Maps</h1>
            <p className="text-gray-500 mb-3">
                This page will display maps related to monitoring.
            </p>

            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={() => setPreset(preset === "light" ? "dark" : "light")}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    {preset === "light" ? "Switch to Dark Map" : "Switch to Light Map"}
                </button>
            </div>

            <div className="w-full rounded-lg shadow-md mb-4 flex gap-2 flex-col lg:flex-row">
                <div className="w-full flex-1">
                    <div className="h-96 w-full relative border rounded-2xl overflow-hidden">
                        {/* nggak perlu 2 komponen, cukup ganti preset-nya */}
                        <AppMap
                            key={`map-${preset}`}         // opsional; pakai untuk re-init bersih saat ganti tema
                            preset={preset}               // "light" | "dark"
                            className="w-full h-full"
                            darkWithLabels                 // aktifkan label utk preset "dark" (boleh dihapus)
                        // center={[-6.96969, 107.6298]}
                        // zoom={20}
                        // data={customGeoJson}
                        />
                    </div>
                </div>

                <div className="w-full flex-1 p-4 h-96 bg-white/5 border rounded-2xl">
                    <h2 className="text-lg font-semibold mb-3">Map Information</h2>
                    <p className="text-sm text-gray-500">
                        This section can contain additional information about the map.
                    </p>
                    <ul className="mt-2 space-y-1">
                        <li className="text-sm text-gray-400">- Use the map to explore different areas.</li>
                        <li className="text-sm text-gray-400">- Click on areas to get more details.</li>
                        <li className="text-sm text-gray-400">- Zoom in and out for better visibility.</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
