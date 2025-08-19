"use client";

import React from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import mapsRaw from "../app/monitoring/maps/maps.json";
import "leaflet/dist/leaflet.css";
import { GrPowerReset } from "react-icons/gr";
import { renderToStaticMarkup } from "react-dom/server";

const INITIAL_CENTER: L.LatLngExpression = [-6.96969, 107.6298];
const INITIAL_ZOOM = 20;

type Props = {};
type PropsFeatureProps = {
    stroke?: string;
    "stroke-width"?: number;
    "stroke-opacity"?: number;
    fill?: string;
    "fill-opacity"?: number;
    [k: string]: any;
};

const maps = mapsRaw as FeatureCollection<Geometry, PropsFeatureProps>;

const styleFn = (feature?: GeoJSON.Feature<Geometry, PropsFeatureProps>): L.PathOptions => ({
    color: feature?.properties?.["stroke"] || "#fbc02d",
    weight: feature?.properties?.["stroke-width"] || 2,
    opacity: feature?.properties?.["stroke-opacity"] ?? 1,
    fillColor: feature?.properties?.["fill"] || "#f57c00",
    fillOpacity: feature?.properties?.["fill-opacity"] ?? 0.25,
});

function ResetViewControl({
    bounds,
    center,
    zoom,
}: {
    bounds?: L.LatLngBoundsExpression;
    center: L.LatLngExpression;
    zoom: number;
}) {
    const map = useMap();

    React.useEffect(() => {
        const ctrl = new L.Control({ position: "topleft" });
        ctrl.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar");
            const btn = L.DomUtil.create("a", "", container);


            btn.href = "#";
            btn.title = "Reset view";

            Object.assign(btn.style, {
                width: "32px",
                height: "32px",
                display: "grid",
                placeItems: "center",
                padding: "0",
                lineHeight: "0",
                textAlign: "center",
            });

            btn.innerHTML = renderToStaticMarkup(<GrPowerReset size={18} />);

            const svg = btn.querySelector("svg");

            if (svg) {
                svg.style.display = "block";
                svg.style.pointerEvents = "none";
            }

            L.DomEvent.on(btn, "click", (e) => {
                L.DomEvent.stop(e);
                if (bounds) {
                    map.fitBounds(bounds, { padding: [16, 16] });
                } else {
                    map.setView(center, zoom, { animate: true });
                }
            });
            return container;
        };
        ctrl.addTo(map);
        return () => {
            ctrl.remove();
        };
    }, [map, bounds, center, zoom]);

    return null;
}


export default function Map(_: Props) {

    const bounds = React.useMemo(() => {
        const gj = L.geoJSON(maps as any);
        const b = gj.getBounds();
        return b.isValid() ? b : undefined;
    }, []);
    return (
        <MapContainer
            key="light-container"
            bounds={bounds}
            center={INITIAL_CENTER}
            minZoom={3}
            maxZoom={22}
            zoom={INITIAL_ZOOM}
            scrollWheelZoom
            style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={22}
            />

            {/* ✅ pakai FeatureCollection utuh */}
            <GeoJSON
                data={maps}
                style={styleFn}
                onEachFeature={(feature, layer) => {
                    const name = feature?.properties?.name || "Area";
                    layer.bindTooltip(name, { permanent: true, direction: "center", className: "polygon-label" });


                    layer.once("add", () => {
                        const center = (layer as any).getBounds?.().getCenter?.();
                        if (center && layer.getTooltip()) {
                            layer.getTooltip()!.setLatLng(center);
                            (layer.getTooltip() as any)._updatePosition?.();
                        }
                    });
                }}
            />
            <ResetViewControl bounds={bounds} center={INITIAL_CENTER} zoom={INITIAL_ZOOM} />

        </MapContainer>
    );
}