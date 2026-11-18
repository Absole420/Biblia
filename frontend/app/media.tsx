import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { useToast } from "@/src/components/Toast";
import { Button, SectionTitle } from "@/src/components/ui";
import { BUNDLED_MEDIA } from "@/src/data/media";
import { importMedia, removeMedia, useMedia } from "@/src/lib/media";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Playable = { id: string; title: string; kind: "audio" | "video"; source: number | { uri: string }; own: boolean };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function AudioPlayer({ item }: { item: Playable }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const player = useAudioPlayer(item.source);
  const st = useAudioPlayerStatus(player);
  return (
    <View style={styles.player} testID="media-audio-player">
      <Pressable testID="media-play-toggle" accessibilityLabel={st.playing ? "Pause" : "Abspielen"} style={styles.playBtn} onPress={() => (st.playing ? player.pause() : (st.didJustFinish || (st.duration && st.currentTime >= st.duration - 0.2) ? (player.seekTo(0), player.play()) : player.play()))}>
        <Icon name={st.playing ? "pause" : "play"} size={24} color={colors.onBrandPrimary} />
      </Pressable>
      <Pressable testID="media-back-15" accessibilityLabel="15 Sekunden zurück" style={styles.skip} onPress={() => player.seekTo(Math.max(0, st.currentTime - 15))}>
        <Icon name="rotate-ccw" size={20} color={colors.onSurface} />
      </Pressable>
      <Text style={styles.time} testID="media-time">{fmt(st.currentTime)} / {fmt(st.duration || 0)}</Text>
    </View>
  );
}

function VideoPlayer({ item }: { item: Playable }) {
  const styles = useStyles();
  const player = useVideoPlayer(item.source);
  return (
    <View testID="media-video-player">
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" allowsPictureInPicture={false} />
    </View>
  );
}

export default function MediaScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const own = useMedia();
  const [current, setCurrent] = useState<Playable | null>(null);
  const list: Playable[] = [
    ...BUNDLED_MEDIA.map((m) => ({ id: m.id, title: m.title, kind: m.kind, source: m.source, own: false })),
    ...own.map((m) => ({ id: m.id, title: m.title, kind: m.kind, source: { uri: m.uri }, own: true })),
  ];

  const add = async () => {
    try {
      const n = await importMedia();
      if (n) toast.show(n === 1 ? "Datei hinzugefügt" : `${n} Dateien hinzugefügt`);
    } catch {
      toast.show("Datei konnte nicht übernommen werden", "error");
    }
  };

  const row = (m: Playable) => (
    <View key={m.id} style={[styles.row, current?.id === m.id && styles.rowActive]}>
      <Pressable style={styles.rowMain} testID={`media-item-${m.id}`} onPress={() => setCurrent(m)} accessibilityRole="button" accessibilityLabel={`${m.title} abspielen`}>
        <Icon name={m.kind === "video" ? "film" : "music"} size={20} color={colors.brandPrimary} />
        <Text style={styles.rowTitle} numberOfLines={2}>{m.title}</Text>
      </Pressable>
      {m.own ? (
        <Pressable testID={`media-remove-${m.id}`} hitSlop={8} style={styles.remove} accessibilityLabel="Entfernen" onPress={() => { if (current?.id === m.id) setCurrent(null); removeMedia(m.id); }}>
          <Icon name="trash-2" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root} testID="media-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} testID="media-back-button" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Hören & Sehen</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xxl }}>
        {current ? (
          <View style={styles.now} testID="media-now-playing">
            <Text style={styles.nowTitle} numberOfLines={2}>{current.title}</Text>
            {current.kind === "video" ? <VideoPlayer key={current.id} item={current} /> : <AudioPlayer key={current.id} item={current} />}
          </View>
        ) : null}

        <SectionTitle>Mitgeliefert</SectionTitle>
        {BUNDLED_MEDIA.length ? list.filter((m) => !m.own).map(row) : <Text style={styles.small} testID="media-bundled-empty">Diese Ausgabe enthält noch keine mitgelieferten Aufnahmen.</Text>}

        <SectionTitle>Eigene Dateien</SectionTitle>
        <Text style={styles.small}>MP3- und MP4-Dateien vom Handy werden in die App kopiert und spielen danach ohne Internet.{Platform.OS === "web" ? " In der Web-Vorschau bleiben sie nur bis zum Neuladen." : ""}</Text>
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {list.filter((m) => m.own).map(row)}
          <Button testID="media-import-button" label="MP3 oder MP4 hinzufügen" icon="plus" variant="secondary" onPress={add} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 24, fontWeight: "700", color: c.onSurface },
  small: { fontFamily: fonts.text, fontSize: 13, color: c.muted, lineHeight: 19 },
  now: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, gap: spacing.md },
  nowTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: c.onSurface },
  player: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  skip: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  time: { fontFamily: fonts.text, fontSize: 14, color: c.onSurface },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: "#000000" },
  row: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  rowActive: { borderColor: c.brandPrimary },
  rowMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, minHeight: 52 },
  rowTitle: { flex: 1, minWidth: 0, flexShrink: 1, fontFamily: fonts.text, fontSize: 15, color: c.onSurface },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
