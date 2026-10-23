import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PRAYER_CATS, PrayerCat } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { prayerRefLabel } from "./PrayerBook";
import { Chip } from "./ui";

const dayIndex = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** Vers des Tages aus dem eigenen Gebetsheft – täglich wechselnd, passend zur gewählten Rubrik. */
export function VerseOfDay() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const p = useProgress();
  const [open, setOpen] = useState(false);
  const cat = p.state.settings.votdCat ?? "all";
  const pool = p.state.prayers.filter((e) => cat === "all" || e.cat === cat);
  const entry = pool.length ? pool[dayIndex() % pool.length] : null;
  const catLabel = cat === "all" ? "Alle Rubriken" : PRAYER_CATS.find((c) => c.id === cat)?.label;
  const setCat = (c: PrayerCat | "all") => p.setSettings({ votdCat: c });

  return (
    <View style={styles.box} testID="verse-of-day">
      <Pressable onPress={() => setOpen(!open)} style={styles.head} testID="verse-of-day-toggle" accessibilityRole="button" accessibilityLabel={`Vers des Tages${entry ? ", " + prayerRefLabel(entry.ref) : ""}. Antippen für mehr`}>
        <Icon name="sun" size={16} color={colors.brandPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label} numberOfLines={1}>Vers des Tages · {catLabel}{entry ? ` · ${prayerRefLabel(entry.ref)}` : ""}</Text>
          <Text style={styles.text} numberOfLines={open ? undefined : 2} testID="verse-of-day-text">
            {entry ? entry.text || prayerRefLabel(entry.ref) : p.state.prayers.length ? "In dieser Rubrik ist noch kein Vers. Wähle eine andere Rubrik." : "Lege Verse in dein Gebetsheft – hier erscheint dann täglich einer davon."}
          </Text>
        </View>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={{ gap: spacing.sm }}>
          {entry?.note ? <Text style={styles.note} testID="verse-of-day-note">„{entry.note}“</Text> : null}
          <View style={styles.wrap}>
            <Chip testID="votd-cat-all" label="Alle" selected={cat === "all"} onPress={() => setCat("all")} />
            {PRAYER_CATS.map((c) => <Chip key={c.id} testID={`votd-cat-${c.id}`} label={c.label} selected={cat === c.id} onPress={() => setCat(c.id)} />)}
          </View>
          <View style={styles.row}>
            {entry ? (
              <Pressable testID="verse-of-day-open" style={styles.btn} onPress={() => { const [b, ch, v] = entry.ref.split("-")[0].split(":"); router.navigate({ pathname: "/bible", params: { b, ch, v } }); }}>
                <Icon name="book-open" size={14} color={colors.brandPrimary} /><Text style={styles.btnText}>Im Bibelleser</Text>
              </Pressable>
            ) : null}
            <Pressable testID="verse-of-day-prayerbook" style={styles.btn} onPress={() => router.navigate("/library")}>
              <Icon name="feather" size={14} color={colors.brandPrimary} /><Text style={styles.btnText}>Gebetsheft</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  box: { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 44 },
  label: { fontFamily: fonts.text, fontSize: 11.5, fontWeight: "800", color: c.brandPrimary, textTransform: "uppercase", letterSpacing: 0.5 },
  text: { fontFamily: fonts.display, fontSize: 15, lineHeight: 21, color: c.onSurface },
  note: { fontFamily: fonts.text, fontSize: 14, fontStyle: "italic", color: c.onSurfaceSecondary },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary },
  btnText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.brandPrimary },
}));
