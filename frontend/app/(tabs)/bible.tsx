import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { BOOKS, TRANSLATIONS, verseKey } from "@/src/data/bible";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const BOOK = "Joh";

export default function BibleScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ ch?: string; v?: string }>();
  const p = useProgress();
  const { state } = p;
  const [ch, setCh] = useState(1);
  const [sel, setSel] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const listRef = useRef<FlatList>(null);
  const chipsRef = useRef<ScrollView>(null);
  const tr = TRANSLATIONS[state.settings.translation];
  const verses = useMemo(() => TRANSLATIONS.elb1905.getChapter(BOOK, ch) ?? [], [ch]);
  const fs = state.settings.fontScale;
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  useEffect(() => {
    if (params.ch) {
      const c = Math.min(21, Math.max(1, parseInt(params.ch, 10) || 1));
      setCh(c);
      const v = parseInt(params.v ?? "1", 10) || 1;
      setTimeout(() => listRef.current?.scrollToIndex({ index: Math.max(0, v - 1), animated: true, viewPosition: 0.1 }), 350);
      setTimeout(() => chipsRef.current?.scrollTo({ x: Math.max(0, (c - 3) * 52), animated: true }), 300);
    }
  }, [params.ch, params.v]);

  const key = sel ? verseKey(BOOK, ch, sel) : "";
  const existingNote = state.notes.find((n) => n.ref === key);
  const openVerse = (v: number) => {
    setSel(v);
    setNoteText(state.notes.find((n) => n.ref === verseKey(BOOK, ch, v))?.text ?? "");
  };
  const catColor = (k: string) => state.categories.find((c) => c.id === state.highlights[k])?.color;

  return (
    <View style={styles.root} testID="bible-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{BOOKS[BOOK].name} {ch}</Text>
            <Text style={styles.sub} testID="bible-translation-label">{tr.available ? tr.name : `${TRANSLATIONS.elb1905.name} (NeÜ: Platzhalter)`}</Text>
          </View>
          <Pressable
            testID="bible-translation-toggle"
            style={styles.trBtn}
            onPress={() => p.setSettings({ translation: state.settings.translation === "elb1905" ? "neue" : "elb1905" })}
            accessibilityLabel="Übersetzung wechseln"
          >
            <Text style={styles.trText}>{tr.short}</Text>
            <Icon name="repeat" size={14} color={colors.onSurface} />
          </Pressable>
        </View>
        <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {Array.from({ length: BOOKS[BOOK].chapters }).map((_, i) => (
            <Chip key={i} testID={`chapter-chip-${i + 1}`} label={String(i + 1)} selected={ch === i + 1} onPress={() => { setCh(i + 1); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }} />
          ))}
        </ScrollView>
      </View>
      {!tr.available ? (
        <View style={styles.banner} testID="neue-placeholder-banner">
          <Icon name="alert-triangle" size={16} color={colors.warning} />
          <Text style={styles.bannerText}>{tr.license} Angezeigt wird ersatzweise die Elberfelder 1905.</Text>
        </View>
      ) : null}
      <FlatList
        ref={listRef}
        data={verses}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: bottomChrome + spacing.xl }}
        onScrollToIndexFailed={(info) => setTimeout(() => listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true }), 100)}
        ListFooterComponent={<Text style={styles.license}>Elberfelder Bibel 1905 – gemeinfrei. Textquelle: getbible.net</Text>}
        renderItem={({ item, index }) => {
          const v = index + 1;
          const k = verseKey(BOOK, ch, v);
          const col = catColor(k);
          const marked = state.bookmarks.some((b) => b.key === k);
          const hasNote = state.notes.some((n) => n.ref === k);
          return (
            <Pressable testID={`verse-${ch}-${v}`} onPress={() => openVerse(v)} style={[styles.verse, col ? { backgroundColor: col + "33", borderLeftColor: col } : null]} accessibilityHint="Öffnet Lesezeichen, Markierung und Notiz">
              <Text style={[styles.verseText, { fontSize: 18 * fs, lineHeight: 30 * fs }]}>
                <Text style={styles.vnum}>{v}  </Text>
                {item}
              </Text>
              {marked || hasNote ? (
                <View style={styles.icons}>
                  {marked ? <Icon name="bookmark" size={14} color={colors.brandPrimary} /> : null}
                  {hasNote ? <Icon name="edit-3" size={14} color={colors.info} /> : null}
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
      <Sheet visible={sel !== null} onClose={() => setSel(null)} title={`${BOOKS[BOOK].name} ${ch},${sel ?? ""}`} testID="verse-sheet">
        {sel ? (
          <View>
            <Text style={styles.sheetVerse}>{verses[sel - 1]}</Text>
            <Button
              testID="verse-bookmark-button"
              variant={state.bookmarks.some((b) => b.key === key) ? "secondary" : "ghost"}
              icon="bookmark"
              label={state.bookmarks.some((b) => b.key === key) ? "Lesezeichen entfernen" : "Lesezeichen setzen"}
              onPress={() => { p.toggleBookmark(key); toast.show("Lesezeichen aktualisiert"); }}
            />
            <Text style={styles.label}>Farbige Markierung</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {state.categories.map((c) => (
                <Chip key={c.id} testID={`highlight-${c.id}`} label={c.name} color={c.color} selected={state.highlights[key] === c.id} onPress={() => p.setHighlight(key, state.highlights[key] === c.id ? null : c.id)} />
              ))}
            </ScrollView>
            <Text style={styles.label}>Notiz zu diesem Vers</Text>
            <TextInput
              testID="verse-note-input"
              value={noteText}
              onChangeText={setNoteText}
              multiline
              placeholder="Gedanken, Fragen, Querverweise …"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Button
              testID="verse-note-save"
              icon="save"
              label={existingNote ? "Notiz aktualisieren" : "Notiz speichern"}
              disabled={!noteText.trim()}
              style={{ marginTop: spacing.md }}
              onPress={() => {
                p.saveNote({ id: existingNote?.id, title: `${BOOKS[BOOK].name} ${ch},${sel}`, text: noteText.trim(), ref: key });
                toast.show("Notiz gespeichert");
                setSel(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 28, fontWeight: "700", color: c.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700" },
  trBtn: { flexDirection: "row", gap: 6, alignItems: "center", height: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  trText: { fontFamily: fonts.text, fontWeight: "800", color: c.onSurface, fontSize: 13 },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.xl, alignItems: "center" },
  banner: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.warning },
  bannerText: { flex: 1, fontFamily: fonts.text, fontSize: 12, color: c.onSurfaceSecondary },
  verse: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: "transparent", marginBottom: 2 },
  verseText: { fontFamily: fonts.display, color: c.onSurface },
  vnum: { fontFamily: fonts.text, fontSize: 13, color: c.brandPrimary, fontWeight: "800" },
  icons: { flexDirection: "row", gap: 6, marginTop: 4 },
  license: { fontFamily: fonts.text, fontSize: 12, color: c.muted, textAlign: "center", marginTop: spacing.xl },
  sheetVerse: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: c.onSurface, marginBottom: spacing.lg },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  input: { minHeight: 96, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
}));
