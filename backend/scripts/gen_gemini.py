"""Erzeugt Einheitenbilder (kleine Propheten, Synoptischer Vergleich) mit Gemini Nano Banana.

Nutzt die Szenen und den Stil aus gen_psalms.py und ein vorhandenes Psalmenbild als Stilreferenz.
Aufruf: python scripts/gen_gemini.py kp-1 kp-2 …  – vorhandene Bilder werden übersprungen.
"""
import asyncio
import base64
import io
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_psalms import OUT, SCENES, STYLE  # noqa: E402

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
REF = base64.b64encode((OUT / "ps4-4.jpg").read_bytes()).decode()


async def gen(sid: str) -> None:
    target = OUT / f"{sid}.jpg"
    if target.exists():
        print("skip", sid, flush=True)
        return
    for attempt in range(2):
        try:
            chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=str(uuid.uuid4()), system_message="You create illustrations.")
            chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
            msg = UserMessage(
                text=f"Create a new square illustration in exactly the same painterly style, palette and lighting as the reference image (but a completely new scene): {SCENES[sid]} {STYLE}",
                file_contents=[ImageContent(REF)],
            )
            _, images = await chat.send_message_multimodal_response(msg)
            if not images:
                raise RuntimeError("no image")
            im = Image.open(io.BytesIO(base64.b64decode(images[0]["data"]))).convert("RGB")
            side = min(im.size)
            im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2)).resize((900, 900), Image.LANCZOS)
            im.save(target, "JPEG", quality=78, optimize=True, progressive=True)
            print("ok", sid, target.stat().st_size, flush=True)
            return
        except Exception as e:  # noqa: BLE001
            print("fail", sid, attempt, str(e)[:160], flush=True)


async def main(ids: list[str]) -> None:
    sem = asyncio.Semaphore(4)

    async def run(sid: str):
        async with sem:
            await gen(sid)

    await asyncio.gather(*(run(s) for s in ids))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
