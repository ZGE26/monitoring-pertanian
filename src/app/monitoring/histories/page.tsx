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

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string; code: 'NETWORK' | 'HTTP' | 'PARSER' | 'TIMEOUT' };

const BASE_URL = "http://localhost:5000";

async function safeFetchJson<T>(url: string, init?: RequestInit): Promise<Ok<T> | Err> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(url, {
            ...init,
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(t);

        if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, code: 'HTTP' };

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            return { ok: false, error: `Unexpected content-type: ${ct}`, code: 'PARSER' };
        }

        const data = await res.json();
        return { ok: true, data };
    } catch (e: any) {
        clearTimeout(t);
        if (e?.name === 'AbortError') return { ok: false, error: 'Request timeout', code: 'TIMEOUT' };
        return { ok: false, error: 'API unreachable', code: 'NETWORK' };
    }
}

export default function Page() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setErr(null);

            const r = await safeFetchJson<Section[]>(`${BASE_URL}/all/date-grouped`, {
                method: 'GET',
            });

            if (!mounted) return;

            if (!r.ok) {
                setSections([]);
                setErr(r.error);
            } else {
                // pastikan array
                setSections(Array.isArray(r.data) ? r.data : []);
            }

            setLoading(false);
        })();

        return () => { mounted = false; };
    }, []);

    return (
        <Layout pageTitle="Histories">
            <h1 className="text-2xl font-bold mb-4">Histories (Per Tanggal)</h1>

            {loading && <p className="text-sm text-gray-400">Loading…</p>}

            {!loading && err && (
                <div className="text-sm text-red-400">
                    Error: {err} {err === 'API unreachable' && '(Backend kemungkinan mati)'}
                </div>
            )}

            {!loading && !err && sections.length === 0 && (
                <p className="text-sm text-gray-400">Belum ada data.</p>
            )}

            {!loading && !err && sections.length > 0 && (
                <div className="space-y-4">
                    {sections.map((sec) => {
                        const first = sec.items?.[0];
                        return (
                            <section key={sec.date} className="rounded-xl border border-slate-700 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold">{sec.date}</h2>
                                        <p className="text-xs text-slate-400">{sec.items?.length ?? 0} records</p>
                                    </div>

                                    <p className="text-sm text-slate-300">
                                        {first ? dayjs(first.time).format("dddd, D MMMM YYYY") : "-"}
                                    </p>
                                </div>

                                {/* Daftar item per hari */}
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sec.items?.map((it) => (
                                        <div key={it.id} className="rounded-lg border border-slate-700 p-3">
                                            <p className="text-sm font-medium">
                                                {dayjs(it.time).format("HH:mm:ss")}
                                            </p>
                                            <div className="mt-1 text-xs text-slate-300 space-y-0.5">
                                                <p>TMP: <b>{Number.isFinite(it.temperature) ? it.temperature.toFixed(2) : '-'}°C</b></p>
                                                <p>HUM: <b>{Number.isFinite(it.humidity) ? it.humidity.toFixed(2) : '-'}%</b></p>
                                                <p>ST : <b>{Number.isFinite(it.soilTemperature) ? it.soilTemperature.toFixed(2) : '-'}°C</b></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
