# Iteration 41: static WCAG contrast check of theme token pairs (light + dark)
import re

src = open("/app/frontend/src/theme.ts").read()

def parse(block):
    return dict(re.findall(r'(\w+):\s*"(#[0-9A-Fa-f]{6})"', block))

light = parse(src.split("const light = {")[1].split("};")[0])
dark = parse(src.split("const dark: ThemeColors = {")[1].split("};")[0])

def lum(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

PAIRS = [
    ("onSurface", "surface", 4.5), ("onSurface", "surfaceSecondary", 4.5), ("onSurface", "surfaceTertiary", 4.5),
    ("onSurfaceSecondary", "surfaceSecondary", 4.5), ("onSurfaceTertiary", "surfaceTertiary", 4.5),
    ("muted", "surface", 4.5), ("muted", "surfaceSecondary", 4.5), ("muted", "surfaceTertiary", 4.5),
    ("onBrandPrimary", "brandPrimary", 4.5), ("onBrandSecondary", "brandSecondary", 4.5), ("onBrandTertiary", "brandTertiary", 4.5),
    ("brandPrimary", "surface", 4.5), ("brandPrimary", "surfaceSecondary", 4.5), ("brandPrimary", "surfaceTertiary", 4.5), ("brandPrimary", "brandTertiary", 4.5),
    ("brandSecondary", "surface", 4.5), ("brandSecondary", "surfaceSecondary", 4.5),
    ("onSuccess", "success", 4.5), ("onWarning", "warning", 4.5), ("onError", "error", 4.5), ("onInfo", "info", 4.5),
    ("error", "surface", 4.5), ("success", "surface", 4.5), ("info", "surface", 4.5), ("warning", "surface", 3.0),
    ("stationExam", "surface", 3.0), ("stationNarrative", "surface", 3.0), ("stationStudy", "surface", 3.0),
    ("border", "surface", 3.0), ("border", "surfaceSecondary", 3.0), ("borderStrong", "surface", 3.0), ("borderStrong", "surfaceSecondary", 3.0),
    ("brandPrimary", "surfaceTertiary", 3.0),
    ("onSurfaceInverse", "surfaceInverse", 4.5),
]

for name, t in (("LIGHT", light), ("DARK", dark)):
    print(f"==== {name}")
    for fg, bg, need in PAIRS:
        v = cr(t[fg], t[bg])
        print(f"{'OK  ' if v >= need else 'FAIL'} {fg:18} {t[fg]} on {bg:18} {t[bg]}: {v:5.2f} (need {need})")

# Hard-coded pairs
print("==== HARDCODED")
for fg, bg, label in [("#101A1C", "#C29A63", "profile level text on gold start"), ("#101A1C", "#D97736", "profile level text on stationNarrative end"),
                      ("#F6F1E7", "#C29A63", "xpFill vs gold"), ("#101A1C", "#F6F1E7", "levelNum on badge (~)")]:
    print(f"{label}: {fg} on {bg}: {cr(fg, bg):.2f}")
