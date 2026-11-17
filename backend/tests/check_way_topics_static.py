# Static validation of Allgemeines Register topics (topics3/topics4): refs vs ELB1905 verse counts, related/lexicon/stations/feelings ids
import json, re, glob

FE = "/app/frontend/src/data"
books = {m.group(2): int(m.group(1)) for m in re.finditer(r'nr: (\d+), code: "([^"]+)"', open(f"{FE}/books.ts").read())}
vc = json.load(open(f"{FE}/verseCounts.json"))
idx = open(f"{FE}/way/index.ts").read()
feelings = set(re.findall(r'F\("([^"]+)"', idx))
all_topic_ids = set()
for f in glob.glob(f"{FE}/way/topics*.ts"):
    all_topic_ids |= set(re.findall(r'^    id: "([^"]+)"', open(f).read(), re.M))
alltext = "".join(open(f).read() for f in glob.glob(f"{FE}/*.ts") + glob.glob("/app/frontend/src/lib/*.ts"))
problems = []
NEW = ["neid-vergleich", "entscheidungen", "arbeit-sinn", "geld-sorge", "liebe-partnerschaft", "familie", "aelterwerden", "sterben-tod", "frieden-stille", "mut-neuanfang", "ungerechtigkeit", "gebet-schwer"]
FIELDS = ["aka", "explained", "causes", "passages", "people", "jesus", "orientation", "tensions", "questions", "prayer", "steps", "care", "related", "lexicon", "stations", "feelings"]
for f in ["topics3.ts", "topics4.ts"]:
    src = open(f"{FE}/way/{f}").read()
    blocks = re.split(r'\n  \{\n', src)[1:]
    for b in blocks:
        tid = re.search(r'id: "([^"]+)"', b).group(1)
        for fld in FIELDS:
            if not re.search(rf'\n    {fld}: ', b):
                problems.append(f"{tid}: missing field {fld}")
        for ref in re.findall(r'ref: "([^"]+)"', b):
            bk, c, vv = ref.split(":")
            fr, *to = vv.split("-")
            to = int(to[0]) if to else int(fr)
            if bk not in books: problems.append(f"{tid}: unknown book {ref}"); continue
            chs = vc[str(books[bk])]
            if int(c) > len(chs): problems.append(f"{tid}: chapter out of range {ref}"); continue
            if to > chs[int(c) - 1][0] or int(fr) > to: problems.append(f"{tid}: verse out of range {ref} (max {chs[int(c)-1][0]})")
        def arr(name):
            m = re.search(rf'\n    {name}: \[([^\]]*)\]', b)
            return re.findall(r'"([^"]+)"', m.group(1)) if m else []
        for r in arr("related"):
            if r not in all_topic_ids: problems.append(f"{tid}: related unknown {r}")
        for fe in arr("feelings"):
            if fe not in feelings: problems.append(f"{tid}: feeling unknown {fe}")
        for l in arr("lexicon"):
            if f'"{l}"' not in alltext: problems.append(f"{tid}: lexicon id not found {l}")
        for s in arr("stations"):
            if f'"{s}"' not in alltext and f"'{s}'" not in alltext: problems.append(f"{tid}: station id maybe unknown {s}")
        print(tid, "passages", len(re.findall(r'ref: "', b)), "related", arr("related"), "feelings", arr("feelings"), "lex", len(arr("lexicon")), "st", len(arr("stations")))
print("total topic ids", len(all_topic_ids), "missing new:", [n for n in NEW if n not in all_topic_ids])
print("PROBLEMS:", len(problems))
for p in problems: print(" -", p)
