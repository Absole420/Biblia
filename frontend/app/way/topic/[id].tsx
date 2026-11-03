import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { Button, Chip } from "@/src/components/ui";
import { KindBadge, PassageCard, regColor, SectionHead, useWayStyles } from "@/src/components/way/WayUI";
import { ARTICLE_BY_ID } from "@/src/data/articles";
import { JESUS_KIND_LABEL, TOPIC_BY_ID, TOPIC_CATS } from "@/src/data/way";
import { STATION_INFO } from "@/src/lib/libraryIndex";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function TopicScreen() {
  const w = useWayStyles();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = TOPIC_BY_ID[id ?? ""];
  const accent = regColor(colors);

  if (!t) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.xl, padding: spacing.lg }]} testID="topic-missing">
        <Text style={w.secTitle}>Thema nicht gefunden</Text>
        <Button testID="topic-missing-back" label="Zum Register" icon="arrow-left" onPress={() => router.replace("/way")} />
      </View>
    );
  }
  const List = ({ items, icon }: { items: string[]; icon: string }) => (
    <View style={{ gap: spacing.sm }}>
      {items.map((x, i) => (
        <View key={i} style={styles.li}><Icon name={icon} size={14} color={accent} /><Text style={[w.body, { flex: 1 }]}>{x}</Text></View>
      ))}
    </View>
  );

  return (
    <View style={styles.root} testID={`topic-screen-${t.id}`}>
      <View style={[w.head, { paddingTop: insets.top + spacing.sm, backgroundColor: accent }]}>
        <Pressable onPress={() => router.back()} style={w.back} testID="topic-back" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onInfo} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.over, { color: colors.onInfo }]}>Allgemeines Register · {TOPIC_CATS.find((c) => c.id === t.cat)?.label}</Text>
          <Text style={[w.headTitle, { color: colors.onInfo }]} testID="topic-title" accessibilityRole="header">{t.title}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxxl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
        <Text style={styles.lead}>{t.summary}</Text>

        <SectionHead icon="info" title="Kurz erklärt" color={accent} />
        {t.explained.map((p, i) => <Text key={i} style={[w.body, { marginBottom: spacing.sm }]}>{p}</Text>)}
        <Text style={w.label}>Mögliche Ursachen – keine davon muss auf dich zutreffen</Text>
        <List items={t.causes} icon="circle" />

        <SectionHead icon="book-open" title="Biblische Stellen" color={accent} />
        <Text style={[w.muted, { marginBottom: spacing.sm }]}>Keine einzelne Stelle ist eine pauschale Antwort. Lies sie im Zusammenhang; die Kennzeichnung zeigt die Art der Verbindung.</Text>
        {t.passages.map((p, i) => <PassageCard key={p.ref} refKey={p.ref} title={p.title} context={p.context} badge={<KindBadge kind={p.kind} />} testID={`topic-passage-${i}`} from={t.id} />)}

        <SectionHead icon="users" title="Menschen der Bibel" color={accent} />
        {t.people.map((p, i) => <PassageCard key={p.ref} refKey={p.ref} title={p.name} context={p.text} badge={<KindBadge kind="person" />} testID={`topic-person-${i}`} from={t.id} />)}

        <SectionHead icon="sun" title="Was Jesus zeigt und lehrt" color={accent} />
        {t.jesus.map((j, i) => (
          <PassageCard key={j.ref + i} refKey={j.ref} title={j.title} context={j.text} testID={`topic-jesus-${i}`} from={t.id}
            badge={<View style={styles.jk}><Icon name={{ word: "message-square", deed: "activity", interp: "message-circle" }[j.kind]} size={11} color={colors.onSurfaceSecondary} /><Text style={styles.jkText}>{JESUS_KIND_LABEL[j.kind]}</Text></View>} />
        ))}

        <SectionHead icon="compass" title="Biblische Orientierung" color={accent} />
        <List items={t.orientation} icon="arrow-right" />
        <Text style={w.label}>Spannungen, Grenzen und offene Fragen</Text>
        <List items={t.tensions} icon="alert-circle" />

        <SectionHead icon="help-circle" title="Reflexionsfragen" color={accent} />
        <List items={t.questions} icon="help-circle" />

        <SectionHead icon="feather" title="Gebetsimpuls" color={accent} />
        <View style={w.card}><Text style={[w.body, { fontStyle: "italic" }]} testID="topic-prayer">{t.prayer}</Text><Text style={w.muted}>Ein Vorschlag – du kannst ganz eigene Worte finden.</Text></View>

        <SectionHead icon="navigation" title="Mögliche nächste Schritte" color={accent} />
        <Text style={[w.muted, { marginBottom: spacing.sm }]}>Frei wählbar, klein und ohne Pflicht.</Text>
        <List items={t.steps} icon="check-square" />
        <View style={[w.card, { marginTop: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning }]} testID="topic-care">
          <Text style={w.bold}>Wann weitere Hilfe sinnvoll sein kann</Text>
          <Text style={w.body}>{t.care}</Text>
        </View>

        <SectionHead icon="link" title="Verwandte Themen und Lernmodule" color={accent} />
        <View style={w.wrap}>
          {t.related.map((r) => TOPIC_BY_ID[r] ? <Chip key={r} testID={`topic-related-${r}`} label={TOPIC_BY_ID[r].title} onPress={() => router.push({ pathname: "/way/topic/[id]", params: { id: r } })} /> : null)}
        </View>
        <Text style={w.label}>Lexikon</Text>
        <View style={w.wrap}>
          {t.lexicon.map((l) => ARTICLE_BY_ID[l] ? <Chip key={l} testID={`topic-lex-${l}`} label={ARTICLE_BY_ID[l].title} onPress={() => router.push({ pathname: "/lexicon/[id]", params: { id: l } })} /> : null)}
        </View>
        <Text style={w.label}>Lerneinheiten</Text>
        <View style={{ gap: spacing.sm }}>
          {t.stations.map((s) => STATION_INFO[s] ? (
            <Pressable key={s} testID={`topic-station-${s}`} onPress={() => router.push({ pathname: "/station/[id]", params: { id: s } })} style={styles.station} accessibilityRole="button">
              <Icon name="compass" size={16} color={STATION_INFO[s].world.palette.base} />
              <View style={{ flex: 1 }}><Text style={w.bold}>{STATION_INFO[s].station.title}</Text><Text style={w.muted}>{STATION_INFO[s].world.title}</Text></View>
              <Icon name="chevron-right" size={16} color={colors.muted} />
            </Pressable>
          ) : null)}
        </View>

        <View style={[w.card, { marginTop: spacing.xl, borderColor: colors.stationChallenge }]}>
          <View style={w.row}><Icon name="lock" size={16} color={colors.stationChallenge} /><Text style={w.bold}>Persönliches Register</Text></View>
          <Text style={w.muted}>Möchtest du für dich festhalten, was dich an diesem Thema berührt? Der Eintrag bleibt privat auf deinem Gerät.</Text>
          <Button testID="topic-to-diary" variant="secondary" icon="edit-3" label="Im Tagebuch festhalten" onPress={() => router.push({ pathname: "/way/entry", params: { topic: t.id } })} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  over: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", opacity: 0.9 },
  lead: { fontFamily: fonts.display, fontSize: 18, lineHeight: 27, color: c.onSurface },
  li: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingTop: 2 },
  jk: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, minHeight: 22, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary },
  jkText: { fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: c.onSurfaceSecondary },
  station: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 52, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
}));
