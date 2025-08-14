'use client';

import Layout from "@/components/layouts/app";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

type Row = {
    id: number;
    time: string;          
    temperature: number;
    humidity: number;
    soilTemperature: number;
    soilHumidity?: number;
};

type Section = {
    date: string;            
    items: Row[];     
};

export default function Page() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const BASE_URL = "http://localhost:5000";


    const fetchData = async () => {
            try {
                const response = await fetch(`${BASE_URL}/all/date-grouped`, {
                    method: 'GET',
                    cache: 'no-cache',
                });
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setSections(data);
                return data;
            } catch (error) {
                console.error("Fetch error:", error);
                return [];
            }
        };


    useEffect(() => {
        (async () => {
            try {
               const data = await fetchData();
               setSections(data);
            } catch (e: any) {
                console.error(e);
                setErr(e?.message ?? "Fetch error");
            } finally {
                setLoading(false);
            }
        })();
    }, [BASE_URL]);

    return (
        <Layout pageTitle="Histories">
            <h1 className="text-2xl font-bold mb-4">Histories (Per Tanggal)</h1>

            {loading && <p className="text-sm text-gray-400">Loading…</p>}
            {err && <p className="text-sm text-red-400">Error: {err}</p>}

            {!loading && !err && sections.length === 0 && (
                <p className="text-sm text-gray-400">Belum ada data.</p>
            )}

            <div className="space-y-4">
                {sections.map((sec) => (
                    <section key={sec.date} className="rounded-xl border border-slate-700 p-4">
                        {/* Header ringkasan per hari */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {sec.date} {/* sudah lokal Jakarta dari backend */}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {sec.items.length} records
                                </p>
                            </div>
                            <p className="text-sm text-slate-300">
                                {dayjs(sec.items[0].time).format("dddd, D MMMM YYYY")}
                            </p>  
                        </div>

                        {/* Daftar item per hari */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sec.items.map((it) => (
                                <div key={it.id} className="rounded-lg border border-slate-700 p-3">
                                    <p className="text-sm font-medium">
                                        {dayjs(it.time).format("HH:mm:ss")}
                                    </p>
                                    <div className="mt-1 text-xs text-slate-300 space-y-0.5">
                                        <p>TMP: <b>{it.temperature.toFixed(2)}°C</b></p>
                                        <p>HUM: <b>{it.humidity.toFixed(2)}%</b></p>
                                        <p>ST : <b>{it.soilTemperature.toFixed(2)}°C</b></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </Layout>
    );
}
