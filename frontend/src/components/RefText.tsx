import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { getChapterSync, loadChapter } from "@/src/data/bible";
import { parseRefs } from "@/src/data/books";
import { useTheme } from "@/src/theme";

/** Bibelstellen als antippbare Verknüpfungen in den Bibelleser. */
export function RefText({ text, style, prefix, testID }: { text: string; style?: StyleProp<TextStyle>; prefix?: string; testID?: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const parts = parseRefs(text);
  return (
    <Text style={style} testID={testID}>
      {prefix}
      {parts.map((p, i) => (
        <Text key={i}>
          {i > 0 ? " · " : ""}
          {p.ref ? (
            <Text
              accessibilityRole="link"
              style={{ color: colors.brandPrimary, textDecorationLine: "underline", fontWeight: "700" }}
              onPress={() => router.navigate({ pathname: "/bible", params: { b: p.ref!.code, ch: String(p.ref!.ch), v: String(p.ref!.v ?? 1) } })}
            >
              {p.label}
            </Text>
          ) : (
            p.label
          )}
        </Text>
      ))}
    </Text>
  );
}

/** Lädt den Text eines Verses (verseKey "Code:Kap:Vers") asynchron. */
export function VerseSnippet({ k, style, lines = 3 }: { k: string; style?: StyleProp<TextStyle>; lines?: number }) {
  const [code, ch, v] = k.split(":");
  const [text, setText] = useState(getChapterSync(code, +ch)?.[+v - 1] ?? "");
  useEffect(() => {
    if (text) return;
    loadChapter(code, +ch).then((vs) => setText(vs[+v - 1] ?? "")).catch(() => setText("(offline – Text nicht verfügbar)"));
  }, [code, ch, v, text]);
  return <Text style={style} numberOfLines={lines}>{text || "…"}</Text>;
}
