import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleProp, Text, TextStyle } from "react-native";

import { getChapterSync, loadChapter } from "@/src/data/bible";
import { VerseRef } from "@/src/data/types";
import { useTheme } from "@/src/theme";

/** Verse eines Leseabschnitts; lädt das Kapitel bei Bedarf (danach offline im Cache). */
export function ReadingVerses({ r, style, numStyle }: { r: VerseRef; style: StyleProp<TextStyle>; numStyle: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  const [chapter, setChapter] = useState<string[] | null>(() => getChapterSync(r.book, r.ch));
  const [error, setError] = useState(false);
  useEffect(() => {
    if (chapter) return;
    loadChapter(r.book, r.ch).then(setChapter).catch(() => setError(true));
  }, [chapter, r.book, r.ch]);
  if (error) return <Text style={style}>Text offline nicht verfügbar – öffne die Stelle im Bibelleser, sobald du online bist.</Text>;
  if (!chapter) return <ActivityIndicator color={colors.brandPrimary} />;
  const to = Math.min(r.to ?? r.from, chapter.length);
  const verses = chapter.slice(r.from - 1, to).map((text, i) => ({ v: r.from + i, text }));
  return (
    <Text style={style}>
      {verses.map((v) => (
        <Text key={v.v}>
          <Text style={numStyle}>{v.v} </Text>
          {v.text}{" "}
        </Text>
      ))}
    </Text>
  );
}
