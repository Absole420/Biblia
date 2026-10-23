import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { BOOK_BY_CODE } from "@/src/data/books";
import { loadChapter } from "@/src/data/bible";
import { PRAYER_CATS, PrayerCat, PrayerEntry } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { Chip } from "./ui";

/** "Ps:23:1-3" → Buch, Kapitel, Versbereich */
const parseRef = (ref: string) => {
  const [book, ch, vv] = ref.split(":");
  const [from, to] = (vv ?? "1").split("-").map((n) => parseInt(n, 10));
  return { book, ch: parseInt(ch, 10), from, to: to || from };
};
export const prayerRefLabel = (ref: string) => {
  const r = parseRef(ref);
  return `${BOOK_BY_CODE[r.book]?.name ?? r.book} ${r.ch},${r.from}${r.to > r.from ? "–" + r.to : ""}`;
};
/** Verstext (Elberfelder 1905) für einen Schlüssel laden; mehrere Verse mit Versnummern. */
export async function loadRefText(ref: string): Promise<string> {
  const r = parseRef(ref);
  const vs = await loadChapter(r.book, r.ch);
  const out = [];
  for (let v = r.from; v <= Math.min(r.to, vs.length); v++) out.push(r.to > r.from ? `${v} ${vs[v - 1]}` : vs[v - 1]);
  return out.join(" ");
}

/** Rubrik-Auswahl: legt den Vers (mit Textkopie) im Gebetsheft ab. */
export function AddToPrayerBook({ refKey, text, onDone }: { refKey: string; text?: string; onDone?: () => void }) {
  const styles = useStyles();
  const p = useProgress();
  const toast = useToast();
  const add = async (cat: PrayerCat) => {
    const t = text ?? (await loadRefText(refKey).catch(() => ""));
    p.addPrayer({ ref: refKey, text: t, cat, note: "" });
    toast.show(`Im Gebetsheft unter „${PRAYER_CATS.find((c) => c.id === cat)!.label}“ gespeichert`);
    onDone?.();
  };
  return (
    <View testID="prayer-add-picker">
      <Text style={styles.small}>Rubrik wählen:</Text>
      <View style={styles.wrap}>
        {PRAYER_CATS.map((c) => {
          const has = p.state.prayers.some((x) => x.ref === refKey && x.cat === c.id);
          return <Chip key={c.id} testID={`prayer-add-${c.id}`} label={has ? `✓ ${c.label}` : c.label} selected={has} onPress={() => (has ? toast.show("Bereits in dieser Rubrik") : add(c.id))} />;
        })}
      </View>
    </View>
  );
}

