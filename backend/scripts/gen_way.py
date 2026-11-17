"""Themenbilder für „Mein geistlicher Weg“ (Gemini Nano Banana), JPEG 1000 px Breite, Originalproportionen.
Aufruf: python scripts/gen_way.py [id …] – vorhandene Dateien werden übersprungen.
"""
import asyncio
import base64
import io
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
OUT = Path(__file__).resolve().parents[2] / "frontend" / "assets" / "images" / "way"
STYLE = ("Wide 4:3 landscape illustration, calm hand-painted watercolor and gouache style, warm natural colors, golden light accents, "
         "biblical landscape of ancient Israel, quiet hopeful atmosphere, gentle symbolism, no text, no letters, no halos, faces not in focus, dignified.")
SCENES = {
    "neid-vergleich": "Two olive trees growing side by side on a hill, each in its own light, a small path between them, soft morning sun.",
    "entscheidungen": "A traveller with a staff standing at a fork of two paths in the Judean hills at dawn, a soft golden light over both ways.",
    "arbeit-sinn": "Hands of a farmer tending a vineyard terrace at golden hour, tools resting, a small water jug and bread in the shade.",
    "geld-sorge": "An open clay jar with a few coins and a loaf of bread on a simple wooden table, an oil lamp, birds outside the window over a field of lilies.",
    "liebe-partnerschaft": "Two figures seen from behind walking hand in hand through a blooming orchard at sunset, soft warm light.",
    "familie": "A stone house courtyard in the evening with several generations around a table, a child and a grandparent, warm lamp light.",
    "aelterwerden": "An old palm tree still bearing dates beside a quiet path at sunset, a wooden bench, long gentle shadows.",
    "sterben-tod": "An open rock-cut tomb in a garden at sunrise, the stone rolled away, light streaming out, olive trees and spring flowers.",
    "frieden-stille": "The calm Sea of Galilee at dawn, mirror-like water, a small boat resting at the shore, mist over the hills.",
    "mut-neuanfang": "A small caravan with tents setting out into a wide sunrise landscape, footprints in the sand leading forward.",
    "ungerechtigkeit": "A balance scale on a stone city gate at dusk, a stream of clear water flowing below, a single lamp shining.",
    "gebet-schwer": "A lone figure kneeling among ancient olive trees in Gethsemane at night, a faint silver dawn breaking on the horizon.",
}


async def gen(tid):
    target = OUT / f"{tid}.jpg"
    if target.exists():
        return
    for attempt in range(3):
        try:
            chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=str(uuid.uuid4()), system_message="You create illustrations.")
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
            _, images = await chat.send_message_multimodal_response(UserMessage(text=f"{SCENES[tid]} {STYLE}"))
            im = Image.open(io.BytesIO(base64.b64decode(images[0]["data"]))).convert("RGB")
            im.thumbnail((1000, 1000), Image.LANCZOS)
            im.save(target, "JPEG", quality=78, optimize=True, progressive=True)
            print("ok", tid, im.size, flush=True)
            return
        except Exception as e:  # noqa: BLE001
            print("fail", tid, attempt, str(e)[:120], flush=True)


async def main(ids):
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(5)

    async def run(t):
        async with sem:
            await gen(t)

    await asyncio.gather(*(run(t) for t in ids))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:] or list(SCENES)))
