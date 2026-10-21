import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { Choice, refLabel, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { Button } from "@/src/components/ui";
import { searchBible } from "@/src/data/bible";
import { BIBLE_BOOKS, parseRef } from "@/src/data/books";
import { useProgress } from "@/src/lib/store";

type Hit = { kind: string; key: string; text: string; date?: string; color?: string; tags: string[] };

/** Schnellsuche (Bibeltext, eigene Notizen, Markierungen, Journal, Tags) und zentrale Sammlung mit Filtern. */
export default function Collection() {
  const s = useStudyStyles();
  const router = useRouter();
  const { state } = useProgress();
  const [q, setQ] = useState("");
  const [book, setBook] = useState("all");
  const [tag, setTag] = useState("all");
  const [color, setColor] = useState("all");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [bible, setBible] = useState<{ book: number; chapter: number; verse: number; text: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const st = state.study;
  const ref = q.trim() ? parseRef(q.trim()) : null;
  const phrase = q.trim().replace(/^"|"$/g, "").toLowerCase();

  const items = useMemo(() => {
    const tagsOf = (k: string) => Object.entries(st.verseTags).filter(([kk]) => kk === k || kk.startsWith(k + "-")).flatMap(([, t]) => t);
    const out: Hit[] = [
      ...state.notes.map((n) => ({ kind: "Eigene Notiz", key: n.ref ?? "", text: `${n.title}: ${n.text}`, date: n.updatedAt, tags: n.ref ? tagsOf(n.ref) : [] })),
      ...Object.entries(state.highlights).map(([k, c]) => ({ kind: "Markierung", key: k, text: state.categories.find((x) => x.id === c)?.name ?? "", color: c, tags: tagsOf(k) })),
      ...Object.entries(st.verseTags).filter(([, t]) => t.length).map(([k, t]) => ({ kind: "Tag", key: k, text: t.join(", "), tags: t })),
      ...st.journal.map((j) => ({ kind: "Journal", key: j.ref, text: [j.noticed, j.unclear, j.connection, j.apply].filter(Boolean).join(" · "), date: j.date, tags: [] })),
    ];
    return out
      .filter((h) => book === "all" || h.key.startsWith(book + ":"))
      .filter((h) => tag === "all" || h.tags.includes(tag))
      .filter((h) => color === "all" || h.color === color)
      .filter((h) => !phrase || (h.text + " " + refLabel(h.key)).toLowerCase().includes(phrase))
      .sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? 1 : -1) * (sort === "new" ? 1 : -1));
  }, [state, st, book, tag, color, phrase, sort]);

  const searchText = async () => {
    if (phrase.length < 3) return;
    setBusy(true);
    try {
      const r = (await searchBible(phrase)).results;
      const nr = BIBLE_BOOKS.find((b) => b.code === book)?.nr;
      setBible(nr ? r.filter((x: { book: number }) => x.book === nr) : r);
    } catch { setBible([]); } finally { setBusy(false); }
  };
  const open = (key: string) => { const [b, c, v] = key.split(":"); if (c) router.navigate({ pathname: "/(tabs)/bible", params: { b, ch: c, v: (v ?? "1").split("-")[0] } }); };

  return (
    <StudyScreen title="Suche & Sammlung" sub="Wortgruppen in \u201EAnführungszeichen\u201C, Stellen wie „Joh 3,16“ oder „Röm 8,1–4“" testID="collection-screen">
      <View style={s.row}>
        <TextInput testID="collection-search" value={q} onChangeText={(t) => { setQ(t); setBible(null); }} onSubmitEditing={searchText} placeholder="Suchen …" style={[s.input, { flex: 1 }]} accessibilityLabel="Suche" />
        <Button testID="collection-search-bible" icon="search" label="Bibeltext" onPress={searchText} />
      </View>
      {ref ? <Button testID="collection-goto-ref" variant="secondary" icon="corner-down-right" label={`Zu ${ref.label} springen`} onPress={() => router.navigate({ pathname: "/(tabs)/bible", params: { b: ref.code, ch: String(ref.ch), v: String(ref.v ?? 1) } })} /> : null}
      <Text style={s.h2}>Filter</Text>
      <Choice testID="filter-book" value={book} options={[["all", "Alle Bücher"], ...BIBLE_BOOKS.filter((b) => JSON.stringify(state).includes(`"${b.code}:`)).map((b) => [b.code, b.name] as [string, string])]} onChange={setBook} />
      <Choice testID="filter-tag" value={tag} options={[["all", "Alle Themen"], ...st.tags.map((t) => [t, t] as [string, string])]} onChange={setTag} />
      <Choice testID="filter-color" value={color} options={[["all", "Alle Farben"], ...state.categories.map((c) => [c.id, c.name] as [string, string])]} onChange={setColor} />
      <Choice testID="filter-sort" value={sort} options={[["new", "Neueste zuerst"], ["old", "Älteste zuerst"]]} onChange={setSort} />
      {busy ? <ActivityIndicator /> : null}
      {bible ? (<><Text style={s.h2}>Bibeltext ({bible.length})</Text>{bible.slice(0, 50).map((r, i) => {
        const b = BIBLE_BOOKS.find((x) => x.nr === r.book)!;
        return <Pressable key={i} style={s.card} onPress={() => open(`${b.code}:${r.chapter}:${r.verse}`)} testID={`bible-hit-${i}`}><Text style={s.sub}>{b.name} {r.chapter},{r.verse}</Text><Text style={s.body}>{r.text}</Text></Pressable>;
      })}</>) : null}
      <Text style={s.h2}>Meine Sammlung ({items.length})</Text>
      {items.map((h, i) => (
        <Pressable key={i} testID={`collection-item-${i}`} style={s.card} onPress={() => open(h.key)}>
          <Text style={s.sub}>{h.kind} · {h.key ? refLabel(h.key) : "ohne Stelle"}{h.date ? ` · ${h.date.slice(0, 10)}` : ""}</Text>
          <Text style={s.body} numberOfLines={3}>{h.text}</Text>
          {h.tags.length ? <Text style={s.sub}>#{h.tags.join(" #")}</Text> : null}
        </Pressable>
      ))}
    </StudyScreen>
  );
}
