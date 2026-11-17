"""Freigestellte Ortsillustrationen (Ebene 5 des Living Atlas) mit Gemini Nano Banana.

Einheitlicher handgemalter Stil, künstlerische Rekonstruktion. Erzeugt auf reinweißem Grund,
anschließend per Randflutung freigestellt und als PNG mit Alpha (max. 320 px) gespeichert.
Aufruf: python scripts/gen_places.py [id …] – vorhandene Dateien werden übersprungen.
"""
import asyncio
import base64
import io
import os
import sys
import uuid
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image, ImageDraw, ImageFilter

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
OUT = Path(__file__).resolve().parents[2] / "frontend" / "assets" / "images" / "places"

STYLE = (
    "Isolated miniature illustration for a hand-painted antique Bible atlas, seen from a high three-quarter bird's-eye view, "
    "warm watercolor and gouache style with fine sepia ink outlines, soft natural light from the upper left, light natural limestone buildings, "
    "olive green trees, small grassy ground patch under the scene. The whole object is centered and fully visible with generous margin, "
    "on a pure flat white background (#FFFFFF), no shadow on the background, no frame, no text, no letters, no people in the foreground, historically plausible."
)

SCENES = {
    "jerusalem": "The ancient walled city of Jerusalem on a hill in the time of Jesus: strong limestone city walls with towers, dense flat-roofed houses rising up the hill, the large Herodian temple with white and gold facade on the top, cypress and olive trees around.",
    "bethlehem": "A small Judean village of Bethlehem on a gentle hillside: a cluster of a dozen flat-roofed limestone houses, a few olive trees and cypresses, terraced fields.",
    "nazareth": "A small Galilean hill village of Nazareth: modest flat-roofed stone houses among many green olive trees and a few cypresses on a green hill.",
    "capernaum": "A fishing village of Capernaum on the shore of the Sea of Galilee: basalt and limestone houses, a small synagogue, two small wooden fishing boats pulled onto the shore, blue water edge.",
    "jericho": "The ancient oasis city of Jericho: low mud-brick and stone walls, flat houses, surrounded by many tall date palm trees and green gardens.",
    "joppa": "The ancient harbor town of Joppa on a rocky hill by the sea: stone houses on the cliff, a small harbor with two sailing ships with square sails on blue water.",
    "caesarea": "The Roman harbor city of Caesarea Maritima: white marble temple with columns, a theatre, a breakwater harbor with a Roman sailing ship, blue water.",
    "hebron": "The old town of Hebron in the Judean hill country: stone houses and a large rectangular stone enclosure building, olive trees and vineyards on rocky hills.",
    "engedi": "The oasis of En-Gedi: a small waterfall falling down a rocky desert cliff into a pool, lush date palms and green bushes around, sandstone rocks.",
    "beersheba": "Beersheba in the desert: a stone well with a wooden frame in the center, three dark brown nomad tents, a tamarisk tree and a few camels on sandy ground.",
    "sinai": "A majestic rugged granite desert mountain massif of Sinai with reddish-brown rocky peaks and deep shadows, a little sand at its foot, no buildings.",
    "babylon": "The ancient Mesopotamian city of Babylon: massive mud-brick walls, the blue glazed Ishtar gate with towers, a stepped ziggurat tower in the background, palm trees by a river.",
    "nineveh": "The ancient Assyrian city of Nineveh: massive fortified mud-brick walls with crenellated towers and a monumental gate, palace terraces, a river with reeds in front.",
    "rome": "Ancient Rome in the first century: marble temples with columns, a forum, red tiled roofs, cypress trees on hills.",
    "village": "A tiny ancient Israelite village: four flat-roofed limestone houses and two olive trees on a small hill.",
    "town": "A small ancient walled Levantine town: a low stone wall with a gate, flat-roofed houses and a few trees.",
    "harbor": "A small ancient Mediterranean harbor town: stone houses by the water and one small sailing ship.",
    "sacred": "A small ancient open-air stone altar with standing stones on a hill, a few cypress trees, soft golden light.",
    "mountain": "A single natural rocky mountain with sandstone and brown slopes, a few shrubs at its foot, no buildings.",
    "camp": "A desert camp: two brown nomad tents, a small palm tree and a little water spring on sandy ground.",
    "ship": "A single ancient wooden merchant sailing ship with one large cream square sail, side view, on a tiny patch of blue water.",
    "olives": "A small grove of five painted olive trees and two slender dark cypresses on a tiny grassy patch.",
    "palms": "A small cluster of four date palm trees on a tiny sandy patch.",
}


def cutout(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    a = np.asarray(im, np.int16)
    # weißnahe Fläche, die mit dem Rand verbunden ist → transparent
    # Hintergrundfarbe aus den Ecken schätzen (reinweiß oder leicht getönt)
    corners = np.concatenate([a[:6, :6].reshape(-1, 3), a[:6, -6:].reshape(-1, 3), a[-6:, :6].reshape(-1, 3), a[-6:, -6:].reshape(-1, 3)])
    bgc = np.median(corners, axis=0)
    near = (np.abs(a - bgc).max(axis=2) < 26) | ((a.min(axis=2) > 232) & ((a.max(axis=2) - a.min(axis=2)) < 22))
    m = Image.fromarray((near * 255).astype(np.uint8))
    w, h = m.size
    fill = m.copy()
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if fill.getpixel((x, y)) == 255:
            ImageDraw.floodfill(fill, (x, y), 128)
    bg = (np.asarray(fill) == 128)
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = im.copy()
    out.putalpha(alpha)
    box = out.getbbox()
    out = out.crop(box) if box else out
    out.thumbnail((320, 320), Image.LANCZOS)
    return out


async def gen(pid: str) -> None:
    target = OUT / f"{pid}.png"
    if target.exists():
        print("skip", pid, flush=True)
        return
    for attempt in range(3):
        try:
            chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=str(uuid.uuid4()), system_message="You create illustrations.")
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
            _, images = await chat.send_message_multimodal_response(UserMessage(text=f"{SCENES[pid]} {STYLE}"))
            if not images:
                raise RuntimeError("no image")
            im = cutout(Image.open(io.BytesIO(base64.b64decode(images[0]["data"]))))
            im.save(target, "PNG", optimize=True)
            print("ok", pid, im.size, target.stat().st_size // 1024, "KB", flush=True)
            return
        except Exception as e:  # noqa: BLE001
            print("fail", pid, attempt, str(e)[:160], flush=True)


async def main(ids):
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(5)

    async def run(p):
        async with sem:
            await gen(p)

    await asyncio.gather(*(run(p) for p in ids))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:] or list(SCENES)))
