import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { RefText } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { getChapterSync, loadChapter, searchBible, TRANSLATIONS, verseKey } from "@/src/data/bible";
import { BIBLE_BOOKS, BOOK_BY_CODE, parseRef } from "@/src/data/books";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function BibleScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ b?: string; ch?: string; v?: string }>();
  const p = useProgress();
  const { state } = p;
  const [book, setBook] = useState("Joh");
  const [ch, setCh] = useState(1);
  const [verses, setVerses] = useState<string[]>(getChapterSync("Joh", 1) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [picker, setPicker] = useState(false);
  const [bookFilter, setBookFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ book: number; chapter: number; verse: number; text: string }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [reload, setReload] = useState(0);
  const pendingVerse = useRef<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const chipsRef = useRef<ScrollView>(null);
  const info = BOOK_BY_CODE[book];
  const tr = TRANSLATIONS[state.settings.translation];
  const fs = state.settings.fontScale;
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const go = useCallback((code: string, c: number, v?: number) => {
    setBook(code);
    setCh(c);
    pendingVerse.current = v ?? null;
    setTimeout(() => chipsRef.current?.scrollTo({ x: Math.max(0, (c - 3) * 52), animated: true }), 250);
  }, []);

  useEffect(() => {
    if (params.ch) go(params.b && BOOK_BY_CODE[params.b] ? params.b : "Joh", Math.max(1, parseInt(params.ch, 10) || 1), parseInt(params.v ?? "1", 10) || 1);
  }, [params.b, params.ch, params.v, go]);

  useEffect(() => {
    let alive = true;
    setError(null);
    const sync = getChapterSync(book, ch);
    if (sync) setVerses(sync);
    else setLoading(true);
    loadChapter(book, ch)
      .then((vs) => {
        if (!alive) return;
        setVerses(vs);
        const v = pendingVerse.current;
        pendingVerse.current = null;
        setTimeout(() => (v && v > 1 ? listRef.current?.scrollToIndex({ index: Math.min(v - 1, vs.length - 1), animated: true, viewPosition: 0.1 }) : listRef.current?.scrollToOffset({ offset: 0, animated: false })), 300);
      })
      .catch(() => alive && setError("Kapitel konnte nicht geladen werden. Bitte prüfe deine Internetverbindung – bereits gelesene Kapitel sind offline verfügbar."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [book, ch, reload]);

  const key = sel ? verseKey(book, ch, sel) : "";
  const label = sel ? `${info.name} ${ch},${sel}` : "";
  const existingNote = state.notes.find((n) => n.ref === key);
  const links = useMemo(() => state.links.filter((l) => l.from === key), [state.links, key]);
  const openVerse = (v: number) => {
    setSel(v);
    setLinkText("");
    setNoteText(state.notes.find((n) => n.ref === verseKey(book, ch, v))?.text ?? "");
  };
  const catColor = (k: string) => state.categories.find((c) => c.id === state.highlights[k])?.color;
  const books = BIBLE_BOOKS.filter((b) => !bookFilter || b.name.toLowerCase().includes(bookFilter.toLowerCase()) || b.code.toLowerCase().startsWith(bookFilter.toLowerCase()));

  const doSearch = async () => {
    if (q.trim().length < 3) return toast.show("Mindestens 3 Zeichen eingeben", "error");
    setSearching(true);
    try {
      setResults((await searchBible(q.trim())).results);
    } catch {
      toast.show("Suche benötigt eine Internetverbindung", "error");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.root} testID="bible-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <Pressable style={{ flex: 1 }} onPress={() => setPicker(true)} testID="bible-book-picker-button" accessibilityLabel="Buch wählen">
            <View style={styles.bookBtn}>
              <Text style={styles.title} numberOfLines={1}>{info.name} {ch}</Text>
              <Icon name="chevron-down" size={20} color={colors.onSurface} />
            </View>
            <Text style={styles.sub} testID="bible-translation-label">{tr.available ? tr.name : `${TRANSLATIONS.elb1905.name} (NeÜ: Platzhalter)`}</Text>
          </Pressable>
          <Pressable testID="bible-search-button" style={styles.iconBtn} onPress={() => setSearchOpen(true)} accessibilityLabel="Bibel durchsuchen">
            <Icon name="search" size={18} color={colors.onSurface} />
          </Pressable>
          <Pressable testID="bible-translation-toggle" style={styles.trBtn} onPress={() => p.setSettings({ translation: state.settings.translation === "elb1905" ? "neue" : "elb1905" })} accessibilityLabel="Übersetzung wechseln">
            <Text style={styles.trText}>{tr.short}</Text>
          </Pressable>
        </View>
        <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {Array.from({ length: info.chapters }).map((_, i) => (
            <Chip key={book + i} testID={`chapter-chip-${i + 1}`} label={String(i + 1)} selected={ch === i + 1} onPress={() => go(book, i + 1)} />
          ))}
        </ScrollView>
      </View>
      {!tr.available ? (
        <View style={styles.banner} testID="neue-placeholder-banner">
          <Icon name="alert-triangle" size={16} color={colors.warning} />
          <Text style={styles.bannerText}>{tr.license} Angezeigt wird ersatzweise die Elberfelder 1905.</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.center} testID="bible-error">
          <Icon name="wifi-off" size={32} color={colors.muted} />
          <Text style={styles.bannerText}>{error}</Text>
          <Button testID="bible-retry" label="Erneut versuchen" variant="secondary" onPress={() => setReload((r) => r + 1)} />
        </View>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={verses}
          keyExtractor={(_, i) => `${book}-${ch}-${i}`}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: bottomChrome + spacing.xl }}
          onScrollToIndexFailed={(i) => setTimeout(() => listRef.current?.scrollToOffset({ offset: i.averageItemLength * i.index, animated: true }), 100)}
          ListFooterComponent={
            <View style={styles.footerNav}>
              {ch > 1 ? <Button testID="bible-prev-chapter" label={`Kapitel ${ch - 1}`} icon="chevron-left" variant="ghost" onPress={() => go(book, ch - 1)} /> : <View />}
              {ch < info.chapters ? <Button testID="bible-next-chapter" label={`Kapitel ${ch + 1}`} icon="chevron-right" variant="ghost" onPress={() => go(book, ch + 1)} /> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const v = index + 1;
            const k = verseKey(book, ch, v);
            const col = catColor(k);
            const marked = state.bookmarks.some((b) => b.key === k);
            const hasNote = state.notes.some((n) => n.ref === k);
            const hasLink = state.links.some((l) => l.from === k);
            const inUnit = state.units.some((u) => u.refs.includes(k));
            return (
              <Pressable testID={`verse-${ch}-${v}`} onPress={() => openVerse(v)} style={[styles.verse, col ? { backgroundColor: col + "33", borderLeftColor: col } : null]} accessibilityHint="Öffnet Lesezeichen, Markierung, Kommentar, Verknüpfung und Lerneinheit">
                <Text style={[styles.verseText, { fontSize: 18 * fs, lineHeight: 30 * fs }]}>
                  <Text style={styles.vnum}>{v}  </Text>
                  {item}
                </Text>
                {marked || hasNote || hasLink || inUnit ? (
                  <View style={styles.icons}>
                    {marked ? <Icon name="bookmark" size={14} color={colors.brandPrimary} /> : null}
                    {hasNote ? <Icon name="message-square" size={14} color={colors.info} /> : null}
                    {hasLink ? <Icon name="link" size={14} color={colors.success} /> : null}
                    {inUnit ? <Icon name="layers" size={14} color={colors.stationChallenge} /> : null}
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}

      {/* Vers-Werkzeuge */}
      <Sheet visible={sel !== null} onClose={() => setSel(null)} title={label} testID="verse-sheet">
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

            <Text style={styles.label}>Kommentar</Text>
            <TextInput testID="verse-note-input" value={noteText} onChangeText={setNoteText} multiline placeholder="Gedanken, Fragen, Wortstudie …" placeholderTextColor={colors.muted} style={styles.input} />
            <Button
              testID="verse-note-save"
              icon="save"
              variant="secondary"
              label={existingNote ? "Kommentar aktualisieren" : "Kommentar speichern"}
              disabled={!noteText.trim()}
              style={{ marginTop: spacing.sm }}
              onPress={() => { p.saveNote({ id: existingNote?.id, title: label, text: noteText.trim(), ref: key }); toast.show("Kommentar gespeichert"); }}
            />

            <Text style={styles.label}>Verknüpfungen (Querverweise)</Text>
            {links.map((l) => (
              <View key={l.id} style={styles.linkRow} testID={`verse-link-${l.id}`}>
                <Icon name="link" size={14} color={colors.success} />
                <RefText text={l.to} style={styles.linkText} />
                <Pressable onPress={() => p.deleteLink(l.id)} hitSlop={10} testID={`verse-link-delete-${l.id}`} accessibilityLabel="Verknüpfung löschen">
                  <Icon name="x" size={16} color={colors.error} />
                </Pressable>
              </View>
            ))}
            <View style={styles.inlineRow}>
              <TextInput testID="verse-link-input" value={linkText} onChangeText={setLinkText} placeholder="z. B. 1Mo 1,1 oder Röm 3,23" placeholderTextColor={colors.muted} style={[styles.inputSm, { flex: 1 }]} autoCapitalize="none" />
              <Pressable
                testID="verse-link-add"
                style={styles.addBtn}
                accessibilityLabel="Verknüpfung hinzufügen"
                onPress={() => {
                  const r = parseRef(linkText);
                  if (!r) return toast.show("Bibelstelle nicht erkannt", "error");
                  p.addLink(key, `${r.code} ${r.ch}${r.v ? "," + r.v : ""}${r.vEnd ? "–" + r.vEnd : ""}`);
                  setLinkText("");
                  toast.show("Verknüpfung erstellt");
                }}
              >
                <Icon name="plus" size={20} color={colors.onBrandPrimary} />
              </Pressable>
            </View>

            <Text style={styles.label}>Zu Lerneinheit hinzufügen</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              <Chip
                testID="unit-new-from-verse"
                label="+ Neue Lerneinheit"
                onPress={() => {
                  const id = p.saveUnit({ title: `Studie zu ${label}`, refs: [key] });
                  setSel(null);
                  router.push({ pathname: "/unit/[id]", params: { id } });
                }}
              />
              {state.units.map((u) => (
                <Chip
                  key={u.id}
                  testID={`unit-add-${u.id}`}
                  label={u.title}
                  selected={u.refs.includes(key)}
                  onPress={() => { p.saveUnit({ ...u, refs: u.refs.includes(key) ? u.refs.filter((r) => r !== key) : [...u.refs, key] }); toast.show("Lerneinheit aktualisiert"); }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </Sheet>

      {/* Buchauswahl */}
      <Sheet visible={picker} onClose={() => setPicker(false)} title="Buch wählen" testID="book-picker-sheet">
        <TextInput testID="book-filter-input" value={bookFilter} onChangeText={setBookFilter} placeholder="Buch suchen …" placeholderTextColor={colors.muted} style={styles.inputSm} />
        {[["Altes Testament", books.filter((b) => b.nr <= 39)], ["Neues Testament", books.filter((b) => b.nr > 39)]].map(([t, list]) =>
          (list as typeof books).length ? (
            <View key={t as string}>
              <Text style={styles.label}>{t as string}</Text>
              <View style={styles.bookGrid}>
                {(list as typeof books).map((b) => (
                  <Pressable key={b.code} testID={`book-${b.code}`} style={[styles.bookCell, b.code === book && { backgroundColor: colors.surfaceInverse }]} onPress={() => { go(b.code, 1); setPicker(false); setBookFilter(""); }}>
                    <Text style={[styles.bookCode, b.code === book && { color: colors.onSurfaceInverse }]}>{b.code}</Text>
                    <Text style={[styles.bookName, b.code === book && { color: colors.onSurfaceInverse }]} numberOfLines={1}>{b.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null,
        )}
      </Sheet>

      {/* Volltextsuche */}
      <Sheet visible={searchOpen} onClose={() => setSearchOpen(false)} title="Bibel durchsuchen" testID="bible-search-sheet">
        <View style={styles.inlineRow}>
          <TextInput testID="bible-search-input" value={q} onChangeText={setQ} onSubmitEditing={doSearch} returnKeyType="search" placeholder="Wort oder Satz, z. B. Gnade" placeholderTextColor={colors.muted} style={[styles.inputSm, { flex: 1 }]} />
          <Pressable testID="bible-search-submit" style={styles.addBtn} onPress={doSearch} accessibilityLabel="Suchen">
            {searching ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Icon name="search" size={18} color={colors.onBrandPrimary} />}
          </Pressable>
        </View>
        {results ? <Text style={styles.sub}>{results.length} Treffer{results.length >= 60 ? " (erste 60)" : ""}</Text> : null}
        {results?.map((r, i) => {
          const b = BIBLE_BOOKS[r.book - 1];
          return (
            <Pressable key={i} testID={`search-result-${i}`} style={styles.result} onPress={() => { setSearchOpen(false); go(b.code, r.chapter, r.verse); }}>
              <Text style={styles.resultRef}>{b.name} {r.chapter},{r.verse}</Text>
              <Text style={styles.resultText} numberOfLines={3}>{r.text}</Text>
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.divider },
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  bookBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: c.onSurface, flexShrink: 1 },
  sub: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700", marginTop: spacing.xs },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  trBtn: { height: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  trText: { fontFamily: fonts.text, fontWeight: "800", color: c.onSurface, fontSize: 13 },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.xl, alignItems: "center" },
  banner: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.warning },
  bannerText: { flex: 1, fontFamily: fonts.text, fontSize: 13, color: c.onSurfaceSecondary, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.xl },
  verse: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: "transparent", marginBottom: 2 },
  verseText: { fontFamily: fonts.display, color: c.onSurface },
  vnum: { fontFamily: fonts.text, fontSize: 13, color: c.brandPrimary, fontWeight: "800" },
  icons: { flexDirection: "row", gap: 8, marginTop: 4 },
  footerNav: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xl, gap: spacing.sm },
  sheetVerse: { fontFamily: fonts.display, fontSize: 18, lineHeight: 28, color: c.onSurface, marginBottom: spacing.lg },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  input: { minHeight: 90, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  inputSm: { height: 48, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  inlineRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 36 },
  linkText: { flex: 1, fontFamily: fonts.text, fontSize: 15 },
  bookGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bookCell: { width: "31.5%", minHeight: 56, padding: spacing.sm, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, justifyContent: "center" },
  bookCode: { fontFamily: fonts.display, fontSize: 16, fontWeight: "700", color: c.onSurface },
  bookName: { fontFamily: fonts.text, fontSize: 11, color: c.muted, fontWeight: "700" },
  result: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  resultRef: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary },
  resultText: { fontFamily: fonts.display, fontSize: 15, color: c.onSurface, marginTop: 2 },
}));
