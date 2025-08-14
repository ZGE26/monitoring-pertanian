// src/lib/green-analyzer.ts
export type BinSpec = {
  name: string;
  h: [number, number]; // 0–360
  s: [number, number]; // 0–1
  v: [number, number]; // 0–1
  swatchHex?: string;  // warna default saat belum ada sampel
};

export type CategoryOut = {
  name: string;
  count: number;
  pct: number;
  sampleHex: string;
};

export type AnalyzeOptions = {
  stepTargetPixels?: number;
  bins?: BinSpec[];
  useVegetationMask?: boolean;
};

export type AnalyzeResult = {
  width: number;
  height: number;
  sampledPixels: number;
  categories: CategoryOut[];
};

export const DEFAULT_BINS: BinSpec[] = [
  { name: "Hijau sehat",      h: [80, 140], s: [0.35, 1.0], v: [0.45, 1.0], swatchHex: "#2ecc71" },
  { name: "Hijau pucat",      h: [80, 140], s: [0.15, 0.35], v: [0.60, 1.0], swatchHex: "#a3e4a6" },
  { name: "Hijau kekuningan", h: [60,  85], s: [0.25, 1.0],  v: [0.45, 1.0], swatchHex: "#cddc39" },
  { name: "Hijau kebiruan",   h: [140,170], s: [0.25, 1.0],  v: [0.45, 1.0], swatchHex: "#1abc9c" },
  { name: "Hijau gelap",      h: [80, 140], s: [0.35, 1.0],  v: [0.20, 0.45], swatchHex: "#145a32" },
];

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = 60 * (((g - b) / d) % 6); break;
      case g: h = 60 * (((b - r) / d) + 2); break;
      case b: h = 60 * (((r - g) / d) + 4); break;
    }
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

const inRange = (v: number, [mn, mx]: [number, number]) => v >= mn && v <= mx;
const toHex = (v: number) => v.toString(16).padStart(2, "0");
export const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

export function isVegetationHSV(h: number, s: number, v: number) {
  return (h >= 60 && h <= 170) && s >= 0.15 && v >= 0.25;
}

// 🔹 hasil kosong (0%) agar UI stabil
export function emptyCategoriesFromBins(bins: BinSpec[] = DEFAULT_BINS): CategoryOut[] {
  return bins.map(b => ({
    name: b.name,
    count: 0,
    pct: 0,
    sampleHex: b.swatchHex ?? "#cccccc",
  }));
}

export async function analyzeGreenBinsFromImage(
  imgEl: HTMLImageElement,
  opts: AnalyzeOptions = {}
): Promise<AnalyzeResult> {
  const {
    stepTargetPixels = 200_000,
    bins = DEFAULT_BINS,
    useVegetationMask = true,
  } = opts;

  if (!imgEl.complete) await imgEl.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  canvas.width = imgEl.naturalWidth;
  canvas.height = imgEl.naturalHeight;
  ctx.drawImage(imgEl, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / Math.max(50_000, stepTargetPixels))));

  const binsAgg = bins.map(b => ({ name: b.name, count: 0, r: 0, g: 0, b: 0 }));
  let considered = 0;

  for (let y = 0; y < height; y += step) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x += step) {
      const i = rowStart + x * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;

      const [h, s, v] = rgbToHsv(r, g, b);
      if (useVegetationMask && !isVegetationHSV(h, s, v)) continue;

      for (let bi = 0; bi < bins.length; bi++) {
        const spec = bins[bi];
        if (inRange(h, spec.h) && inRange(s, spec.s) && inRange(v, spec.v)) {
          const agg = binsAgg[bi];
          agg.count++; agg.r += r; agg.g += g; agg.b += b;
          considered++;
          break;
        }
      }
    }
  }

  const total = binsAgg.reduce((s, b) => s + b.count, 0) || 1;

  // ⚠️ Tidak di-sort: urutan = urutan bins
  const categories: CategoryOut[] = binsAgg.map((b, idx) => {
    const meanR = b.count ? Math.round(b.r / b.count) : 0;
    const meanG = b.count ? Math.round(b.g / b.count) : 0;
    const meanB = b.count ? Math.round(b.b / b.count) : 0;
    return {
      name: b.name,
      count: b.count,
      pct: +(100 * b.count / total).toFixed(2),
      sampleHex: b.count ? rgbToHex(meanR, meanG, meanB) : (bins[idx].swatchHex ?? "#cccccc"),
    };
  });

  return { width, height, sampledPixels: considered, categories };
}

export function toCsv(rows: CategoryOut[]): string {
  const header = "Kategori,Persen,Count,SampleHex";
  const body = rows.map(r => `${r.name},${r.pct},${r.count},${r.sampleHex}`).join("\n");
  return `${header}\n${body}\n`;
}
