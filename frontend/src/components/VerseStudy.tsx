import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { getChapterSync, loadChapter } from "@/src/data/bible";
import { BIBLE_BOOKS, BOOK_BY_CODE } from "@/src/data/books";
import { typedXrefs, XKIND_META } from "@/src/data/xrefTyped";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";

const API = process.env.EXPO_PUBLIC_BACKEND_URL;
const byNr = (nr: number) => BIBLE_BOOKS.find((b) => b.nr === nr)!;

/** Lädt Studieninhalte (getrennt von persönlichen Daten) und speichert erlaubte Inhalte für die Offline-Nutzung. */
async function cached<T>(path: string): Promise<T | null> {
  const key = `study-content:${path}`;
  try {
    const res = await fetch(`${API}/api${path}`);
    if (res.ok) { const j = await res.json(); AsyncStorage.setItem(key, JSON.stringify(j)).catch(() => {}); return j; }
  } catch { /* offline */ }
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export type Source = { id: string; type: string; title: string; author: string; language: string; edition: string; year: string; url: string; license: string; rights: Record<string, boolean>; perspective: string; historical: boolean; status: string; coverage?: string };
type Entry = { id: string; source: string; book: number; chapter: number; from: number; to: number; scope: "verse" | "range" | "section" | "chapter"; title: string; text: string };
const SCOPE: Record<Entry["scope"], string> = { verse: "Einzelvers", range: "Versbereich", section: "Abschnitt", chapter: "ganzes Kapitel" };

export function useSources() {
  const [s, setS] = useState<Source[] | null>(null);
  useEffect(() => { cached<{ sources: Source[] }>("/study/sources").then((r) => setS(r?.sources ?? [])); }, []);
  return s;
}

/** Studienkommentare externer Autoren – klar getrennt von eigenen Kommentaren. */
export function CommentaryPanel({ book, ch, v }: { book: string; ch: number; v: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { state, updateStudy } = useProgress();
  const sources = useSources();
  const key = `${book}:${ch}`;
  const [data, setData] = useState<{ key: string; entries: Entry[] } | null>(null);
  const [compare, setCompare] = useState(false);
  useEffect(() => { cached<{ entries: Entry[] }>(`/study/commentary/${BOOK_BY_CODE[book].nr}/${ch}`).then((r) => setData({ key: `${book}:${ch}`, entries: r?.entries ?? [] })); }, [book, ch]);
  const entries = data?.key === key ? data.entries : null;
  if (!entries || !sources) return <ActivityIndicator color={colors.brandPrimary} />;
  const pref = state.study.prefSources;
  const hits = entries.filter((e) => e.from <= v && e.to >= v && (!pref.length || pref.includes(e.source)));
  const commSources = sources.filter((s) => s.type === "commentary");
  return (
    <View testID="commentary-panel">
      <Text style={styles.hint}>Veröffentlichte Auslegungen anderer Autoren – nicht deine eigenen Notizen.</Text>
      <View style={styles.row}>
        {commSources.filter((s) => s.status === "integrated").map((s) => {
          const on = !pref.length || pref.includes(s.id);
          return (
            <Pressable key={s.id} testID={`source-filter-${s.id}`} style={[styles.chip, on && styles.chipOn]} onPress={() => updateStudy((st) => ({ ...st, prefSources: on ? commSources.filter((x) => x.status === "integrated" && x.id !== s.id && (!pref.length || pref.includes(x.id))).map((x) => x.id) : [...pref, s.id] }))}>
              <Text style={[styles.chipText, on && { color: colors.onBrandPrimary }]}>{s.author.split(" (")[0]}</Text>
            </Pressable>
          );
        })}
        {hits.length > 1 ? <Pressable testID="commentary-compare" style={styles.chip} onPress={() => setCompare((c) => !c)}><Text style={styles.chipText}>{compare ? "Liste" : "Vergleichen"}</Text></Pressable> : null}
      </View>
      {hits.length === 0 ? (
        <View style={styles.empty} testID="commentary-empty">
          <Icon name="book" size={20} color={colors.muted} />
          <Text style={styles.body}>Für diesen Vers ist noch kein zulässig eingebundener Studienkommentar vorhanden. Wir zeigen bewusst keine erfundenen oder ungeprüften Texte.</Text>
        </View>
      ) : (
        <View style={compare ? { flexDirection: "row", gap: spacing.sm } : undefined}>
          {hits.map((e) => {
            const s = sources.find((x) => x.id === e.source);
            const range = `${BOOK_BY_CODE[book].name} ${e.chapter},${e.from}${e.to !== e.from ? "–" + e.to : ""}`;
            return (
              <View key={e.id} style={[styles.card, compare && { flex: 1 }]} testID={`commentary-${e.id}`}>
                <View style={styles.badge}><Icon name="book-open" size={12} color={colors.info} /><Text style={styles.badgeText}>Studienkommentar · {s?.historical ? "historische Auslegung" : "Auslegung"}</Text></View>
                <Text style={styles.title}>{s?.author} – {s?.title}</Text>
                <Text style={styles.meta} testID={`commentary-scope-${e.id}`}>Behandelt: {range} ({SCOPE[e.scope]}){e.scope !== "verse" ? " – keine Einzelerklärung zu V. " + v : ""}</Text>
                <Text style={styles.meta}>Sprache: {s?.language === "en" ? "Englisch (Originaltext, nicht übersetzt)" : s?.language} · {s?.edition} · {s?.year}</Text>
                <Text style={styles.body}>{e.text}</Text>
                <Text style={styles.meta}>Einordnung: {s?.perspective}</Text>
                <Text style={styles.meta}>Rechte: {s?.license}</Text>
                {s?.url ? <Pressable onPress={() => Linking.openURL(s.url)} accessibilityRole="link" style={styles.link}><Icon name="external-link" size={13} color={colors.brandPrimary} /><Text style={styles.linkText}>Quelle (externer Link)</Text></Pressable> : null}
              </View>
            );
          })}
        </View>
      )}
      <Text style={styles.sub}>Weitere Quellen (nur verlinkt bzw. noch nicht geprüft)</Text>
      {commSources.filter((s) => s.status !== "integrated").map((s) => (
        <Pressable key={s.id} onPress={() => Linking.openURL(s.url)} style={styles.link} accessibilityRole="link" testID={`source-link-${s.id}`}>
          <Icon name="external-link" size={13} color={colors.brandPrimary} /><Text style={styles.linkText}>{s.title} – {s.status === "link" ? "externer Link, keine Einbindungserlaubnis" : "noch nicht eingebunden"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type Row = [number, number, number, number, number, number, number, number];

/** Querverweise: kuratiert & klassifiziert sowie unklassifiziert (OpenBible, CC BY). Vorschau → Sprung in den Kontext. */
export function XrefPanel({ book, ch, v, onJump }: { book: string; ch: number; v: number; onJump: (b: string, c: number, v: number) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const rKey = `${book}:${ch}`;
  const [rowData, setRowData] = useState<{ key: string; refs: Row[] } | null>(null);
  const [preview, setPreview] = useState<{ key: string; text: string } | null>(null);
  useEffect(() => { cached<{ refs: Row[] }>(`/study/xref/${BOOK_BY_CODE[book].nr}/${ch}`).then((r) => setRowData({ key: `${book}:${ch}`, refs: r?.refs ?? [] })); }, [book, ch]);
  const rows = rowData?.key === rKey ? rowData.refs : null;
  const typed = typedXrefs(book, ch, v);
  const auto = (rows ?? []).filter((r) => r[0] === v).slice(0, 12);
  const show = async (b: string, c: number, from: number, to: number, key: string) => {
    if (preview?.key === key) return setPreview(null);
    const vs = getChapterSync(b, c) ?? (await loadChapter(b, c).catch(() => null));
    setPreview({ key, text: vs ? vs.slice(from - 1, to).map((t, i) => `${from + i} ${t}`).join(" ") : "Offline nicht verfügbar." });
  };
  const Item = ({ b, c, from, to, label, sub, warn, k }: { b: string; c: number; from: number; to: number; label: string; sub?: string; warn?: boolean; k: string }) => (
    <View style={styles.card}>
      <Pressable testID={`xref-${k}`} onPress={() => show(b, c, from, to, k)} accessibilityLabel={`Vorschau ${label}`}>
        <Text style={styles.title}>{label}</Text>
        {sub ? <Text style={styles.meta}>{sub}</Text> : null}
        {warn ? <Text style={[styles.meta, { color: colors.warning }]}>Verszählung kann abweichen (Quelle nach KJV) – Zuordnung prüfen.</Text> : null}
      </Pressable>
      {preview?.key === k ? (
        <>
          <Text style={styles.body} testID="xref-preview">{preview.text}</Text>
          <Pressable testID="xref-open-context" style={styles.link} onPress={() => onJump(b, c, from)}><Icon name="corner-down-right" size={13} color={colors.brandPrimary} /><Text style={styles.linkText}>Im Zusammenhang lesen</Text></Pressable>
        </>
      ) : null}
    </View>
  );
  return (
    <View testID="xref-panel">
      {typed.map((x, i) => {
        const [b, c, vv] = x.target.split(":");
        return <Item key={"t" + i} k={`t${i}`} b={b} c={+c} from={+vv} to={x.to ?? +vv} label={`${BOOK_BY_CODE[b].name} ${c},${vv}${x.to ? "–" + x.to : ""}`} sub={`${XKIND_META[x.kind].label} – ${x.note}${x.debate ? " Abweichende Deutung: " + x.debate : ""}`} />;
      })}
      {rows === null ? <ActivityIndicator color={colors.brandPrimary} /> : null}
      {auto.length ? <Text style={styles.sub}>Verwandte Stellen (OpenBible.info, CC BY – nicht nach Art klassifiziert)</Text> : null}
      {auto.map((r, i) => {
        const b = byNr(r[1]);
        const label = `${b.name} ${r[2]},${r[3]}${r[4] !== r[2] ? "–" + r[4] + "," + r[5] : r[5] !== r[3] ? "–" + r[5] : ""}`;
        return <Item key={"a" + i} k={`a${i}`} b={b.code} c={r[2]} from={r[3]} to={r[4] === r[2] ? r[5] : r[3]} label={label} sub={`${r[6]} Stimmen`} warn={!!r[7] || b.code === "Ps"} />;
      })}
      {rows && !auto.length && !typed.length ? <Text style={styles.body} testID="xref-empty">Keine Querverweise zu diesem Vers vorhanden.</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  hint: { fontFamily: fonts.text, fontSize: 13, color: c.muted, marginBottom: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  chip: { minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, justifyContent: "center", backgroundColor: c.surfaceSecondary },
  chipOn: { backgroundColor: c.info, borderColor: c.info },
  chipText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurface },
  empty: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary },
  card: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderLeftWidth: 4, borderLeftColor: c.info, marginBottom: spacing.sm, gap: 4 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.info, textTransform: "uppercase" },
  title: { fontFamily: fonts.display, fontSize: 15, fontWeight: "700", color: c.onSurface },
  meta: { fontFamily: fonts.text, fontSize: 12, color: c.muted },
  body: { fontFamily: fonts.text, fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 21 },
  sub: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted, marginTop: spacing.md, marginBottom: spacing.xs },
  link: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  linkText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary },
}));
