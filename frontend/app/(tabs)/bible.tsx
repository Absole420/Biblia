import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { AddToPrayerBook } from "@/src/components/PrayerBook";
import { CommentaryPanel, XrefPanel } from "@/src/components/VerseStudy";
import { chapterState, markRead, REVIEW_INTERVALS, today, unmarkRead } from "@/src/lib/study";
import { RefText } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { displayedTranslation, getChapterSync, loadChapter, searchBible, TRANSLATIONS, verseKey } from "@/src/data/bible";
import { BIBLE_BOOKS, BOOK_BY_CODE, parseRef, parseRefs } from "@/src/data/books";
import { ARTICLE_BY_ID, ARTICLES } from "@/src/data/articles";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function BibleScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ b?: string; ch?: string; v?: string; lex?: string }>();
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
  const [vtab, setVtab] = useState<"me" | "comm" | "xref">("me");
  const [rangeTo, setRangeTo] = useState<number | null>(null);
  const [jumpFrom, setJumpFrom] = useState<{ book: string; ch: number; v: number } | null>(null);
  const [tagText, setTagText] = useState("");
  const st = state.study;
  const lh = st.reading.lineHeight;
  const focus = st.reading.focus;
  const restored = useRef(false);
  const pendingVerse = useRef<number | null>(null);
  const listRef = useRef<FlatList>(null);
  const chipsRef = useRef<ScrollView>(null);
  const [optsOpen, setOptsOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const info = BOOK_BY_CODE[book];
  const chosen = TRANSLATIONS[state.settings.translation] ?? TRANSLATIONS.elb1905;
  const tr = displayedTranslation(state.settings.translation);
  const fs = state.settings.fontScale;
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const go = useCallback((code: string, c: number, v?: number) => {
    setBook(code);
    setCh(c);
    pendingVerse.current = v ?? null;
    setTimeout(() => chipsRef.current?.scrollTo({ x: Math.max(0, (c - 3) * 52), animated: true }), 250);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Navigation/Laden aus Parametern und Speicher */
  useEffect(() => {
    if (restored.current || params.ch) return;
    restored.current = true;
    if (st.lastPos) go(st.lastPos.book, st.lastPos.ch, st.lastPos.v);
  }, [st.lastPos, params.ch, go]);

  // Leseposition speichern (nicht während eines Sprungs zu einem Querverweis)
  const savePos = useCallback((v: number) => {
    if (jumpFrom) return;
    p.updateStudy((x) => (x.lastPos?.book === book && x.lastPos?.ch === ch && x.lastPos?.v === v ? x : { ...x, lastPos: { book, ch, v, at: new Date().toISOString() } }));
  }, [book, ch, jumpFrom, p]);
  const posRef = useRef<((v: number) => void) | null>(null);
  useEffect(() => { posRef.current = savePos; }, [savePos]);
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    const i = viewableItems[0]?.index;
    if (i !== null && i !== undefined) posRef.current?.(i + 1);
  });
  const jumpTo = (b: string, c: number, v: number) => {
    if (!jumpFrom) setJumpFrom({ book, ch, v: sel ?? 1 });
    setSel(null);
    go(b, c, v);
  };
  const returnJump = () => { const j = jumpFrom!; setJumpFrom(null); go(j.book, j.ch, j.v); };
  const chState = chapterState(st.read, book, ch);

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
  /* eslint-enable react-hooks/set-state-in-effect */

  const to = sel && rangeTo && rangeTo > sel ? Math.min(rangeTo, verses.length) : null;
  const [prayerOpen, setPrayerOpen] = useState(false);
  const key = sel ? (to ? `${book}:${ch}:${sel}-${to}` : verseKey(book, ch, sel)) : "";
  const label = sel ? `${info.name} ${ch},${sel}${to ? "–" + to : ""}` : "";
  const rangeVerses = sel ? Array.from({ length: (to ?? sel) - sel + 1 }, (_, i) => sel + i) : [];
  const isRead = rangeVerses.length > 0 && rangeVerses.every((v) => st.read[`${book}:${ch}`]?.includes(v));
  const tagsOf = st.verseTags[key] ?? [];
  const existingNote = state.notes.find((n) => n.ref === key);
  const links = useMemo(() => state.links.filter((l) => l.from === key), [state.links, key]);
  const openVerse = (v: number) => {
    setSel(v);
    setRangeTo(null);
    setVtab("me");
    savePos(v);
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

  // Lexikonartikel, deren Bibelstellen den gewählten Vers enthalten
  const lexHits = sel ? ARTICLES.filter((a) => a.refs.some((r) => parseRefs(r).some(({ ref }) => ref && ref.code === book && ref.ch === ch && (!ref.v || (sel >= ref.v && sel <= (ref.vEnd ?? ref.v)))))) : [];
  const favBook = state.favorites.bible.some((f) => f.key === book);
  const favCh = state.favorites.bible.some((f) => f.key === `${book}:${ch}`);

  return (
    <View style={styles.root} testID="bible-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.titleRow}>
          <Pressable style={styles.bookBtn} onPress={() => setPicker(true)} testID="bible-book-picker-button" accessibilityRole="button" accessibilityLabel={`Bibelbuch auswählen, aktuell ${info.name} ${ch}`}>
            <Icon name="book-open" size={18} color={colors.brandPrimary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>{info.name} {ch}</Text>
              <Text style={styles.sub} numberOfLines={1} testID="bible-translation-label">{chosen.id === tr.id ? `Angezeigt: ${tr.name}` : `Angezeigt: ${tr.name} · ${chosen.short} nicht lizenziert`}</Text>
            </View>
            <Icon name="chevron-down" size={20} color={colors.onSurface} />
          </Pressable>
          <Pressable testID="bible-fav-toggle" style={[styles.optBtn, (favBook || favCh) && { backgroundColor: colors.error, borderColor: colors.error }]} onPress={() => setFavOpen(true)} accessibilityRole="button" accessibilityLabel="Buch oder Kapitel als Favorit merken">
            <Icon name="heart" size={18} color={favBook || favCh ? colors.surface : colors.onSurface} />
          </Pressable>
          <Pressable testID="bible-options-toggle" style={[styles.optBtn, optsOpen && { backgroundColor: colors.surfaceInverse }]} onPress={() => setOptsOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: optsOpen }} accessibilityLabel={optsOpen ? "Optionen einklappen" : "Optionen ausklappen"}>
            <Icon name="sliders" size={18} color={optsOpen ? colors.onSurfaceInverse : colors.onSurface} />
            <Icon name={optsOpen ? "chevron-up" : "chevron-down"} size={18} color={optsOpen ? colors.onSurfaceInverse : colors.onSurface} />
          </Pressable>
        </View>
        {optsOpen ? (
          <View style={styles.opts} testID="bible-options-panel">
            {[
              { id: "bible-study-button", icon: "layers", label: "Mein Studium", on: () => router.push("/study") },
              { id: "bible-search-button", icon: "search", label: "Suchen", on: () => setSearchOpen(true) },
              { id: "bible-focus-toggle", icon: focus ? "eye-off" : "eye", label: focus ? "Fokus aus" : "Lesemodus", on: () => p.updateStudy((x) => ({ ...x, reading: { ...x.reading, focus: !x.reading.focus } })), active: focus },
              { id: "bible-lineheight", icon: "align-justify", label: `Zeilen ${lh}`, on: () => p.updateStudy((x) => ({ ...x, reading: { ...x.reading, lineHeight: x.reading.lineHeight >= 2 ? 1.4 : Math.round((x.reading.lineHeight + 0.2) * 10) / 10 } })) },
              { id: "bible-translation-toggle", icon: "globe", label: tr.short, on: () => router.push("/settings") },
            ].map((o) => (
              <Pressable key={o.id} testID={o.id} onPress={o.on} accessibilityRole="button" accessibilityLabel={o.label} style={({ pressed }) => [styles.optItem, o.active && { borderColor: colors.brandPrimary }, pressed && { opacity: 0.7 }]}>
                <Icon name={o.icon} size={20} color={o.active ? colors.brandPrimary : colors.onSurface} />
                <Text style={styles.optText} numberOfLines={1}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <ScrollView ref={chipsRef} horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
          {Array.from({ length: info.chapters }).map((_, i) => (
            <Chip key={book + i} testID={`chapter-chip-${i + 1}`} label={String(i + 1)} selected={ch === i + 1} onPress={() => go(book, i + 1)} />
          ))}
        </ScrollView>
      </View>
      {params.lex && ARTICLE_BY_ID[params.lex] ? (
        <Pressable testID="lexicon-return-button" style={styles.banner} onPress={() => { const id = params.lex!; router.setParams({ lex: undefined }); router.navigate({ pathname: "/lexicon/[id]", params: { id } }); }} accessibilityLabel="Zurück zum Lexikonartikel">
          <Icon name="corner-up-left" size={16} color={colors.brandPrimary} />
          <Text style={styles.bannerText}>Zurück zum Lexikon: {ARTICLE_BY_ID[params.lex].title}</Text>
        </Pressable>
      ) : null}
      {jumpFrom ? (
        <Pressable testID="xref-return-button" style={styles.banner} onPress={returnJump} accessibilityLabel="Zurück zur Ausgangsstelle">
          <Icon name="corner-up-left" size={16} color={colors.brandPrimary} />
          <Text style={styles.bannerText}>Zurück zu {BOOK_BY_CODE[jumpFrom.book].name} {jumpFrom.ch},{jumpFrom.v} (Leseposition bleibt dort gespeichert)</Text>
        </Pressable>
      ) : null}
      {!tr.available && !focus ? (
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
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 800 }}
          onScrollToIndexFailed={(i) => setTimeout(() => listRef.current?.scrollToOffset({ offset: i.averageItemLength * i.index, animated: true }), 100)}
          ListFooterComponent={
            <View>
            <Button
              testID="chapter-mark-read"
              icon={chState === "read" ? "check-circle" : "circle"}
              variant={chState === "read" ? "secondary" : "ghost"}
              label={chState === "read" ? "Kapitel gelesen – rückgängig" : chState === "partial" ? "Teilweise gelesen – ganz markieren" : "Kapitel als gelesen markieren"}
              onPress={() => p.updateStudy((x) => ({ ...x, read: chState === "read" ? unmarkRead(x.read, book, ch) : markRead(x.read, book, ch), readLog: chState === "read" ? x.readLog : [...x.readLog, { date: today(), book, ch }] }))}
            />
            <View style={styles.footerNav}>
              {ch > 1 ? <Button testID="bible-prev-chapter" label={`Kapitel ${ch - 1}`} icon="chevron-left" variant="ghost" onPress={() => go(book, ch - 1)} /> : <View />}
              {ch < info.chapters ? <Button testID="bible-next-chapter" label={`Kapitel ${ch + 1}`} icon="chevron-right" variant="ghost" onPress={() => go(book, ch + 1)} /> : null}
            </View>
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
                <Text style={[styles.verseText, { fontSize: 18 * fs, lineHeight: 18 * fs * lh }]}>
                  <Text style={styles.vnum}>{v}  </Text>
                  {item}
                </Text>
                {!focus && (marked || hasNote || hasLink || inUnit) ? (
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
            <View style={styles.tabRow} accessibilityRole="tablist">
              {([["me", "Persönlich"], ["comm", "Studienkommentare"], ["xref", "Querverweise"]] as const).map(([id, l]) => (
                <Pressable key={id} testID={`verse-tab-${id}`} accessibilityRole="tab" accessibilityState={{ selected: vtab === id }} onPress={() => setVtab(id)} style={[styles.tabBtn, vtab === id && { borderBottomColor: colors.brandPrimary }]}>
                  <Text style={[styles.tabText, vtab === id && { color: colors.brandPrimary }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
            {vtab === "comm" ? <CommentaryPanel book={book} ch={ch} v={sel} /> : null}
            {vtab === "xref" ? <XrefPanel book={book} ch={ch} v={sel} onJump={jumpTo} /> : null}
            {vtab === "me" ? (<>
            <Text style={styles.label}>Bereich</Text>
            <View style={styles.inlineRow}>
              <Text style={styles.rangeText}>V. {sel} bis</Text>
              <Pressable testID="range-minus" style={styles.addBtn} onPress={() => setRangeTo((r) => (r && r > sel + 1 ? r - 1 : null))} accessibilityLabel="Bereich verkleinern"><Icon name="minus" size={18} color={colors.onBrandPrimary} /></Pressable>
              <Text style={styles.rangeText} testID="range-to">{to ?? sel}</Text>
              <Pressable testID="range-plus" style={styles.addBtn} onPress={() => setRangeTo((r) => Math.min(verses.length, (r ?? sel) + 1))} accessibilityLabel="Bereich vergrößern"><Icon name="plus" size={18} color={colors.onBrandPrimary} /></Pressable>
            </View>
            <Button testID="verse-prayer-button" variant={prayerOpen ? "secondary" : "ghost"} icon="feather" label="Ins Gebetsheft" onPress={() => setPrayerOpen((o) => !o)} />
            {prayerOpen ? <AddToPrayerBook refKey={key} text={rangeVerses.length > 1 ? rangeVerses.map((v) => `${v} ${verses[v - 1]}`).join(" ") : verses[sel - 1]} onDone={() => setPrayerOpen(false)} /> : null}
            <View style={[styles.inlineRow, { flexWrap: "wrap" }]}>
              <Button testID="verse-mark-read" icon={isRead ? "check-circle" : "circle"} variant={isRead ? "secondary" : "ghost"} label={isRead ? "Gelesen – rückgängig" : "Als gelesen markieren"} onPress={() => p.updateStudy((x) => ({ ...x, read: isRead ? unmarkRead(x.read, book, ch, rangeVerses) : markRead(x.read, book, ch, rangeVerses) }))} />
              <Button testID="verse-review-add" icon="repeat" variant="ghost" label={st.review.some((r) => r.key === key) ? "In Merkliste" : "Zur Merkliste"} onPress={() => { if (!st.review.some((r) => r.key === key)) p.updateStudy((x) => ({ ...x, review: [...x.review, { key, addedAt: new Date().toISOString(), due: today(), step: 0, intervals: REVIEW_INTERVALS }] })); toast.show("Zur Merkliste hinzugefügt"); }} />
              <Button testID="verse-journal" icon="edit-3" variant="ghost" label="Journal" onPress={() => { setSel(null); router.push({ pathname: "/study/journal", params: { ref: key } }); }} />
            </View>
            <Button
              testID="verse-fav-button"
              variant={state.favorites.bible.some((f) => f.key === verseKey(book, ch, sel)) ? "secondary" : "ghost"}
              icon="heart"
              label={state.favorites.bible.some((f) => f.key === verseKey(book, ch, sel)) ? "Favorit entfernen" : "Als Favorit merken"}
              onPress={() => { const k = verseKey(book, ch, sel); const on = state.favorites.bible.some((f) => f.key === k); p.toggleFavorite("bible", k); toast.show(on ? "Aus Favoriten entfernt" : "Vers als Favorit gemerkt"); }}
            />
            <Button
              testID="verse-bookmark-button"
              variant={state.bookmarks.some((b) => b.key === key) ? "secondary" : "ghost"}
              icon="bookmark"
              label={state.bookmarks.some((b) => b.key === key) ? "Lesezeichen entfernen" : "Lesezeichen setzen"}
              onPress={() => { p.toggleBookmark(key); toast.show("Lesezeichen aktualisiert"); }}
            />
            {lexHits.length ? (
              <>
                <Text style={styles.label}>Im Lexikon</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }} testID="verse-lexicon">
                  {lexHits.map((a) => (
                    <Chip key={a.id} testID={`verse-lex-${a.id}`} label={a.title} onPress={() => { setSel(null); router.push({ pathname: "/lexicon/[id]", params: { id: a.id } }); }} />
                  ))}
                </View>
              </>
            ) : null}
            <Text style={styles.label}>Farbige Markierung</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {state.categories.map((c) => (
                <Chip key={c.id} testID={`highlight-${c.id}`} label={c.name} color={c.color} selected={state.highlights[verseKey(book, ch, sel)] === c.id} onPress={() => { const off = state.highlights[verseKey(book, ch, sel)] === c.id; rangeVerses.forEach((v) => p.setHighlight(verseKey(book, ch, v), off ? null : c.id)); }} />
              ))}
            </ScrollView>

            <Text style={styles.label}>Themen & Tags</Text>
            <View style={[styles.inlineRow, { flexWrap: "wrap" }]}>
              {st.tags.map((t) => (
                <Chip key={t} testID={`tag-${t}`} label={t} selected={tagsOf.includes(t)} onPress={() => p.updateStudy((x) => ({ ...x, verseTags: { ...x.verseTags, [key]: tagsOf.includes(t) ? tagsOf.filter((y) => y !== t) : [...tagsOf, t] } }))} />
              ))}
            </View>
            <View style={styles.inlineRow}>
              <TextInput testID="tag-new-input" value={tagText} onChangeText={setTagText} placeholder="Neues Thema/Tag" placeholderTextColor={colors.muted} style={[styles.inputSm, { flex: 1 }]} />
              <Pressable testID="tag-new-add" style={styles.addBtn} accessibilityLabel="Tag anlegen" onPress={() => { const t = tagText.trim(); if (!t) return; p.updateStudy((x) => ({ ...x, tags: x.tags.includes(t) ? x.tags : [...x.tags, t], verseTags: { ...x.verseTags, [key]: [...new Set([...(x.verseTags[key] ?? []), t])] } })); setTagText(""); }}><Icon name="plus" size={20} color={colors.onBrandPrimary} /></Pressable>
            </View>
            <Text style={styles.label}>Eigener Kommentar / Notiz (nur für dich)</Text>
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
            </>) : null}
          </View>
        ) : null}
      </Sheet>

      {/* Buchauswahl */}
      <Sheet visible={favOpen} onClose={() => setFavOpen(false)} title="Als Favorit merken" testID="bible-fav-sheet">
        <View style={{ gap: spacing.sm }}>
          {([[`${book}:${ch}`, `Kapitel: ${info.name} ${ch}`, favCh, "bible-fav-chapter"], [book, `Buch: ${info.name}`, favBook, "bible-fav-book"]] as const).map(([k, l, on, id]) => (
            <Button key={id} testID={id} icon="heart" variant={on ? "secondary" : "ghost"} label={on ? `${l} – entfernen` : l} onPress={() => { p.toggleFavorite("bible", k); toast.show(on ? "Aus Favoriten entfernt" : "Als Favorit gemerkt"); }} />
          ))}
          <Text style={styles.sub}>Einzelne Verse merkst du über das Vers-Menü (Vers antippen → „Als Favorit merken“).</Text>
        </View>
      </Sheet>
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
  titleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.sm },
  bookBtn: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 56, paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700" },
  optBtn: { flexDirection: "row", alignItems: "center", gap: 2, height: 56, paddingHorizontal: spacing.md, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  opts: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  optItem: { flexGrow: 1, flexBasis: "30%", minWidth: 96, alignItems: "center", justifyContent: "center", gap: 4, minHeight: 60, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  optText: { fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: c.onSurfaceSecondary },
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
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.divider, marginTop: spacing.md, marginBottom: spacing.sm },
  tabBtn: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.muted },
  rangeText: { fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: c.onSurface },
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