/** Vorschläge einer Lerneinheit direkt übernehmen. */
export function PrayerSuggestions({ items }: { items?: { ref: string; cat: PrayerCat }[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const p = useProgress();
  const toast = useToast();
  const [texts, setTexts] = useState<Record<string, string>>({});
  useEffect(() => {
    (items ?? []).forEach((s) => loadRefText(s.ref).then((t) => setTexts((x) => ({ ...x, [s.ref]: t }))).catch(() => {}));
  }, [items]);
  if (!items?.length) return null;
  return (
    <View style={styles.box} testID="prayer-suggestions">
      <View style={styles.row}>
        <Icon name="feather" size={16} color={colors.brandPrimary} />
        <Text style={styles.boxTitle}>Für dein Gebetsheft</Text>
      </View>
      <Text style={styles.small}>Übernimm Verse in dein persönliches Gebetsheft (Bibliothek). Du kannst dort Notizen ergänzen, umsortieren und löschen.</Text>
      {items.map((s) => {
        const cat = PRAYER_CATS.find((c) => c.id === s.cat)!;
        const has = p.state.prayers.some((x) => x.ref === s.ref && x.cat === s.cat);
        return (
          <View key={s.ref + s.cat} style={styles.sugg}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.ref}>{cat.label} · {prayerRefLabel(s.ref)}</Text>
              <Text style={styles.text} numberOfLines={3}>{texts[s.ref] ?? "…"}</Text>
            </View>
            <Pressable testID={`prayer-suggest-${s.ref}-${s.cat}`} accessibilityRole="button" accessibilityLabel={has ? "Bereits im Gebetsheft" : `${prayerRefLabel(s.ref)} ins Gebetsheft übernehmen`}
              onPress={() => { if (has) return; p.addPrayer({ ref: s.ref, text: texts[s.ref] ?? "", cat: s.cat, note: "" }); toast.show("Ins Gebetsheft übernommen"); }}
              style={[styles.addBtn, has && { backgroundColor: colors.success }]}>
              <Icon name={has ? "check" : "plus"} size={18} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** Gebetsheft-Ansicht in der Bibliothek: nach Rubriken, mit Notiz, Umsortieren und Löschen. */
export function PrayerBookList({ query, onOpenVerse }: { query: string; onOpenVerse: (key: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const p = useProgress();
  const toast = useToast();
  const [filter, setFilter] = useState<PrayerCat | null>(null);
  const q = query.trim().toLowerCase();
  const list = p.state.prayers.filter((e) => (!filter || e.cat === filter) && (!q || `${prayerRefLabel(e.ref)} ${e.text} ${e.note}`.toLowerCase().includes(q)));
  return (
    <View testID="prayer-book">
      <View style={styles.wrap}>
        <Chip testID="prayer-filter-all" label={`Alle · ${p.state.prayers.length}`} selected={!filter} onPress={() => setFilter(null)} />
        {PRAYER_CATS.map((c) => (
          <Chip key={c.id} testID={`prayer-filter-${c.id}`} label={`${c.label} · ${p.state.prayers.filter((e) => e.cat === c.id).length}`} selected={filter === c.id} onPress={() => setFilter(filter === c.id ? null : c.id)} />
        ))}
      </View>
      {!p.state.prayers.length ? (
        <Text style={[styles.small, { marginTop: spacing.lg }]} testID="prayer-empty">Dein Gebetsheft ist noch leer. Tippe im Bibelleser auf einen Vers und wähle „Ins Gebetsheft“ – oder übernimm Vorschläge in der Psalm-Einheit 1.10.</Text>
      ) : null}
      {PRAYER_CATS.filter((c) => !filter || c.id === filter).map((c) => {
        const items = list.filter((e) => e.cat === c.id);
        if (!items.length) return null;
        return (
          <View key={c.id} style={{ marginTop: spacing.lg, gap: spacing.sm }} testID={`prayer-section-${c.id}`}>
            <View style={styles.row}>
              <Icon name={c.icon} size={18} color={colors.brandPrimary} />
              <Text style={styles.secTitle}>{c.label}</Text>
            </View>
            {items.map((e, i) => <PrayerCard key={e.id} e={e} first={i === 0} last={i === items.length - 1} onOpenVerse={onOpenVerse}
              onDelete={() => { p.deletePrayer(e.id); toast.show("Aus dem Gebetsheft entfernt"); }} />)}
          </View>
        );
      })}
    </View>
  );
}

function PrayerCard({ e, first, last, onOpenVerse, onDelete }: { e: PrayerEntry; first: boolean; last: boolean; onOpenVerse: (k: string) => void; onDelete: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const p = useProgress();
  const [note, setNote] = useState(e.note);
  const [confirm, setConfirm] = useState(false);
  const verseKey = e.ref.split("-")[0];
  return (
    <View style={styles.card} testID={`prayer-entry-${e.id}`}>
      <Pressable onPress={() => onOpenVerse(verseKey)} accessibilityRole="link" testID={`prayer-open-${e.id}`}>
        <Text style={styles.ref}>{prayerRefLabel(e.ref)} <Icon name="external-link" size={12} color={colors.brandPrimary} /></Text>
      </Pressable>
      <Text style={styles.verse}>{e.text || "(Verstext wird beim Öffnen geladen)"}</Text>
      <TextInput testID={`prayer-note-${e.id}`} value={note} onChangeText={setNote} onBlur={() => note !== e.note && p.updatePrayer(e.id, { note })}
        placeholder="Meine Gebetsnotiz …" placeholderTextColor={colors.muted} multiline style={styles.input} maxLength={500} />
      <View style={styles.actions}>
        <Pressable testID={`prayer-up-${e.id}`} disabled={first} onPress={() => p.movePrayer(e.id, -1)} style={[styles.iconBtn, first && { opacity: 0.35 }]} accessibilityLabel="Nach oben">
          <Icon name="arrow-up" size={18} color={colors.onSurface} />
        </Pressable>
        <Pressable testID={`prayer-down-${e.id}`} disabled={last} onPress={() => p.movePrayer(e.id, 1)} style={[styles.iconBtn, last && { opacity: 0.35 }]} accessibilityLabel="Nach unten">
          <Icon name="arrow-down" size={18} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {confirm ? (
          <>
            <Pressable testID={`prayer-delete-confirm-${e.id}`} onPress={onDelete} style={[styles.textBtn, { backgroundColor: colors.error }]}><Text style={styles.textBtnLabel}>Löschen</Text></Pressable>
            <Pressable testID={`prayer-delete-cancel-${e.id}`} onPress={() => setConfirm(false)} style={styles.iconBtn} accessibilityLabel="Abbrechen"><Icon name="x" size={18} color={colors.onSurface} /></Pressable>
          </>
        ) : (
          <Pressable testID={`prayer-delete-${e.id}`} onPress={() => setConfirm(true)} style={styles.iconBtn} accessibilityLabel="Eintrag löschen"><Icon name="trash-2" size={18} color={colors.error} /></Pressable>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  small: { fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: c.muted },
  box: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, gap: spacing.sm, marginBottom: spacing.lg },
  boxTitle: { fontFamily: fonts.display, fontSize: 17, fontWeight: "700", color: c.onSurface },
  sugg: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: c.divider },
  ref: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary },
  text: { fontFamily: fonts.display, fontSize: 14, lineHeight: 20, color: c.onSurface },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.brandPrimary },
  secTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: "700", color: c.onSurface },
  card: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, gap: spacing.sm },
  verse: { fontFamily: fonts.display, fontSize: 16, lineHeight: 24, color: c.onSurface },
  input: { minHeight: 44, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, fontFamily: fonts.text, fontSize: 15, color: c.onSurface },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  textBtn: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  textBtnLabel: { fontFamily: fonts.text, fontSize: 14, fontWeight: "800", color: c.onBrandPrimary },
}));
