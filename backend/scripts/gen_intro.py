"""Erzeugt die Szenenbilder des Intros „Reise bis zum Kreuz“ (OpenAI GPT Image 1).

Einmalig auszuführen; Bilder werden als JPEG (900 px) gebündelt. Aufruf: python scripts/gen_intro.py [id ...]
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
OUT = Path(__file__).resolve().parents[2] / "frontend" / "assets" / "images" / "intro"

STYLE = (
    "Cinematic painterly illustration, highly detailed landscape, atmospheric natural light, "
    "historically plausible 1st-century Judea and Galilee: wool and linen tunics and mantles, sandals, "
    "limestone and basalt houses, olive trees, terraced hills. Clear composition with the main subject in the center third, "
    "calm lower third suitable for a caption. No text, no letters, no halos, no watermark, dignified and respectful."
)

SCENES = {
    "geburt": "Night in Bethlehem: a young mother and father with a newborn in a manger inside a simple limestone cave-stable lit by an oil lamp, shepherds with sheep entering from the starry hillside, warm golden light.",
    "kindheit": "Morning in the village of Nazareth: a boy helping a carpenter at a workbench in a courtyard of a modest stone house, terraced hills of Galilee behind, warm soft light.",
    "taufe": "The Jordan river at morning: a man in a camel-hair garment baptizing another man waist-deep in the river, a crowd on the reedy bank, a dove descending in a beam of soft light.",
    "wueste": "The Judean desert at dawn: a lone man in a simple mantle standing on a rocky ridge above vast barren hills and ravines, long shadows, solitude, fasting.",
    "berufung": "Shore of the Sea of Galilee at sunrise: fishermen leaving their wooden boats and nets on the pebble beach to follow a teacher walking along the shore.",
    "verkuendigung": "A grassy hillside above the Sea of Galilee in warm afternoon light: a teacher seated, speaking to a large attentive crowd of men, women and children, wildflowers, the lake shimmering below.",
    "begegnungen": "A street in Jericho with palm trees: a small man in fine clothes looking down from a sycamore fig tree as a teacher and a crowd stop beneath it, lively warm colors.",
    "wunder": "Roadside near Jericho: a blind man in a worn cloak, his face lifting in amazement as his sight returns, a teacher before him, a surprised crowd, golden light.",
    "bekenntnis": "Near Caesarea Philippi: a teacher and twelve disciples resting by a spring at the foot of a rocky cliff with niches, green trees, Mount Hermon faint in the distance, thoughtful mood.",
    "einzug": "The Mount of Olives road descending to Jerusalem: a man riding a young donkey, people spreading cloaks and waving palm branches, the temple and city walls glowing in the background.",
    "abendmahl": "An upper room in Jerusalem at evening: a teacher and his disciples reclining around a low table with bread, a cup of wine and oil lamps, intimate warm and solemn atmosphere. Strictly no eyeglasses, no candles, no modern objects; only clay oil lamps.",
    "gethsemane": "Night in an olive grove at the foot of the Mount of Olives: a man kneeling alone in prayer by a rock, gnarled ancient olive trees, cold moonlight, three disciples asleep in the background.",
    "verhaftung": "Night courtyard in Jerusalem: a fisherman warming himself at a small charcoal fire among servants, turning away, a rooster on a wall, torches and guards in the distance, muted cool tones.",
    "kreuz": "Dusk on a hill outside Jerusalem seen from a distance: three crosses in silhouette against a dark cloudy sky, a small group of women standing far off in grief, muted grey-blue and ochre tones, no blood, dignified.",
    "auferstehung": "Early morning at a rock-cut tomb in a garden: the large round stone rolled away, bright pale dawn light streaming from the open tomb, women with spice jars approaching in awe, dew on the plants.",
}


async def gen(client: OpenAIImageGeneration, sid: str, desc: str) -> None:
    target = OUT / f"{sid}.jpg"
    if target.exists():
        print("skip", sid, flush=True)
        return
    try:
        imgs = await client.generate_images(prompt=f"{desc} {STYLE}", model="gpt-image-1", number_of_images=1)
        im = Image.open(io.BytesIO(imgs[0])).convert("RGB").resize((900, 900), Image.LANCZOS)
        im.save(target, "JPEG", quality=80, optimize=True, progressive=True)
        print("ok", sid, target.stat().st_size, flush=True)
    except Exception as e:  # noqa: BLE001 - Skript: Fehler je Bild melden, Rest fortsetzen
        print("fail", sid, e, flush=True)


async def main(ids: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    client = OpenAIImageGeneration(api_key=os.environ["EMERGENT_LLM_KEY"])
    sem = asyncio.Semaphore(5)

    async def run(sid: str):
        async with sem:
            await gen(client, sid, SCENES[sid])

    await asyncio.gather(*(run(s) for s in (ids or SCENES)))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
