"""Erzeugt die Einheitenbilder der Lernwelt „Psalmen & Weisheit“ (OpenAI GPT Image 1).

Aufruf: python scripts/gen_psalms.py [id ...]  – Bilder als JPEG (900 px) gebündelt, vorhandene werden übersprungen.
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
OUT = Path(__file__).resolve().parents[2] / "frontend" / "assets" / "images" / "psalms"

STYLE = (
    "Painterly atmospheric illustration, warm natural light, historically plausible ancient Israel (Iron Age / Second Temple era): "
    "wool and linen garments, sandals, limestone houses, olive trees, terraced hills. Calm composition, the main subject in the center, "
    "quiet lower third. No text, no letters, no halos, no watermark, dignified and respectful."
)

SCENES = {
    "ps1-1": "Ancient scrolls and a lyre, a harp and a small hand drum resting on a stone ledge in the Jerusalem temple courtyard at golden hour, singers in the soft background.",
    "ps1-2": "A large fruitful tree with deep roots planted beside clear flowing streams of water in a green valley, while chaff blows away in the wind over a dry threshing floor in the distance.",
    "ps1-3": "An ancient Israelite king being anointed with oil from a horn on a hill in Jerusalem, priests and people around, distant nations' banners on the horizon, majestic but restrained.",
    "ps1-4": "A shepherd leading sheep through green pastures beside quiet water, a dark narrow valley with long shadows ahead, a laid table with a cup under an olive tree in the foreground.",
    "ps1-5": "A father embracing his child at the door of a stone house at sunset, the wide horizon stretching from east to west, wild grass and flowers swaying in the wind.",
    "ps1-6": "Pilgrims with staffs and bundles walking on a winding road up through the Judean hills toward Jerusalem at sunrise, the city on the distant height, mountains around.",
    "ps1-7": "A person sitting alone on a rooftop at night under a vast starry sky, the dawn just beginning at the edge of the sea far away, contemplative mood.",
    "ps1-8": "Stonemasons at work near the walls of Jerusalem, one large discarded cornerstone lying aside now being lifted into place at the corner of a gate, crowds with palm branches in the distance.",
    "ps1-9": "An oil lamp illuminating an open scroll on a wooden reading desk at night, its light falling on a path of stone steps leading outward, quiet study atmosphere.",
    "ps1-10": "A shepherd boy lying on a hillside at night looking up at the moon and countless stars over the hills of Judea, sheep resting nearby, awe and wonder.",
    "ps2-1": "A person kneeling in prayer under a dark cloudy sky on a hillside, the first ray of sunlight breaking through the clouds, from lament to trust.",
    "ps2-2": "A lonely rocky hill at dusk with a distant group of mourners, dark sky slowly opening to light toward the horizon, solemn and respectful, no crosses in focus, no blood.",
    "ps2-3": "A man stepping out of a shadowed courtyard into morning light, an open gate before him, a dry withered plant at his feet turning green, relief and freedom.",
    "ps2-4": "A man in royal garments kneeling humbly on the floor of a palace chamber, his crown set aside, washing his hands in a basin of clear water, soft light from a window.",
    "ps2-5": "A person standing at the edge of a city wall at evening looking toward a distant dove flying away over the wilderness, a friend's empty seat in the courtyard below.",
    "ps2-6": "A large bird spreading its wings protectively over its young in a rocky cleft, an ancient fortress on a cliff behind, rays of sunlight, sheltering atmosphere.",
    "ps2-7": "Watchmen standing on the walls of Jerusalem at night waiting for the morning, a deep valley below in darkness, the first light of dawn on the eastern horizon.",
    "ps2-8": "A deer drinking from a stream in a mountain forest near Mount Hermon, waterfalls roaring, mist, longing and refreshment.",
    "ps2-9": "Two contrasting halves of one landscape: a prosperous estate with banquet on one side and a quiet temple courtyard where a lone person sits in thought on the other, twilight.",
    "ps2-10": "An empty rock-cut tomb in a garden at dawn with the stone rolled away, an ancient throne-like seat carved in rock and a priestly incense altar in the soft background, hopeful light.",
    "ps3-1": "An old teacher and young students sitting under a fig tree outside a stone house, an open scroll, the young listening attentively, morning light, humility and learning.",
    "ps3-2": "A wise elder in a village gate seated with townspeople, weighing a decision, two paths branching beyond the gate into the countryside.",
    "ps3-3": "A young woman writing words onto a small wax tablet by an oil lamp, then holding it to her heart, a scroll beside her, quiet evening room.",
    "ps3-4": "A clear spring welling up from rocks into a small garden pool, a path leading away straight between olive trees, symbol of the heart as source of life.",
    "ps3-5": "Two neighbours at a well talking calmly, one listening attentively, while in the background a market crowd gossips, warm afternoon light.",
    "ps3-6": "An ancient marketplace with a merchant using honest balance scales and stone weights, a poor buyer treated fairly, colourful goods and baskets.",
    "ps3-7": "Ants carrying grain in the foreground, behind them a farmer working his field and a carpenter in his workshop preparing, summer harvest.",
    "ps3-8": "Two friends walking together on a road at sunset, one with a hand on the other's shoulder, iron tools sharpening on a grinding stone at a roadside workshop.",
    "ps3-9": "A man standing still and breathing calmly at the gate of a fortified city with strong walls, an angry crowd in the distance calming down.",
    "ps3-10": "A strong capable woman managing a household and a vineyard, giving bread to a poor family at the door, spindle and loom nearby, generous light.",
    "ps4-1": "A wealthy man of the ancient East with his large family before tents and herds of camels, sheep and oxen in a wide steppe landscape at dawn.",
    "ps4-2": "A vast starry sky above a quiet desert camp at night, mysterious light in the heavens, a lone tent below, sense of hidden things above.",
    "ps4-3": "A man sitting on the ground in torn clothes amid ruins of his house, wind blowing dust across an empty plain, sorrow shown with dignity, no gore.",
    "ps4-4": "Three friends sitting silently on the ground beside a grieving man under a wide evening sky, seven stars appearing, compassion and silence.",
    "ps4-5": "A lonely figure under a dark stormy sky in a barren landscape, raising his hands in lament, a thin line of light on the horizon.",
    "ps4-6": "Three elders gesturing and lecturing toward a suffering man sitting apart, their shadows long, a scale tipped in the foreground, desert setting.",
    "ps4-7": "Ancient miners with lamps deep in a mountain shaft finding gems and silver, while far above the opening shows the open sky and light.",
    "ps4-8": "A man looking up from a rocky hill toward the rising sun with hope, writing engraved on a stone tablet beside him, wind and light.",
    "ps4-9": "A mighty whirlwind over a wild landscape with wild animals, mountain goats, a wild donkey, an eagle, the sea and stars, creation's grandeur.",
    "ps4-10": "A restored family gathering under a large tree with new tents and herds, an older man with grandchildren, gentle evening light, quiet joy with memory.",
}


async def gen(client: OpenAIImageGeneration, sid: str, desc: str) -> None:
    target = OUT / f"{sid}.jpg"
    if target.exists():
        print("skip", sid, flush=True)
        return
    try:
        imgs = await client.generate_images(prompt=f"{desc} {STYLE}", model="gpt-image-1", number_of_images=1)
        im = Image.open(io.BytesIO(imgs[0])).convert("RGB").resize((900, 900), Image.LANCZOS)
        im.save(target, "JPEG", quality=78, optimize=True, progressive=True)
        print("ok", sid, target.stat().st_size, flush=True)
    except Exception as e:  # noqa: BLE001 - Fehler je Bild melden, Rest fortsetzen
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
