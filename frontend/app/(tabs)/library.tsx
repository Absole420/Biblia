import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { VerseSnippet } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { getVerse, verseKeyLabel } from "@/src/data/bible";
import { ALL_STATIONS } from "@/src/data/john";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "notes" | "units" | "bookmarks" | "highlights" | "journal" | "lexicon";
const TABS: { id: Tab; label: string }[] = [
  { id: "notes", label: "Notizen" },
  { id: "units", label: "Lerneinheiten" },
  { id: "bookmarks", label: "Lesezeichen" },
  { id: "highlights", label: "Markierungen" },
  { id: "journal", label: "Lernjournal" },
  { id: "lexicon", label: "Lexikon" },
];

const COVER = "https://images.unsplash.com/photo-1600181982553-ce7d36051c01?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function LibraryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const p = useProgress();
  const { state } = p;
  const [tab, setTab] = useState<Tab>("notes");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ id?: string; title: string; text: string } | null>(null);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const ql = q.trim().toLowerCase();
  const match = (...s: (string | undefined)[]) => !ql || s.some((x) => x?.toLowerCase().includes(ql));

  const openVerse = (key: string) => {
    const [b, ch, v] = key.split(":");
    router.navigate({ pathname: "/bible", params: { b, ch, v } });
  };

  const items = useMemo(() => {
    if (tab === "notes") return state.notes.filter((n) => match(n.title, n.text));
    if (tab === "units") return state.units.filter((u) => match(u.title, u.description, ...u.questions.map((x) => x.q)));
    if (tab === "bookmarks") return state.bookmarks.filter((b) => { const [c, ch, v] = b.key.split(":"); return match(verseKeyLabel(b.key), getVerse(c, +ch, +v)); });
    if (tab === "highlights") return Object.entries(state.highlights).filter(([k]) => { const [c, ch, v] = k.split(":"); return match(verseKeyLabel(k), getVerse(c, +ch, +v)); });
    if (tab === "journal") return ALL_STATIONS.filter((s) => (state.reflections[s.id] ?? []).some((t) => t.trim()) && match(s.title, ...(state.reflections[s.id] ?? [])));
    return ALL_STATIONS.filter((s) => state.stations[s.id] || (state.phase[s.id] ?? 0) > 0).flatMap((s) => s.terms.map((t) => ({ ...t, station: s.title }))).filter((t) => match(t.term, t.explanation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state, ql]);

  const empty = {
    units: "Noch keine eigenen Lerneinheiten. Tippe auf + oder im Bibelleser bei einem Vers auf „Neue Lerneinheit“.",
    notes: "Noch keine Notizen. Tippe im Bibelleser auf einen Vers oder lege hier eine freie Notiz an.",
    bookmarks: "Noch keine Lesezeichen. Tippe im Bibelleser auf einen Vers.",
    highlights: "Noch keine Markierungen. Markiere Verse im Bibelleser mit deinen Themenfarben.",
    journal: "Dein Lernjournal füllt sich mit deinen Reflexionen aus den Stationen.",
    lexicon: "Dein persönliches Lexikon wächst mit jeder Station, die du beginnst.",
  }[tab];

  return (
    <View style={styles.root} testID="library-screen">
      <View>
        <Image source={{ uri: COVER }} style={[styles.cover, { height: 150 + insets.top }]} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(44,40,34,0.2)", "rgba(44,40,34,0.75)"]} style={[styles.coverGrad, { height: 150 + insets.top }]} />
        <View style={[styles.coverText, { top: insets.top + 60 }]}>
          <Text style={styles.coverTitle}>Studienbibliothek</Text>
          <Text style={styles.coverSub}>{state.notes.length} Notizen · {state.bookmarks.length} Lesezeichen · {Object.keys(state.highlights).length} Markierungen</Text>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput testID="library-search-input" value={q} onChangeText={setQ} placeholder="Suchen …" placeholderTextColor={colors.muted} style={styles.search} returnKeyType="search" />
        {q ? (
          <Pressable onPress={() => setQ("")} testID="library-search-clear" hitSlop={10}><Icon name="x-circle" size={18} color={colors.muted} /></Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
        {TABS.map((t) => (
          <Chip key={t.id} testID={`library-tab-${t.id}`} label={t.label} selected={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xxxl + 40 }} keyboardShouldPersistTaps="handled">
        {items.length === 0 ? (
          <View style={styles.empty} testID="library-empty">
            <Icon name="book" size={36} color={colors.borderStrong} />
            <Text style={styles.emptyTitle}>Deine Bibliothek ist hier noch leer.</Text>
            <Text style={styles.emptyText}>{empty}</Text>
          </View>
        ) : null}
        {tab === "notes" && (items as typeof state.notes).map((n) => (
          <Pressable key={n.id} testID={`note-item-${n.id}`} style={styles.card} onPress={() => (n.ref ? openVerse(n.ref) : setEdit({ id: n.id, title: n.title, text: n.text }))}>
            <View style={styles.cardHead}>
              <Icon name={n.ref ? "book-open" : "file-text"} size={16} color={colors.brandPrimary} />
              <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
              <Pressable testID={`note-delete-${n.id}`} onPress={() => { p.deleteNote(n.id); toast.show("Notiz gelöscht"); }} hitSlop={10} accessibilityLabel="Notiz löschen">
                <Icon name="trash-2" size={18} color={colors.error} />
              </Pressable>
            </View>
            <Text style={styles.cardText} numberOfLines={4}>{n.text}</Text>
            <Text style={styles.date}>{new Date(n.updatedAt).toLocaleDateString("de-DE")}</Text>
          </Pressable>
        ))}
        {tab === "units" && (items as typeof state.units).map((u) => (
          <Pressable key={u.id} testID={`unit-item-${u.id}`} style={styles.card} onPress={() => router.push({ pathname: "/unit/[id]", params: { id: u.id } })}>
            <View style={styles.cardHead}>
              <Icon name="layers" size={16} color={colors.stationChallenge} />
              <Text style={styles.cardTitle} numberOfLines={1}>{u.title}</Text>
              <Icon name="chevron-right" size={18} color={colors.muted} />
            </View>
            {u.description ? <Text style={styles.cardText} numberOfLines={2}>{u.description}</Text> : null}
            <Text style={styles.date}>{u.refs.length} Bibelstellen · {u.questions.length} Fragen</Text>
          </Pressable>
        ))}
        {tab === "bookmarks" && (items as typeof state.bookmarks).map((b) => {
          return (
            <Pressable key={b.key} testID={`bookmark-item-${b.key}`} style={styles.card} onPress={() => openVerse(b.key)}>
              <View style={styles.cardHead}>
                <Icon name="bookmark" size={16} color={colors.brandPrimary} />
                <Text style={styles.cardTitle}>{verseKeyLabel(b.key)}</Text>
              </View>
              <VerseSnippet k={b.key} style={styles.verse} />
            </Pressable>
          );
        })}
        {tab === "highlights" && state.categories.map((c) => {
          const list = (items as [string, string][]).filter(([, cat]) => cat === c.id);
          if (!list.length) return null;
          return (
            <View key={c.id} style={{ marginBottom: spacing.lg }}>
              <View style={styles.catHead}>
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={styles.catTitle}>{c.name}</Text>
                <Text style={styles.date}>{list.length}</Text>
              </View>
              {list.map(([k]) => {
                return (
                  <Pressable key={k} testID={`highlight-item-${k}`} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: c.color }]} onPress={() => openVerse(k)}>
                    <Text style={styles.cardTitle}>{verseKeyLabel(k)}</Text>
                    <VerseSnippet k={k} style={styles.verse} />
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        {tab === "journal" && (items as typeof ALL_STATIONS).map((s) => (
          <View key={s.id} style={styles.card} testID={`journal-item-${s.id}`}>
            <View style={styles.cardHead}>
              <Icon name="edit-3" size={16} color={colors.brandPrimary} />
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
            {s.reflection.map((rq, i) => (state.reflections[s.id]?.[i]?.trim() ? (
              <View key={i} style={{ marginTop: spacing.sm }}>
                <Text style={styles.date}>{rq}</Text>
                <Text style={styles.cardText}>{state.reflections[s.id][i]}</Text>
              </View>
            ) : null))}
          </View>
        ))}
        {tab === "lexicon" && (items as { term: string; explanation: string; ref?: string; station: string }[]).map((t) => (
          <View key={t.term + t.station} style={styles.card} testID={`lexicon-item-${t.term}`}>
            <Text style={styles.cardTitle}>{t.term}</Text>
            <Text style={styles.cardText}>{t.explanation}</Text>
            <Text style={styles.date}>{t.ref ? `${t.ref} · ` : ""}{t.station}</Text>
          </View>
        ))}
      </ScrollView>
      {tab === "notes" || tab === "units" ? (
        <Pressable testID={tab === "notes" ? "add-note-fab" : "add-unit-fab"} style={[styles.fab, { bottom: bottomChrome + 16 }]} onPress={() => (tab === "notes" ? setEdit({ title: "", text: "" }) : router.push({ pathname: "/unit/[id]", params: { id: p.saveUnit({ title: "Neue Lerneinheit" }) } }))} accessibilityLabel={tab === "notes" ? "Neue Notiz" : "Neue Lerneinheit"}>
          <Icon name="plus" size={26} color={colors.onBrandPrimary} />
        </Pressable>
      ) : null}
      <Sheet visible={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Notiz bearbeiten" : "Neue Notiz"} testID="note-sheet">
        {edit ? (
          <View style={{ gap: spacing.md }}>
            <TextInput testID="note-title-input" value={edit.title} onChangeText={(t) => setEdit({ ...edit, title: t })} placeholder="Titel (z. B. Eigene Frage, Wortstudie …)" placeholderTextColor={colors.muted} style={styles.inputSm} />
            <TextInput testID="note-text-input" value={edit.text} onChangeText={(t) => setEdit({ ...edit, text: t })} placeholder="Deine Notiz …" placeholderTextColor={colors.muted} multiline style={styles.input} />
            <Button testID="note-save-button" label="Speichern" icon="save" disabled={!edit.title.trim() || !edit.text.trim()} onPress={() => { p.saveNote({ id: edit.id, title: edit.title.trim(), text: edit.text.trim() }); setEdit(null); toast.show("Notiz gespeichert"); }} />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  cover: { width: "100%" },
  coverGrad: { position: "absolute", left: 0, right: 0, top: 0 },
  coverText: { position: "absolute", left: spacing.xl, right: spacing.xl },
  coverTitle: { fontFamily: fonts.display, fontSize: 30, fontWeight: "700", color: "#F9F3E8" },
  coverSub: { fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: "#F2E8D5", marginTop: 4 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingHorizontal: spacing.lg, height: 48, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  search: { flex: 1, fontFamily: fonts.text, fontSize: 16, color: c.onSurface, height: 48 },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { flex: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  cardText: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: c.onSurfaceSecondary, marginTop: spacing.sm },
  verse: { fontFamily: fonts.display, fontSize: 16, lineHeight: 24, color: c.onSurfaceSecondary, marginTop: spacing.sm },
  date: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700", marginTop: spacing.sm },
  catHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  catDot: { width: 14, height: 14, borderRadius: 7 },
  catTitle: { flex: 1, fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: "600", color: c.onSurface, textAlign: "center" },
  emptyText: { fontFamily: fonts.text, fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 21 },
  fab: { position: "absolute", right: spacing.xl, width: 60, height: 60, borderRadius: 30, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", shadowColor: c.brandPrimary, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6 },
  inputSm: { height: 52, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  input: { minHeight: 140, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
}));
