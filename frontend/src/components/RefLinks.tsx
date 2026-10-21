import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { loadChapter } from "@/src/data/bible";
import { BOOK_BY_CODE, ParsedRef, parseRefs } from "@/src/data/books";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Button } from "./ui";

/** Antippbare Bibelstellen → Vorschau (Elberfelder 1905) → vollständiger Abschnitt im Bibelleser. */
export function RefLinks({ refs, lexId, testID }: { refs: string[]; lexId: string; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [sel, setSel] = useState<ParsedRef | null>(null);
  return (
    <View style={styles.row} testID={testID}>
      {refs.map((r) => {
        const p = parseRefs(r)[0]?.ref;
        return (
          <Pressable key={r} disabled={!p} onPress={() => p && setSel(p)} testID={`ref-${r}`} accessibilityRole="link" accessibilityLabel={`Bibelstelle ${r} – Vorschau öffnen`} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
            <Icon name="book-open" size={13} color={colors.info} />
            <Text style={styles.chipText}>{r}</Text>
          </Pressable>
        );
      })}
      <RefPreview r={sel} lexId={lexId} onClose={() => setSel(null)} />
    </View>
  );
}

function RefPreview({ r, lexId, onClose }: { r: ParsedRef | null; lexId: string; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<{ key: string; verses: string[] | null; err?: boolean } | null>(null);
  const key = r ? `${r.code}:${r.ch}` : "";
  useEffect(() => {
    if (!r) return;
    loadChapter(r.code, r.ch).then((v) => setData({ key: `${r.code}:${r.ch}`, verses: v })).catch(() => setData({ key: `${r.code}:${r.ch}`, verses: null, err: true }));
  }, [r]);
  const cur = data?.key === key ? data : null;
  const from = r?.v ?? 1;
  const to = r ? (r.vEnd ?? (r.v ? r.v : Math.min(from + 9, cur?.verses?.length ?? from))) : 0;
  return (
    <Sheet visible={!!r} onClose={onClose} title={r ? `${BOOK_BY_CODE[r.code].name} ${r.ch}${r.v ? "," + r.v + (r.vEnd ? "–" + r.vEnd : "") : ""}` : ""} testID="ref-preview-sheet">
      {r ? (
        <View style={{ gap: spacing.md }}>
          <Text style={styles.small}>Elberfelder 1905</Text>
          {!cur ? <ActivityIndicator color={colors.brandPrimary} /> : cur.err || !cur.verses ? (
            <Text style={styles.small} testID="ref-preview-error">Text konnte nicht geladen werden (Internetverbindung nötig, falls das Kapitel noch nicht gespeichert ist).</Text>
          ) : (
            <Text style={styles.verse} testID="ref-preview-text">
              {cur.verses.slice(from - 1, to).map((t, i) => (
                <Text key={i}><Text style={styles.vn}>{from + i} </Text>{t} </Text>
              ))}
              {!r.v && cur.verses.length > to ? <Text style={styles.small}> …</Text> : null}
            </Text>
          )}
          <Button testID="ref-open-bible" icon="book-open" label="Ganzen Abschnitt im Bibelleser öffnen" onPress={() => { onClose(); router.navigate({ pathname: "/bible", params: { b: r.code, ch: String(r.ch), v: String(r.v ?? 1), lex: lexId } }); }} />
        </View>
      ) : null}
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.info },
  chipText: { fontFamily: fonts.text, fontSize: 13.5, fontWeight: "800", color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 12.5, color: c.muted, fontWeight: "700" },
  verse: { fontFamily: fonts.display, fontSize: 17, lineHeight: 27, color: c.onSurface },
  vn: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.brandPrimary },
}));
