import * as Linking from "expo-linking";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { useSources } from "@/src/components/VerseStudy";
import { useTheme } from "@/src/theme";

const R: [string, string][] = [["fulltext", "Volltext"], ["offline", "Offline"], ["edit", "Bearbeitung"], ["redistribute", "Weitergabe"]];
const STATUS: Record<string, string> = { integrated: "Eingebunden", link: "Nur externer Link", pending: "Geprüft – noch nicht eingebunden" };

/** Transparente Übersicht aller Quellen mit Rechte- und Lizenzangaben. */
export default function Sources() {
  const s = useStudyStyles();
  const { colors } = useTheme();
  const list = useSources();
  return (
    <StudyScreen title="Quellen & Nutzungsrechte" sub="Bibeltext: Elberfelder 1905 (gemeinfrei)" testID="sources-screen">
      {!list ? <ActivityIndicator color={colors.brandPrimary} /> : null}
      {(list ?? []).map((x) => (
        <View key={x.id} style={s.card} testID={`source-${x.id}`}>
          <Text style={s.title}>{x.title}</Text>
          <Text style={s.sub}>{x.author} · {x.language} · {x.edition}</Text>
          <Text style={[s.warn, x.status === "integrated" && { color: colors.success }]}>{STATUS[x.status] ?? x.status}{x.coverage ? ` · ${x.coverage}` : ""}</Text>
          <Text style={s.body}>{x.license}</Text>
          <Text style={s.body}>Perspektive: {x.perspective}</Text>
          <Text style={s.sub}>{R.map(([k, l]) => `${l}: ${x.rights[k] ? "ja" : "nein"}`).join(" · ")}</Text>
          <Pressable onPress={() => Linking.openURL(x.url)} accessibilityRole="link"><Text style={[s.sub, { color: colors.brandPrimary }]}>Externer Link: {x.url}</Text></Pressable>
        </View>
      ))}
    </StudyScreen>
  );
}
