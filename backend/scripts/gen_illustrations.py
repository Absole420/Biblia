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
    # Etappe 3: Josua – Könige
    "josua": "A strong middle-aged military leader in a simple cloak standing at the Jordan river ford, priests carrying a covered chest in the distance, morning mist.",
    "rahab": "A woman leaning out of a window set into a mudbrick city wall at dusk, a scarlet cord hanging down the wall, palm trees of Jericho around.",
    "debora": "A wise woman sitting under a large palm tree in hill country, people gathered before her seeking judgment, calm authority.",
    "gideon": "A young farmer threshing wheat secretly in a stone winepress, looking up in surprise, olive trees around.",
    "simson": "A very strong man with long braided hair standing between two massive stone pillars of a hall, pushing them apart, dust falling.",
    "rut": "A young woman gleaning barley sheaves in a golden field at harvest time near Bethlehem, a basket at her side.",
    "boas": "A dignified older landowner in a wool mantle standing in a barley field greeting reapers, friendly gesture.",
    "samuel": "A boy lying awake on a mat in a dim lamp-lit sanctuary, listening attentively, oil lamp glowing.",
    "saul": "A tall king with a simple bronze circlet and a spear, sitting troubled in a tent, a young musician with a lyre nearby.",
    "david": "A young shepherd with a sling and a staff on a rocky hillside, sheep around him, a lyre slung on his back.",
    "salomo": "A richly dressed young king standing in front of a cedar and stone temple under construction, craftsmen working, thoughtful expression.",
    "elia": "A rugged prophet in a hair cloak with a leather belt standing on Mount Carmel beside a stone altar, flames rising, storm clouds over the sea.",
    "elisa": "A bald-headed prophet in a plain mantle picking up another fallen cloak beside the Jordan river, a whirlwind fading in the sky.",
    "hiskia": "A king kneeling in prayer in a temple court with an unrolled letter spread before him, worried but hopeful, Jerusalem walls behind.",
    "josia": "A young king tearing his royal robe in grief while a scribe reads from an old scroll found in the temple.",
    # Etappe 4: Esra – Propheten
    "kyros": "A Persian king of the 6th century BC in a long embroidered robe and a tall rounded cap, standing before a clay cylinder inscription on a table, Achaemenid palace columns behind.",
    "esra": "A scribe and priest standing on a wooden platform reading aloud from an open scroll to a large crowd in a city square at morning, Jerusalem stones around.",
    "nehemia": "A man in Persian court dress inspecting a ruined city wall by moonlight from a donkey, workers' tools lying around.",
    "ester": "A young queen in elegant Persian robes standing at the entrance of a throne hall, hesitant but brave, a golden scepter held out from the shadow ahead.",
    "hiob": "A thoughtful older man with a grey beard sitting quietly on a stone outside a village at sunset, looking up at a vast sky with gathering storm clouds, three friends standing at a distance.",
    "jesaja": "A prophet with a scroll standing in the temple courts of Jerusalem, looking up as smoke and light fill the space, awe on his face.",
    "jeremia": "A sorrowful prophet with a wooden yoke on his shoulders walking through a narrow street of ancient Jerusalem, people staring.",
    "ezechiel": "A prophet standing in a wide valley full of scattered dry bones, wind blowing, a Mesopotamian river landscape in the distance.",
    "daniel": "A young Judean man praying at an open window facing west in a Babylonian house, glazed brick wall and palm trees outside.",
    "jona": "A man sitting under a leafy plant on a hill outside a large ancient walled city in the heat of the day, looking at the city, sulking.",
    # Etappe 5: Evangelien
    "jesus": "A Galilean Jewish teacher of the 1st century in a simple wool tunic and mantle, sitting on a hillside by the Sea of Galilee teaching a small crowd, warm evening light, no halo.",
    "petrus": "A sturdy Galilean fisherman with a short beard pulling a full net into a wooden boat on the Sea of Galilee at dawn.",
    "herodes-grosse": "A 1st-century BC client king in Roman-influenced royal dress standing on a terrace overlooking a vast temple construction site with cranes and scaffolding.",
    "johannes-markus": "A young man in a simple tunic writing on a scroll by lamplight in a modest house, a travel bag beside him.",
    "maria": "A young Jewish woman from Nazareth in a simple headscarf carrying a water jar at a village spring, thoughtful and calm, hills of Galilee behind.",
    "johannes-taeufer": "A wild-looking prophet in a camel-hair garment with a leather belt standing waist-deep in the Jordan river, people waiting on the bank.",
    "johannes-apostel": "A young Galilean fisherman mending nets with his brother beside a boat on the lakeshore, their father in the boat.",
    "nikodemus": "An elderly Jewish scholar in a fine mantle walking at night through a narrow Jerusalem lane with an oil lamp, contemplative.",
    "lazarus": "A man in white linen wrappings stepping out of a rock-cut tomb into the daylight in a village near Jerusalem, his sisters looking on in astonishment.",
    # Etappe 6: Urkirche
    "paulus": "A 1st-century Jewish traveler and tentmaker with a short dark beard, writing a letter on papyrus by lamplight in a workshop, a travel cloak and staff nearby, a harbor visible through the doorway.",
    "barnabas": "A warm, broad-shouldered 1st-century man from Cyprus placing a bag of coins at the feet of a group of people in a Jerusalem courtyard, friendly smile.",
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
