import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FavHeart } from "@/src/components/FavHeart";
import { Icon } from "@/src/components/Icon";
import { InfoChip } from "@/src/components/InfoSheet";
import { PhotoAdd } from "@/src/components/PhotoAdd";
import { VerseSnippet } from "@/src/components/RefText";
import { Sheet } from "@/src/components/Sheet";
import { useToast } from "@/src/components/Toast";
import { Button, Chip } from "@/src/components/ui";
import { BOOK_BY_CODE } from "@/src/data/books";
import { getVerse } from "@/src/data/bible";
import { ALL_STATIONS } from "@/src/data/john";
import { LEXICON } from "@/src/data/lexicon";
import { bibleKeyLabel, bibleOrder, splitKey, STATION_INFO } from "@/src/lib/libraryIndex";
import { deletePhotoFile } from "@/src/lib/photos";
import { Photo } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "mine" | "favBible" | "favLessons" | "photos" | "units" | "lexicon";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "mine", label: "Meine Einträge", icon: "edit-3" },
  { id: "favBible", label: "Favoriten Bibel", icon: "heart" },
  { id: "favLessons", label: "Favoriten Studienreise", icon: "heart" },
  { id: "photos", label: "Bilder", icon: "image" },
  { id: "units", label: "Lerneinheiten", icon: "layers" },
  { id: "lexicon", label: "Lexikon", icon: "book" },
];

const pl = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const COVER = "https://images.unsplash.com/photo-1600181982553-ce7d36051c01?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

/** Alle eigenen Einträge zu einem Vers bzw. einer Lektion. */
type VerseEntry = { key: string; notes: { id: string; title: string; text: string }[]; highlight?: string; bookmark: boolean; photos: Photo[] };
type LessonEntry = { id: string; notes: { id: string; title: string; text: string }[]; reflections: { q: string; a: string }[]; photos: Photo[] };

