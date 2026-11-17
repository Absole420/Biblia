"""Erzeugt künstlerisch eingefärbte Reliefkarten (Ebene 1+2 des Living Atlas) aus echten Höhendaten.

Quelle Höhenmodell: AWS Terrain Tiles (Terrarium, u. a. SRTM, GMTED, ETOPO1 – frei nutzbar, Attribution
"Mapzen / AWS Open Data Terrain Tiles"). Küstenlinie: Natural Earth (gemeinfrei) aus frontend/src/data/geo.json.
Projektion identisch mit projectGeo() in themeMaps.ts.
Aufruf: python scripts/gen_relief.py overview gospels …   (ohne Argumente: alle Karten)
"""
import io
import json
import math
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "assets" / "images" / "relief"
CACHE = Path("/tmp/terrarium")
GEO = json.loads((ROOT / "frontend" / "src" / "data" / "geo.json").read_text())
SRC = (ROOT / "frontend" / "src" / "data" / "themeMaps.ts").read_text()
MAX_PX = 2.6e6  # Pixelbudget je Karte (schwächere Geräte)


def maps():
    out = {}
    for m in re.finditer(r"\n  ([a-z0-9-]+): \{\n    id: \"[^\"]+\",[\s\S]*?bounds: \{ latMin: ([\d.]+), latMax: ([\d.]+), lonMin: ([\d.]+), lonMax: ([\d.]+) \},\n    pxPerDeg: (\d+)", SRC):
        out[m.group(1)] = dict(latMin=float(m.group(2)), latMax=float(m.group(3)), lonMin=float(m.group(4)), lonMax=float(m.group(5)), ppd=float(m.group(6)))
    return out


