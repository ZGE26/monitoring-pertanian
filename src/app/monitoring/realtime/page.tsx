'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import type { ApexOptions } from 'apexcharts';

import Layout from '@/components/layouts/app';
import ItemSensor from '@/components/ItemSensor';

import { WiHumidity } from "react-icons/wi";
import { FaTemperatureLow } from "react-icons/fa";
import { LuLandPlot } from "react-icons/lu";

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ---- Types ----
interface SensorData {
    temperature: number;
    humidity: number;
    soilTemperature: number;
    soilMoisture?: number;
    time: string;
}
type XY = [number, number];

type ChartState = {
    series: { name: string; data: XY[] }[];
    options: ApexOptions;
};

export default function RealtimePage() {
    const [lastData, setLastData] = useState<SensorData | null>(null);

    const [chartData, setChartData] = useState<ChartState>({
        series: [{ name: 'Temperature', data: [] },
        { name: 'Humidity', data: [] }],
        options: {
            theme: { mode: 'dark' },
            chart: {
                id: 'realtime',
                type: 'line',
                height: 350,
                animations: { enabled: true },
                toolbar: {
                    show: true,
                    tools: {
                        download: false,
                        selection: false,
                        zoom: true,
                        zoomin: false,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
                events: {
                    zoomed: (_ctx, { xaxis }) => {
                        zoomRangeRef.current = { min: xaxis.min, max: xaxis.max };
                    },
                    beforeResetZoom: () => {
                        zoomRangeRef.current = { min: undefined, max: undefined };
                    },
                },
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    style: { colors: '#eee', fontSize: '12px' },
                },
            },
            yaxis: [
                {
                    title: { text: 'Temperature (°C)', style: { color: '#eee' } },
                    min: 0, max: 70,
                    labels: { style: { colors: '#eee', fontSize: '12px' } },
                },
                {
                    opposite: true,
                    title: { text: 'Humidity (%)', style: { color: '#eee' } },
                    min: 0, max: 100,
                    labels: { style: { colors: '#eee', fontSize: '12px' } },
                },
            ],
            colors: ['#00E396', '#008FFB'],
            tooltip: {
                x: { format: 'dd/MM/yy HH:mm' },
                theme: 'dark',
                style: { fontSize: '12px', fontFamily: 'Arial, sans-serif' },
            },
            stroke: { curve: 'smooth' },
            title: { text: 'Temperature Over Time', align: 'left', style: { color: '#eee' } },
            dataLabels: { enabled: false },
            markers: { size: 0 },
            grid: { padding: { right: 30, left: 20 }, borderColor: '#444' },
        },
    });

    // simpan rentang zoom terakhir
    const zoomRangeRef = useRef<{ min?: number; max?: number }>({});

    useEffect(() => {
        const socket: Socket = io('http://localhost:5000', { transports: ['websocket'] });

        // minta snapshot awal (hari ini)
        socket.emit('getLatestData');

        // SNAPSHOT AWAL (array)
        const onLatestData = (arr: SensorData[]) => {
            if (!Array.isArray(arr) || arr.length === 0) return;

            const tempPts: XY[] = arr.map((item) => [
                new Date(item.time).getTime(),
                Number(item.temperature),
            ]);

            const humPts: XY[] = arr.map((item) => [
                new Date(item.time).getTime(),
                Number(item.humidity),
            ]);

            setLastData(arr[arr.length - 1]);

            setChartData((prev) => ({
                ...prev,
                series: [
                    { ...prev.series[0], data: tempPts },
                    { ...prev.series[1], data: humPts },
                ],
            }));
        };

        // UPDATE REALTIME (satu objek)
        const onRealtime = (item: SensorData) => {
            if (!item || typeof item !== 'object') return;

            setLastData(item);

            setChartData((prev) => {
                const x = new Date(item.time).getTime();
                const tempPoin: XY = [x, Number(item.temperature)];
                const humPoin: XY = [x, Number(item.humidity)];

                const keepZoom =
                    zoomRangeRef.current.min !== undefined && zoomRangeRef.current.max !== undefined;

                const nextOptions: ApexOptions = {
                    ...prev.options,
                    xaxis: {
                        ...(prev.options.xaxis || {}),
                        min: keepZoom ? zoomRangeRef.current.min : undefined,
                        max: keepZoom ? zoomRangeRef.current.max : undefined,
                        type: 'datetime',
                    },
                };

                return {
                    ...prev,
                    series: [
                        { ...prev.series[0], data: [...prev.series[0].data, tempPoin] },
                        { ...prev.series[1], data: [...prev.series[1].data, humPoin] },
                    ],
                    options: nextOptions,
                };
            });
        };

        socket.on('latestData', onLatestData);
        socket.on('sensorData', onRealtime);

        return () => {
            socket.off('latestData', onLatestData);
            socket.off('sensorData', onRealtime);
            socket.disconnect();
        };
    }, []);

    return (
        <Layout pageTitle="Realtime Monitoring">
            <div className="w-full min-h-screen flex text-white flex-col gap-4">
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {lastData ? (
                        <>
                            <ItemSensor
                                name="Temperature"
                                value={lastData.temperature}
                                unit="°C"
                                icon={<FaTemperatureLow className="text-2xl" />}
                            />
                            <ItemSensor
                                name="Humidity"
                                value={lastData.humidity}
                                unit="%"
                                icon={<WiHumidity className="text-2xl" />}
                            />
                            <ItemSensor
                                name="Soil Temperature"
                                value={lastData.soilTemperature}
                                unit="°C"
                                icon={<LuLandPlot className="text-2xl" />}
                            />
                        </>
                    ) : (

                        <>
                            <ItemSensor name="Temperature" value="—" unit="°C" />
                            <ItemSensor name="Humidity" value="—" unit="%" />
                            <ItemSensor name="Soil Temperature" value="—" unit="°C" />
                        </> 
                    )}
                        
                </div>
                <div className="w-full flex items-center justify-center shadow-lg bg-[#32363E] rounded-lg p-4">
                    <div className="w-full h-96 p-2">
                        {chartData.series[0].data.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-gray-400">No data available</p>
                            </div>
                        ) : (
                            <ReactApexChart
                                options={chartData.options}
                                series={chartData.series}
                                type="line"
                                height={350}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
