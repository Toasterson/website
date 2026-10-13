#!/usr/bin/env python3
# Generates the site's phoenix motifs as SVG: src/assets/phoenix-hero.svg and
# src/assets/phoenix-mark.svg. The bird is built from tapered "feather"
# strokes along cubic Bézier centre-lines, so it is an original, abstract
# figure (no raster, no traced artwork). Run `python3 scripts/phoenix.py`
# after changing anything here; the SVGs are committed.
#
# This file is part of the oida.foundation website and is licensed under the
# Mozilla Public License 2.0, like the rest of the site.

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'assets'

# The phoenix palette: deep red, flame orange, ember gold.
RED = '#b8321c'
FLAME = '#e8601e'
ORANGE = '#f28a2a'
EMBER = '#f5b640'


@dataclass
class Feather:
    p0: tuple[float, float]
    p1: tuple[float, float]
    p2: tuple[float, float]
    p3: tuple[float, float]
    width: float
    peak: float = 0.3  # where along the stroke it is widest (0 = base, 1 = tip)


def bezier(f: Feather, t: float) -> tuple[float, float]:
    u = 1 - t
    x = u**3 * f.p0[0] + 3 * u * u * t * f.p1[0] + 3 * u * t * t * f.p2[0] + t**3 * f.p3[0]
    y = u**3 * f.p0[1] + 3 * u * u * t * f.p1[1] + 3 * u * t * t * f.p2[1] + t**3 * f.p3[1]
    return x, y


def tangent(f: Feather, t: float) -> tuple[float, float]:
    u = 1 - t
    x = 3 * u * u * (f.p1[0] - f.p0[0]) + 6 * u * t * (f.p2[0] - f.p1[0]) + 3 * t * t * (f.p3[0] - f.p2[0])
    y = 3 * u * u * (f.p1[1] - f.p0[1]) + 6 * u * t * (f.p2[1] - f.p1[1]) + 3 * t * t * (f.p3[1] - f.p2[1])
    n = math.hypot(x, y) or 1
    return x / n, y / n


def profile(t: float, peak: float) -> float:
    # Rounded base, widest at `peak`, tapering to a point at the tip.
    if t <= peak:
        return math.sin((t / peak) * math.pi / 2) ** 0.8
    return math.cos(((t - peak) / (1 - peak)) * math.pi / 2) ** 1.25


def outline(f: Feather, scale: float = 1.0, shift: float = 0.0, samples: int = 22, rng: random.Random | None = None) -> str:
    left, right = [], []
    for i in range(samples + 1):
        t = i / samples
        x, y = bezier(f, t)
        tx, ty = tangent(f, t)
        nx, ny = -ty, tx
        w = f.width * scale * profile(t, f.peak) / 2
        if rng is not None and 0 < i < samples:
            w *= 1 + rng.uniform(-0.08, 0.08)
        x += nx * shift * w
        y += ny * shift * w
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    pts = left + right[::-1]
    return 'M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'


def polar(cx: float, cy: float, r: float, deg: float) -> tuple[float, float]:
    a = math.radians(deg)
    return cx + r * math.cos(a), cy - r * math.sin(a)


def lerp(a: tuple[float, float], b: tuple[float, float], s: float) -> tuple[float, float]:
    return a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s


def wing(shoulder, tip_root, inner_ang, outer_ang, inner_len, outer_len, curl, width, n, rng):
    # Feathers hang off a wing arm from the shoulder to the wrist. Inner
    # feathers are short and point up; outer primaries are long and sweep
    # outward, all curling the same way so the wing reads as one raised shape.
    out = []
    for i in range(n):
        s = i / (n - 1)
        base = lerp(shoulder, tip_root, s)
        ang = inner_ang + (outer_ang - inner_ang) * s
        length = inner_len + (outer_len - inner_len) * (s ** 0.8) + rng.uniform(-6, 6)
        c1 = polar(base[0], base[1], length * 0.38, ang + curl * 0.35)
        c2 = polar(base[0], base[1], length * 0.74, ang - curl)
        tip = polar(base[0], base[1], length, ang - curl * 1.15)
        out.append(Feather(base, c1, c2, tip, width - i * 1.6, 0.3))
    return out


