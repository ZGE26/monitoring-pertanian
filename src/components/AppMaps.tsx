"use client";

import React from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import mapsRaw from "../app/monitoring/maps/maps.json";
import "leaflet/dist/leaflet.css";

import { GrPowerReset } from "react-icons/gr";
import { renderToStaticMarkup } from "react-dom/server";

// Vector basemap (untuk preset "dark")
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";


type Preset = "light" | "dark";

type PropsFeatureProps = {
    stroke?: string;
    "stroke-width"?: number;
    "stroke-opacity"?: number;
    fill?: string;
    "fill-opacity"?: number;
    name?: string;
    [k: string]: any;
};

type AppMapsProps = {
    preset?: Preset;
    data?: FeatureCollection<Geometry, PropsFeatureProps>;
    center?: L.LatLngExpression;
    zoom?: number;
    className?: string;
    minZoom?: number;
    maxZoom?: number;
    darkWhiteLabels?: boolean;
    darkWithLabels?: boolean;
};

const DEFAULT_CENTER: L.LatLngExpression = [-6.969675, 107.62975];
const DEFAULT_ZOOM = 21;

const styleFn = (
  feature?: GeoJSON.Feature<Geometry, PropsFeatureProps>
): L.PathOptions => ({
  color: feature?.properties?.["stroke"] || "#fbc02d",
  weight: feature?.properties?.["stroke-width"] || 2,
  opacity: feature?.properties?.["stroke-opacity"] ?? 1,
  fillColor: feature?.properties?.["fill"] || "#f57c00",
  fillOpacity: feature?.properties?.["fill-opacity"] ?? 0.25,
});

function VectorDarkBase({ withLabels = true }: { withLabels?: boolean }) {
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

    return () => gl?.remove();
  }, [map, withLabels]);

  return null;
}

// ——— Tombol Reset View ———
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
  const addedRef = React.useRef(false);

  React.useEffect(() => {
    if (addedRef.current) return; // cegah double add di StrictMode
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
        (svg as SVGSVGElement).style.display = "block";
        (svg as SVGSVGElement).style.pointerEvents = "none";
      }

      L.DomEvent.disableClickPropagation(container);
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
    addedRef.current = true;
    return () => {
      ctrl.remove();
      addedRef.current = false;
    };
  }, [map, bounds, center, zoom]);

  return null;
}

// ——— Komponen Utama ———
export default function AppMap({
  preset = "light",
  data = mapsRaw as FeatureCollection<Geometry, PropsFeatureProps>,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "w-full h-full",
  minZoom = 3,
  maxZoom = 22,
  darkWithLabels = true,
}: AppMapsProps) {
  // Hitung bounds dari GeoJSON (kalau valid)
  const bounds = React.useMemo(() => {
    try {
      const gj = L.geoJSON(data as any);
      const b = gj.getBounds();
      return b.isValid() ? b : undefined;
    } catch {
      return undefined;
    }
  }, [data]);

  return (
    <div className={className}>
      <MapContainer
        key={`map-${preset}`}
        bounds={bounds}
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        {preset === "dark" ? (
          <VectorDarkBase withLabels={darkWithLabels} />
        ) : (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={maxZoom}
          />
        )}

        <GeoJSON
          data={data}
          style={styleFn}
          onEachFeature={(feature, layer) => {
            const name = feature?.properties?.name || "Area";
            layer.bindTooltip(name, {
              permanent: true,
              direction: "center",
              className: "polygon-label",
            });

            // posisikan tooltip ke pusat polygon setelah layer siap
            layer.once("add", () => {
              const c = (layer as any).getBounds?.().getCenter?.();
              if (c && layer.getTooltip()) {
                layer.getTooltip()!.setLatLng(c);
                (layer.getTooltip() as any)._updatePosition?.();
              }
            });
          }}
        />

        <ResetViewControl bounds={bounds} center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
}