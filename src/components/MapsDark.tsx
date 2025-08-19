"use client";

import React from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import { GrPowerReset } from "react-icons/gr";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import mapsRaw from "../app/monitoring/maps/maps.json";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

// MapLibre (vector) — penting: CSS & plugin
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

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

const styleFn = (
    feature?: GeoJSON.Feature<Geometry, PropsFeatureProps>
): L.PathOptions => ({
    color: feature?.properties?.["stroke"] || "#fbc02d",
    weight: feature?.properties?.["stroke-width"] || 2,
    opacity: feature?.properties?.["stroke-opacity"] ?? 1,
    fillColor: feature?.properties?.["fill"] || "#f57c00",
    fillOpacity: feature?.properties?.["fill-opacity"] ?? 0.25,
});

// 🗺️ Basemap: CARTO Dark Matter via MapLibre-GL
function CartoDarkMatterLayer({
    withLabels = true,
}: {
    withLabels?: boolean;
}) {
    const map = useMap();

    React.useEffect(() => {
        const styleUrl = withLabels
            ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            : "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

        const gl = (L as any)
            .maplibreGL({
                style: styleUrl,
                interactive: false,
                attribution:
                    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © CARTO',
            })
            .addTo(map);

        return () => {
            gl?.remove();
        };
    }, [map, withLabels]);

    return null;
}

// 🔄 Tombol reset view (fitBounds kalau ada; fallback ke center+zoom)
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

            btn.innerHTML = renderToStaticMarkup(<GrPowerReset size={18} />);;

            const svg = btn.querySelector("svg");

            if(svg) {
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

export default function MapDark(_: Props) {
    const bounds = React.useMemo(() => {
        const gj = L.geoJSON(maps as any);
        const b = gj.getBounds();
        return b.isValid() ? b : undefined;
    }, []);

    return (
        <MapContainer
            key="dark-container"
            bounds={bounds}
            center={INITIAL_CENTER}
            zoom={INITIAL_ZOOM}
            minZoom={1}
            maxZoom={22}
            scrollWheelZoom
            style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        >
            {/* 🔻 Basemap vektor (Dark Matter). Hapus TileLayer raster */}
            <CartoDarkMatterLayer withLabels />

            {/* Overlay GeoJSON + label permanen aman */}
            <GeoJSON
                data={maps}
                style={styleFn}
                onEachFeature={(feature, layer) => {
                    const name = feature?.properties?.name || "Area";
                    layer.bindTooltip(name, {
                        permanent: true,
                        direction: "center",
                        className: "polygon-label",
                    });

                    // Tunggu layer mounted supaya pane/DOM siap (hindari appendChild undefined)
                    layer.once("add", () => {
                        const center = (layer as any).getBounds?.().getCenter?.();
                        if (center && layer.getTooltip()) {
                            layer.getTooltip()!.setLatLng(center);
                            (layer.getTooltip() as any)._updatePosition?.();
                        }
                    });
                }}
            />

            {/* Tombol reset */}
            <ResetViewControl
                bounds={bounds}
                center={INITIAL_CENTER}
                zoom={INITIAL_ZOOM}
            />
        </MapContainer>
    );
}
