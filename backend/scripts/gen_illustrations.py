"""Erzeugt künstlerische Personenillustrationen für das Lexikon (OpenAI GPT Image 1).

Einmalig auszuführen; Ergebnis wird als komprimiertes JPEG in die App gebündelt
(offline verfügbar). Aufruf: python scripts/gen_illustrations.py [id ...]
"""
import asyncio
import io
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from PIL import Image

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
OUT = Path(__file__).resolve().parents[2] / "frontend" / "assets" / "images" / "lexicon"

STYLE = (
    "Warm painterly storybook illustration, soft natural light, earthy ochre and sand tones, "
    "respectful and dignified, ancient Near East setting, historically plausible simple clothing "
    "(wool and linen tunics, mantles, sandals), no halos, no text, no letters, no watermark, "
    "no depiction of God, square composition, character in the middle ground with landscape behind."
)

PEOPLE = {
    "adam-eva": "A man and a woman in a lush garden with fruit trees and a river at dawn, modestly covered by large leaves and foliage, looking thoughtfully at each other.",
    "noah": "An elderly bearded man standing beside a huge wooden ark under construction, animals in the distance, a rainbow appearing in a clearing sky.",
    "abraham": "An elderly bearded nomad leaning on a staff in front of goat-hair tents at night, looking up at a sky full of stars, flocks of sheep nearby.",
    "sara": "An elderly woman with a headscarf at the entrance of a nomad tent near oak trees, smiling with quiet surprise.",
    "lot": "A middle-aged man with his family leaving a city at dawn, walking away across a plain near the Dead Sea, smoke rising far behind them.",
    "isaak": "A calm middle-aged man digging out a desert well with herdsmen, sheep around, dry hills of the Negev.",
    "jakob": "A traveler sleeping on the ground with a stone as pillow under a starry sky, a dreamlike stairway of light rising into the clouds.",
    "josef": "A young man in an Egyptian-style linen robe of a high official standing in an ancient Egyptian granary full of grain, pyramids-free Nile delta landscape.",
    "mose": "An older bearded man holding a shepherd staff at the foot of a rugged granite mountain in the Sinai desert, a crowd of people far behind.",
    "aaron": "A bearded man in simple priestly linen garments with a breastpiece, standing beside a desert tent sanctuary, holding a staff.",
    "mirjam": "A woman playing a frame drum and dancing with other women on a sandy shore by the sea, joyful, wind in her headscarf.",
    "bileam": "A man in a traveling cloak riding a donkey on a narrow path between vineyard walls, the donkey has stopped and turns its head, soft light on the path.",
}


async def gen(client: OpenAIImageGeneration, pid: str, desc: str) -> None:
    target = OUT / f"{pid}.jpg"
    if target.exists():
        print("skip", pid, flush=True)
        return
    try:
        imgs = await client.generate_images(prompt=f"{desc} {STYLE}", model="gpt-image-1", number_of_images=1)
        im = Image.open(io.BytesIO(imgs[0])).convert("RGB").resize((768, 768), Image.LANCZOS)
        im.save(target, "JPEG", quality=78, optimize=True)
        print("ok", pid, target.stat().st_size, flush=True)
    except Exception as e:  # noqa: BLE001 - Skript: Fehler je Bild melden, Rest fortsetzen
        print("fail", pid, e, flush=True)


async def main(ids: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    client = OpenAIImageGeneration(api_key=os.environ["EMERGENT_LLM_KEY"])
    sem = asyncio.Semaphore(4)

    async def run(pid: str):
        async with sem:
            await gen(client, pid, PEOPLE[pid])

    await asyncio.gather(*(run(p) for p in (ids or PEOPLE)))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