def build_bird(rng: random.Random) -> list[Feather]:
    feathers: list[Feather] = []

    # Body: a rising flame, broad at the breast, narrowing toward the neck.
    feathers.append(Feather((334, 490), (322, 428), (318, 360), (326, 300), 70, 0.5))
    # Neck curving up and to the left, then the head with the beak as its tip.
    feathers.append(Feather((326, 326), (324, 270), (300, 232), (278, 206), 34, 0.18))
    feathers.append(Feather((290, 218), (278, 200), (256, 190), (222, 194), 40, 0.42))
    # Crest sweeping back from the head.
    for ang, length, w in ((74, 58, 11), (56, 76, 12), (40, 66, 10)):
        base = (288, 206)
        c1 = polar(base[0], base[1], length * 0.4, ang + 10)
        c2 = polar(base[0], base[1], length * 0.78, ang - 8)
        tip = polar(base[0], base[1], length, ang - 16)
        feathers.append(Feather(base, c1, c2, tip, w, 0.3))

    # Wings raised in a V, as a bird climbing.
    feathers += wing((304, 362), (208, 330), 112, 176, 104, 240, 30, 34, 6, rng)
    feathers += wing((354, 364), (452, 330), 68, 4, 108, 248, -30, 36, 6, rng)

    # Tail: long trailing strokes sweeping down and to the right.
    base = (338, 474)
    for i, (dx, dy) in enumerate([(306, 128), (296, 170), (262, 204), (210, 222), (150, 214), (96, 186)]):
        tip = (base[0] + dx, base[1] + dy)
        c1 = (base[0] + dx * 0.15, base[1] + dy * 0.5 + 34)
        c2 = (base[0] + dx * 0.6, base[1] + dy * 0.62)
        feathers.append(Feather(base, c1, c2, tip, 30 - i * 2.4, 0.2))
    return feathers


def layered(feathers: list[Feather], rng: random.Random) -> str:
    # Three passes over the same strokes: red underpainting, flame body, ember highlight.
    parts = []
    for f in feathers:
        parts.append(f'<path fill="{RED}" d="{outline(f, 1.0, 0.0, rng=rng)}"/>')
    for f in feathers:
        parts.append(f'<path fill="{FLAME}" fill-opacity="0.92" d="{outline(f, 0.78, 0.25, rng=rng)}"/>')
    for f in feathers:
        parts.append(f'<path fill="{ORANGE}" fill-opacity="0.85" d="{outline(f, 0.5, 0.55, rng=rng)}"/>')
    for f in feathers:
        parts.append(f'<path fill="{EMBER}" fill-opacity="0.8" d="{outline(f, 0.22, 0.9, rng=rng)}"/>')
    return '\n'.join(parts)


def hero() -> str:
    rng = random.Random(20261013)
    feathers = build_bird(rng)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" '
        'aria-labelledby="phoenix-hero-title">\n'
        '<title id="phoenix-hero-title">An abstract phoenix in orange and red, wings raised, rising</title>\n'
        f'{layered(feathers, rng)}\n</svg>\n'
    )


def mark() -> str:
    # Single-colour silhouette for small sizes; takes the colour from CSS (currentColor).
    rng = random.Random(7)
    feathers = build_bird(rng)
    paths = '\n'.join(f'<path d="{outline(f, 1.0, 0.0, samples=14)}"/>' for f in feathers)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 150 600 560" fill="currentColor" aria-hidden="true">\n'
        f'{paths}\n</svg>\n'
    )


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'phoenix-hero.svg').write_text(hero())
    (OUT / 'phoenix-mark.svg').write_text(mark())
    for name in ('phoenix-hero.svg', 'phoenix-mark.svg'):
        print(name, (OUT / name).stat().st_size, 'bytes')