def tile(z, x, y):
    CACHE.mkdir(exist_ok=True)
    f = CACHE / f"{z}_{x}_{y}.png"
    if not f.exists():
        data = urllib.request.urlopen(f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", timeout=30).read()
        f.write_bytes(data)
    a = np.asarray(Image.open(f).convert("RGB"), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def merc(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - np.log(np.tan(np.radians(lat)) + 1 / np.cos(np.radians(lat))) / math.pi) / 2 * n
    return x, y


def noise(h, w, seed, scales=(6, 18, 60, 180)):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    for i, s in enumerate(scales):
        g = rng.random((max(2, h // s + 2), max(2, w // s + 2))).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += (np.asarray(im, np.float32) / 255 - 0.5) / (i + 1)
    return acc


def blur(a, r):
    """Weichzeichnen eines Float-Arrays (dreifacher Boxfilter ≈ Gauß)."""
    r = max(1, int(round(r)))
    for _ in range(3):
        for ax in (0, 1):
            c = np.cumsum(np.pad(a, [(r + 1, r) if i == ax else (0, 0) for i in range(2)], mode="edge"), axis=ax)
            a = (np.take(c, range(2 * r + 1, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - 2 * r - 1), axis=ax)) / (2 * r + 1)
    return a


def mix(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return a * (1 - t) + b * t


def C(hexs):
    return np.array([int(hexs[i:i + 2], 16) for i in (1, 3, 5)], np.float32)


def render(mid, b):
    kx = math.cos(math.radians((b["latMin"] + b["latMax"]) / 2))
    W = round((b["lonMax"] - b["lonMin"]) * b["ppd"] * kx)
    H = round((b["latMax"] - b["latMin"]) * b["ppd"])
    s = min(1.0, math.sqrt(MAX_PX / (W * H)))
    w, h = round(W * s), round(H * s)
    ppd = b["ppd"] * s
    z = int(min(9, max(5, math.ceil(math.log2(360 * ppd / 256)))))
    lon = b["lonMin"] + (np.arange(w) + 0.5) / (ppd * kx)
    lat = b["latMax"] - (np.arange(h) + 0.5) / ppd
    LON, LAT = np.meshgrid(lon, lat)
    mx, my = merc(LAT, LON, z)
    tx0, tx1 = int(mx.min()), int(mx.max())
    ty0, ty1 = int(my.min()), int(my.max())
    jobs = [(z, x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(12) as ex:
        tiles = list(ex.map(lambda j: tile(*j), jobs))
    mosaic = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for (zz, x, y), t in zip(jobs, tiles):
        mosaic[(y - ty0) * 256:(y - ty0 + 1) * 256, (x - tx0) * 256:(x - tx0 + 1) * 256] = t
    px = np.clip((mx - tx0) * 256, 0, mosaic.shape[1] - 2)
    py = np.clip((my - ty0) * 256, 0, mosaic.shape[0] - 2)
    x0, y0 = px.astype(int), py.astype(int)
    fx, fy = px - x0, py - y0
    E = (mosaic[y0, x0] * (1 - fx) * (1 - fy) + mosaic[y0, x0 + 1] * fx * (1 - fy) + mosaic[y0 + 1, x0] * (1 - fx) * fy + mosaic[y0 + 1, x0 + 1] * fx * fy)

    # Landmaske aus Natural Earth (gleiche Küste wie die SVG-Ebene)
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    for ring in GEO["land"]:
        pts = [((lo - b["lonMin"]) * ppd * kx, (b["latMax"] - la) * ppd) for lo, la in ring]
        if any(-50 < x < w + 50 and -50 < y < h + 50 for x, y in pts):
            d.polygon(pts, fill=255)
    land = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255

    # Schummerung (Licht aus Nordwesten), überhöht und weichgezeichnet für den Malstil
    m_per_px = 111000 / ppd
    Es = blur(E, 1.6 + 0.8 / max(s, 0.3))
    gy, gx = np.gradient(Es, m_per_px)
    ex_ = 2.4 if b["ppd"] > 200 else 5.0
    slope = np.arctan(ex_ * np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(42)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    shade = np.clip(shade, 0, 1)
    flat = math.sin(alt)
    rel = shade - flat  # >0 beleuchtet, <0 Schatten

    n1 = noise(h, w, hash(mid) % 999)
    n2 = noise(h, w, hash(mid) % 777 + 5, (3, 9, 27))

    # Feuchte-/Vegetationsheuristik (Levante: Norden und Küste grün, Süden/Osten Wüste)
    wet = 1 / (1 + np.exp(-(LAT - 31.55) * 2.6))
    wet *= 1 - 1 / (1 + np.exp(-(LON - (35.75 + (LAT - 32) * 0.25)) * 5)) * (LAT < 36.5)
    wet = np.where(LAT > 36, np.maximum(wet, 0.55), wet)  # Anatolien, Griechenland, Italien
    wet = np.where((LON > 38.5) & (LAT < 35.5), wet * 0.25, wet)  # Mesopotamien / Arabien
    wet = np.where((LON < 33.9) & (LAT < 31.4), wet * 0.3, wet)  # Ägypten / Sinai
    wet *= np.clip((E + 150) / 250, 0, 1)  # Grabenbruch trocken
    wet = np.clip(wet + n1 * 0.35, 0, 1)

    sand, ochre, gold = C("#E8D3A0"), C("#D6AE6A"), C("#E2C27C")
    olive, dgreen = C("#9AA460"), C("#6E7A3E")
    stone, rock, peak = C("#C9A877"), C("#A98660"), C("#EFE2C2")
    col = mix(sand, ochre, 0.35 + n1 * 0.8)
    col = mix(col, gold, np.clip(n2 * 1.2, 0, 1) * 0.35)
    col = mix(col, olive, wet * 0.85)
    col = mix(col, dgreen, np.clip((wet - 0.55) * 2.2 + n2 * 0.6, 0, 1) * 0.7)
    col = mix(col, stone, np.clip(slope * 2.2, 0, 1) * 0.5)
    col = mix(col, rock, np.clip((slope - 0.35) * 2.5, 0, 1) * 0.55)
    col = mix(col, peak, np.clip((E - 1600) / 900, 0, 1) * 0.8)
    col *= (1 + rel[..., None] * 0.8)
    col += np.clip(rel, 0, None)[..., None] * C("#3A2A10") * 0.35  # warmes Streiflicht
    col *= (1 + n2[..., None] * 0.08)

    # Meer: Tiefe aus Bathymetrie, sanfte Wellenstruktur
    depth = np.clip(-E / 1800, 0, 1)
    shallow, mid_, deep = C("#5DB7AE"), C("#2F8C92"), C("#174F5E")
    sea = mix(shallow, mid_, np.clip(depth * 3, 0, 1))
    sea = mix(sea, deep, np.clip(depth * 1.3 - 0.2, 0, 1))
    waves = np.sin((LAT * 900 + n1 * 18 + LON * 140)) * 0.5 + 0.5
    sea *= (1 + (waves[..., None] ** 8) * 0.06 + n2[..., None] * 0.05)
    dist = np.asarray(mask.filter(ImageFilter.GaussianBlur(10)), np.float32) / 255
    sea = mix(sea, C("#8FD3C4"), np.clip(dist * 1.8, 0, 1) * 0.45 * (1 - land))

    img = mix(sea, col, land)
    img = np.clip(img, 0, 255).astype(np.uint8)
    OUT.mkdir(parents=True, exist_ok=True)
    f = OUT / f"{mid}.jpg"
    Image.fromarray(img).save(f, "JPEG", quality=80, optimize=True, progressive=True)
    print("ok", mid, w, h, f.stat().st_size // 1024, "KB", flush=True)


if __name__ == "__main__":
    all_maps = maps()
    for mid in sys.argv[1:] or [m for m in all_maps if m != "journey"]:
        render(mid, all_maps[mid])