export default function LibraryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const p = useProgress();
  const { state } = p;
  const [tab, setTab] = useState<Tab>("mine");
  const [area, setArea] = useState<"bible" | "journey">("bible");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ id?: string; title: string; text: string } | null>(null);
  const [photoAdd, setPhotoAdd] = useState(false);
  const [photoEdit, setPhotoEdit] = useState<Photo | null>(null);
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const ql = q.trim().toLowerCase();
  const match = (...s: (string | undefined)[]) => !ql || s.some((x) => x?.toLowerCase().includes(ql));

  const openVerse = (key: string) => {
    const { book, ch, v } = splitKey(key);
    router.navigate({ pathname: "/bible", params: { b: book, ch: String(ch || 1), ...(v ? { v: String(v) } : {}) } });
  };
  const openStation = (id: string) => router.push({ pathname: "/station/[id]", params: { id } });

  // ---- Bibel: alle eigenen Einträge je Vers, sortiert nach Buch → Kapitel → Vers
  const verseGroups = useMemo(() => {
    const m: Record<string, VerseEntry> = {};
    const get = (key: string) => (m[key] ??= { key, notes: [], bookmark: false, photos: [] });
    state.notes.filter((n) => n.ref).forEach((n) => get(n.ref!).notes.push(n));
    Object.entries(state.highlights).forEach(([k, c]) => { get(k).highlight = c; });
    state.bookmarks.forEach((b) => { get(b.key).bookmark = true; });
    state.photos.forEach((ph) => { if (ph.target.kind === "verse") get(ph.target.ref).photos.push(ph); });
    const list = Object.values(m)
      .filter((e) => { const { book, ch, v } = splitKey(e.key); return match(bibleKeyLabel(e.key), getVerse(book, ch, v), ...e.notes.map((n) => n.text), ...e.photos.map((x) => x.title + " " + x.note)); })
      .sort((a, b) => bibleOrder(a.key) - bibleOrder(b.key));
    const byBook: { book: string; items: VerseEntry[] }[] = [];
    list.forEach((e) => {
      const b = splitKey(e.key).book;
      if (byBook[byBook.length - 1]?.book !== b) byBook.push({ book: b, items: [] });
      byBook[byBook.length - 1].items.push(e);
    });
    return byBook;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notes, state.highlights, state.bookmarks, state.photos, ql]);
  const freeNotes = state.notes.filter((n) => !n.ref && !n.stationId && match(n.title, n.text));

  // ---- Studienreise: Notizen, Reflexionen, Fotos je Lektion, sortiert nach Lernwelt → Lektion → Station
  const lessonGroups = useMemo(() => {
    const m: Record<string, LessonEntry> = {};
    const get = (id: string) => (m[id] ??= { id, notes: [], reflections: [], photos: [] });
    state.notes.filter((n) => n.stationId && STATION_INFO[n.stationId]).forEach((n) => get(n.stationId!).notes.push(n));
    Object.entries(state.reflections).forEach(([id, ans]) => {
      const info = STATION_INFO[id];
      if (!info) return;
      ans.forEach((a, i) => { if (a?.trim()) get(id).reflections.push({ q: info.station.reflection[i] ?? "Reflexion", a }); });
    });
    state.photos.forEach((ph) => { if (ph.target.kind === "station" && STATION_INFO[ph.target.id]) get(ph.target.id).photos.push(ph); });
    const list = Object.values(m)
      .filter((e) => e.notes.length || e.reflections.length || e.photos.length)
      .filter((e) => match(STATION_INFO[e.id].station.title, ...e.notes.map((n) => n.text), ...e.reflections.map((r) => r.a), ...e.photos.map((x) => x.title + " " + x.note)))
      .sort((a, b) => STATION_INFO[a.id].order - STATION_INFO[b.id].order);
    const byWorld: { world: string; items: LessonEntry[] }[] = [];
    list.forEach((e) => {
      const w = STATION_INFO[e.id].world.id;
      if (byWorld[byWorld.length - 1]?.world !== w) byWorld.push({ world: w, items: [] });
      byWorld[byWorld.length - 1].items.push(e);
    });
    return byWorld;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notes, state.reflections, state.photos, ql]);

  const favBible = useMemo(() => {
    const list = state.favorites.bible.filter((f) => match(bibleKeyLabel(f.key))).sort((a, b) => bibleOrder(a.key) - bibleOrder(b.key));
    const lvl = (k: string) => k.split(":").length;
    return [
      { title: "Bücher", icon: "book", items: list.filter((f) => lvl(f.key) === 1) },
      { title: "Kapitel", icon: "bookmark", items: list.filter((f) => lvl(f.key) === 2) },
      { title: "Verse", icon: "align-left", items: list.filter((f) => lvl(f.key) >= 3) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.favorites.bible, ql]);
  const favLessons = state.favorites.lessons
    .filter((f) => STATION_INFO[f.key] && match(STATION_INFO[f.key].station.title, STATION_INFO[f.key].campaign.title))
    .sort((a, b) => STATION_INFO[a.key].order - STATION_INFO[b.key].order);
  const photos = state.photos.filter((ph) => match(ph.title, ph.note, ph.target.kind === "verse" ? bibleKeyLabel(ph.target.ref) : STATION_INFO[ph.target.id]?.station.title));
  const units = state.units.filter((u) => match(u.title, u.description, ...u.questions.map((x) => x.q)));
  const terms = ALL_STATIONS.filter((s) => state.stations[s.id] || (state.phase[s.id] ?? 0) > 0).flatMap((s) => s.terms.map((t) => ({ ...t, station: s.title }))).filter((t) => match(t.term, t.explanation));

  const cat = (id?: string) => state.categories.find((c) => c.id === id);
  const targetLabel = (ph: Photo) => (ph.target.kind === "verse" ? bibleKeyLabel(ph.target.ref) : STATION_INFO[ph.target.id]?.station.title ?? "Lektion");

  return (
    <View style={styles.root} testID="library-screen">
      <View>
        <Image source={{ uri: COVER }} style={[styles.cover, { height: 130 + insets.top }]} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(44,40,34,0.2)", "rgba(44,40,34,0.75)"]} style={[styles.coverGrad, { height: 130 + insets.top }]} />
        <View style={[styles.coverText, { top: insets.top + 48 }]}>
          <Text style={styles.coverTitle}>Studienbibliothek</Text>
          <Text style={styles.coverSub}>{pl(state.notes.length, "Notiz", "Notizen")} · {pl(Object.keys(state.highlights).length, "Markierung", "Markierungen")} · {pl(state.favorites.bible.length + state.favorites.lessons.length, "Favorit", "Favoriten")} · {pl(state.photos.length, "Bild", "Bilder")}</Text>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput testID="library-search-input" value={q} onChangeText={setQ} placeholder="Suchen …" placeholderTextColor={colors.muted} style={styles.search} returnKeyType="search" />
        {q ? <Pressable onPress={() => setQ("")} testID="library-search-clear" hitSlop={10}><Icon name="x-circle" size={18} color={colors.muted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
        {TABS.map((t) => <Chip key={t.id} testID={`library-tab-${t.id}`} label={t.label} selected={tab === t.id} onPress={() => setTab(t.id)} />)}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottomChrome + spacing.xxxl + 40 }} keyboardShouldPersistTaps="handled">
        {tab === "mine" ? (
          <>
            <View style={styles.seg}>
              {([["bible", "book-open", "Bibel"], ["journey", "compass", "Studienreise"]] as const).map(([k, ic, l]) => (
                <Pressable key={k} testID={`library-area-${k}`} onPress={() => setArea(k)} style={[styles.segBtn, area === k && { backgroundColor: k === "bible" ? colors.info : colors.stationNarrative }]} accessibilityRole="button" accessibilityState={{ selected: area === k }}>
                  <Icon name={ic} size={16} color={area === k ? colors.surface : colors.onSurfaceSecondary} />
                  <Text style={[styles.segText, { color: area === k ? colors.surface : colors.onSurfaceSecondary }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
            {area === "bible" ? (
              <>
                {!verseGroups.length && !freeNotes.length ? <Empty text="Tippe im Bibelleser auf einen Vers, um Kommentare, Markierungen oder Lesezeichen anzulegen." /> : null}
                {verseGroups.map((g) => (
                  <View key={g.book} style={{ marginBottom: spacing.md }} testID={`library-book-${g.book}`}>
                    <View style={styles.groupHead}>
                      <View style={[styles.groupBar, { backgroundColor: colors.info }]} />
                      <Text style={styles.groupTitle}>{BOOK_BY_CODE[g.book]?.name ?? g.book}</Text>
                      <Text style={styles.count}>{g.items.length}</Text>
                    </View>
                    {g.items.map((e) => {
                      const c = cat(e.highlight);
                      return (
                        <Pressable key={e.key} testID={`verse-entry-${e.key}`} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: c?.color ?? colors.info }]} onPress={() => openVerse(e.key)}>
                          <View style={styles.cardHead}>
                            <Text style={styles.cardTitle}>{bibleKeyLabel(e.key)}</Text>
                            <Icon name="chevron-right" size={18} color={colors.muted} />
                          </View>
                          <View style={styles.badges}>
                            {e.notes.length ? <TypeBadge icon="message-square" label="Kommentar" color={colors.info} /> : null}
                            {c ? <TypeBadge icon="edit-2" label={c.name} color={c.color} /> : null}
                            {e.bookmark ? <TypeBadge icon="bookmark" label="Lesezeichen" color={colors.brandPrimary} /> : null}
                            {e.photos.length ? <TypeBadge icon="image" label={`${e.photos.length} Bild${e.photos.length > 1 ? "er" : ""}`} color={colors.stationChallenge} /> : null}
                          </View>
                          {e.key.split(":").length >= 3 ? <VerseSnippet k={e.key} style={[styles.verse, c ? { backgroundColor: c.color + "22" } : null]} /> : null}
                          {e.notes.map((n) => (
                            <View key={n.id} style={styles.noteRow} testID={`note-item-${n.id}`}>
                              <Text style={styles.cardText}>{n.text}</Text>
                              <Pressable testID={`note-delete-${n.id}`} onPress={() => { p.deleteNote(n.id); toast.show("Kommentar gelöscht"); }} hitSlop={10} accessibilityLabel="Kommentar löschen">
                                <Icon name="trash-2" size={16} color={colors.error} />
                              </Pressable>
                            </View>
                          ))}
                          <Thumbs list={e.photos} onOpen={setViewPhoto} />
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                {freeNotes.length ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <View style={styles.groupHead}>
                      <View style={[styles.groupBar, { backgroundColor: colors.brandPrimary }]} />
                      <Text style={styles.groupTitle}>Freie Notizen</Text>
                      <Text style={styles.count}>{freeNotes.length}</Text>
                    </View>
                    {freeNotes.map((n) => (
                      <Pressable key={n.id} testID={`note-item-${n.id}`} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: colors.brandPrimary }]} onPress={() => setEdit({ id: n.id, title: n.title, text: n.text })}>
                        <View style={styles.cardHead}>
                          <Icon name="file-text" size={16} color={colors.brandPrimary} />
                          <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
                          <Pressable testID={`note-delete-${n.id}`} onPress={() => { p.deleteNote(n.id); toast.show("Notiz gelöscht"); }} hitSlop={10} accessibilityLabel="Notiz löschen">
                            <Icon name="trash-2" size={18} color={colors.error} />
                          </Pressable>
                        </View>
                        <Text style={styles.cardText} numberOfLines={4}>{n.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                {!lessonGroups.length ? <Empty text="Notizen und Reflexionen aus den Lektionen der Studienreise erscheinen hier – sortiert nach Lernwelt und Lektion." /> : null}
                {lessonGroups.map((g) => {
                  const w = STATION_INFO[g.items[0].id].world;
                  return (
                    <View key={g.world} style={{ marginBottom: spacing.md }} testID={`library-world-${g.world}`}>
                      <View style={styles.groupHead}>
                        <View style={[styles.groupBar, { backgroundColor: w.palette.base }]} />
                        <Text style={styles.groupTitle}>{w.title}</Text>
                        <Text style={styles.count}>{g.items.length}</Text>
                      </View>
                      {g.items.map((e) => {
                        const info = STATION_INFO[e.id];
                        return (
                          <Pressable key={e.id} testID={`lesson-entry-${e.id}`} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: w.palette.base }]} onPress={() => openStation(e.id)}>
                            <View style={styles.cardHead}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{info.station.title}</Text>
                                <Text style={styles.date}>{info.campaign.title}</Text>
                              </View>
                              <Icon name="chevron-right" size={18} color={colors.muted} />
                            </View>
                            <View style={styles.badges}>
                              {e.notes.length ? <TypeBadge icon="message-square" label="Notiz" color={colors.info} /> : null}
                              {e.reflections.length ? <TypeBadge icon="edit-3" label="Reflexion" color={colors.stationNarrative} /> : null}
                              {e.photos.length ? <TypeBadge icon="image" label={`${e.photos.length} Bild${e.photos.length > 1 ? "er" : ""}`} color={colors.stationChallenge} /> : null}
                            </View>
                            {e.notes.map((n) => (
                              <View key={n.id} style={styles.noteRow} testID={`note-item-${n.id}`}>
                                <Text style={styles.cardText}>{n.text}</Text>
                                <Pressable testID={`note-delete-${n.id}`} onPress={() => { p.deleteNote(n.id); toast.show("Notiz gelöscht"); }} hitSlop={10} accessibilityLabel="Notiz löschen">
                                  <Icon name="trash-2" size={16} color={colors.error} />
                                </Pressable>
                              </View>
                            ))}
                            {e.reflections.map((r, i) => (
                              <View key={i} style={{ marginTop: spacing.sm }}>
                                <Text style={styles.date}>{r.q}</Text>
                                <Text style={styles.cardText}>{r.a}</Text>
                              </View>
                            ))}
                            <Thumbs list={e.photos} onOpen={setViewPhoto} />
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </>
            )}
          </>
        ) : null}

        {tab === "favBible" ? (
          <>
            {!state.favorites.bible.length ? <Empty text="Tippe im Bibelleser oben auf das Herz (Buch oder Kapitel) oder im Vers-Menü auf „Favorit“." /> : null}
            {favBible.map((sec) => (sec.items.length ? (
              <View key={sec.title} style={{ marginBottom: spacing.md }}>
                <View style={styles.groupHead}>
                  <View style={[styles.groupBar, { backgroundColor: colors.error }]} />
                  <Text style={styles.groupTitle}>{sec.title}</Text>
                  <Text style={styles.count}>{sec.items.length}</Text>
                </View>
                {sec.items.map((f) => (
                  <Pressable key={f.key} testID={`fav-bible-${f.key}`} style={[styles.card, styles.favRow]} onPress={() => openVerse(f.key)}>
                    <Icon name={sec.icon} size={18} color={colors.info} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{bibleKeyLabel(f.key)}</Text>
                      {f.key.split(":").length >= 3 ? <VerseSnippet k={f.key} style={styles.verse} /> : null}
                    </View>
                    <FavHeart active onPress={() => p.toggleFavorite("bible", f.key)} label={bibleKeyLabel(f.key)} testID={`fav-bible-remove-${f.key}`} size={40} />
                  </Pressable>
                ))}
              </View>
            ) : null))}
          </>
        ) : null}

        {tab === "favLessons" ? (
          <>
            {!favLessons.length ? <Empty text="Tippe in einer Lektion oder auf der Karte auf das Herz, um Lektionen zu speichern, die dir besonders gefallen." /> : null}
            {favLessons.map((f) => {
              const info = STATION_INFO[f.key];
              return (
                <Pressable key={f.key} testID={`fav-lesson-${f.key}`} style={[styles.card, styles.favRow, { borderLeftWidth: 5, borderLeftColor: info.world.palette.base }]} onPress={() => openStation(f.key)}>
                  <View style={[styles.lessonIcon, { backgroundColor: info.world.palette.base }]}><Icon name={info.station.icon} size={18} color={info.world.palette.ink} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{info.station.title}</Text>
                    <Text style={styles.date} numberOfLines={1}>{info.world.title} · {info.campaign.title}{state.stations[f.key] ? " · abgeschlossen" : ""}</Text>
                  </View>
                  <FavHeart active onPress={() => p.toggleFavorite("lessons", f.key)} label={info.station.title} testID={`fav-lesson-remove-${f.key}`} size={40} />
                </Pressable>
              );
            })}
          </>
        ) : null}

        {tab === "photos" ? (
          <>
            {!photos.length ? <Empty text="Nimm ein Foto auf oder lade eines hoch und ordne es einer Bibelstelle oder Lektion zu. Bilder bleiben nur auf diesem Gerät." /> : null}
            <View style={styles.grid}>
              {photos.map((ph) => (
                <Pressable key={ph.id} testID={`photo-item-${ph.id}`} style={styles.tile} onPress={() => setViewPhoto(ph)}>
                  <Image source={{ uri: ph.uri }} style={styles.tileImg} contentFit="cover" />
                  <View style={[styles.tileTag, { backgroundColor: ph.target.kind === "verse" ? colors.info : STATION_INFO[ph.target.id]?.world.palette.base ?? colors.stationNarrative }]}>
                    <Icon name={ph.target.kind === "verse" ? "book-open" : "compass"} size={11} color={colors.surface} />
                    <Text style={[styles.tileTagText, { color: colors.surface }]} numberOfLines={1}>{targetLabel(ph)}</Text>
                  </View>
                  {ph.title ? <Text style={styles.tileTitle} numberOfLines={1}>{ph.title}</Text> : null}
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {tab === "units" ? (
          <>
            {!units.length ? <Empty text="Noch keine eigenen Lerneinheiten. Tippe auf + oder im Bibelleser bei einem Vers auf „Neue Lerneinheit“." /> : null}
            {units.map((u) => (
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
          </>
        ) : null}

        {tab === "lexicon" ? (
          <>
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }} testID="lexicon-infotafeln">
              <Pressable testID="open-timeline" onPress={() => router.push("/timeline")} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: spacing.sm }]}>
                <Icon name="clock" size={18} color={colors.brandPrimary} /><Text style={[styles.cardTitle, { flex: 1 }]}>Zeitstrahl öffnen</Text><Icon name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {LEXICON.filter((e) => match(e.name)).map((e) => <InfoChip key={e.id} id={e.id} />)}
              </View>
            </View>
            {terms.map((t) => (
              <View key={t.term + t.station} style={styles.card} testID={`lexicon-item-${t.term}`}>
                <Text style={styles.cardTitle}>{t.term}</Text>
                <Text style={styles.cardText}>{t.explanation}</Text>
                <Text style={styles.date}>{t.ref ? `${t.ref} · ` : ""}{t.station}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      {tab === "mine" || tab === "units" || tab === "photos" ? (
        <Pressable
          testID={tab === "mine" ? "add-note-fab" : tab === "units" ? "add-unit-fab" : "add-photo-fab"}
          style={[styles.fab, { bottom: bottomChrome + 16 }]}
          onPress={() => (tab === "mine" ? setEdit({ title: "", text: "" }) : tab === "photos" ? setPhotoAdd(true) : router.push({ pathname: "/unit/[id]", params: { id: p.saveUnit({ title: "Neue Lerneinheit" }) } }))}
          accessibilityLabel={tab === "mine" ? "Neue Notiz" : tab === "photos" ? "Foto hinzufügen" : "Neue Lerneinheit"}
        >
          <Icon name={tab === "photos" ? "camera" : "plus"} size={26} color={colors.onBrandPrimary} />
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

      <PhotoAdd visible={photoAdd || !!photoEdit} edit={photoEdit} onClose={() => { setPhotoAdd(false); setPhotoEdit(null); }} />

      <Sheet visible={!!viewPhoto} onClose={() => setViewPhoto(null)} title={viewPhoto?.title || "Foto"} testID="photo-view-sheet">
        {viewPhoto ? (
          <View style={{ gap: spacing.md }}>
            <Image source={{ uri: viewPhoto.uri }} style={styles.big} contentFit="contain" />
            {viewPhoto.note ? <Text style={styles.cardText}>{viewPhoto.note}</Text> : null}
            <Button testID="photo-open-target" variant="secondary" icon={viewPhoto.target.kind === "verse" ? "book-open" : "compass"} label={`Zu ${targetLabel(viewPhoto)}`}
              onPress={() => { const t = viewPhoto.target; setViewPhoto(null); if (t.kind === "verse") openVerse(t.ref); else openStation(t.id); }} />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button testID="photo-edit" variant="ghost" icon="edit-2" label="Bearbeiten" style={{ flex: 1 }} onPress={() => { const ph = viewPhoto; setViewPhoto(null); setPhotoEdit(ph); }} />
              <Button testID="photo-delete" variant="ghost" icon="trash-2" label="Löschen" style={{ flex: 1 }} onPress={() => { deletePhotoFile(viewPhoto.uri); p.deletePhoto(viewPhoto.id); setViewPhoto(null); toast.show("Foto gelöscht"); }} />
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty} testID="library-empty">
      <Icon name="book" size={36} color={colors.borderStrong} />
      <Text style={styles.emptyTitle}>Hier ist noch nichts.</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function Thumbs({ list, onOpen }: { list: Photo[]; onOpen: (p: Photo) => void }) {
  const styles = useStyles();
  if (!list.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.sm }}>
      {list.map((ph) => (
        <Pressable key={ph.id} onPress={() => onOpen(ph)} testID={`entry-photo-${ph.id}`} accessibilityLabel={`Foto ${ph.title || ""}`}>
          <Image source={{ uri: ph.uri }} style={styles.thumb} contentFit="cover" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function TypeBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color + "26", borderColor: color }]}>
      <Icon name={icon} size={12} color={color} />
      <Text style={[styles.badgeText, { color: colors.onSurface }]}>{label}</Text>
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
  searchWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.lg, height: 48, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  search: { flex: 1, fontFamily: fonts.text, fontSize: 16, color: c.onSurface, height: 48 },
  chipRow: { height: 56, flexGrow: 0 },
  chipContent: { gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" },
  seg: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border, marginBottom: spacing.md },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 42, borderRadius: radius.pill },
  segText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  groupBar: { width: 6, height: 22, borderRadius: 3 },
  groupTitle: { flex: 1, fontFamily: fonts.display, fontSize: 19, fontWeight: "700", color: c.onSurface },
  count: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: c.muted },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { flex: 1, fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  cardText: { flex: 1, fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: c.onSurfaceSecondary, marginTop: spacing.sm },
  verse: { fontFamily: fonts.display, fontSize: 16, lineHeight: 24, color: c.onSurfaceSecondary, marginTop: spacing.sm, borderRadius: 6, paddingHorizontal: 4 },
  date: { fontFamily: fonts.text, fontSize: 12, color: c.muted, fontWeight: "700", marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 24, borderRadius: radius.pill, borderWidth: 1 },
  badgeText: { fontFamily: fonts.text, fontSize: 11.5, fontWeight: "800" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: c.surfaceTertiary },
  favRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  lessonIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: { width: "47%", flexGrow: 1, maxWidth: 260, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  tileImg: { width: "100%", aspectRatio: 1 },
  tileTag: { position: "absolute", left: 6, top: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 24, borderRadius: radius.pill, alignSelf: "flex-start" },
  tileTagText: { flexShrink: 1, fontFamily: fonts.text, fontSize: 11, fontWeight: "800" },
  tileTitle: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurface, padding: spacing.sm },
  big: { width: "100%", height: 320, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: "600", color: c.onSurface, textAlign: "center" },
  emptyText: { fontFamily: fonts.text, fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 21 },
  fab: { position: "absolute", right: spacing.xl, width: 60, height: 60, borderRadius: 30, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", boxShadow: "0px 6px 14px rgba(194,142,58,0.45)" },
  inputSm: { height: 52, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  input: { minHeight: 140, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
}));
