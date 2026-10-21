import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import { Linking, Platform, Pressable, Text, TextInput, View } from "react-native";

import { parseRef } from "@/src/data/books";
import { STATION_INFO } from "@/src/lib/libraryIndex";
import { persistPhoto } from "@/src/lib/photos";
import { Photo, uid } from "@/src/lib/progress-logic";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { Button } from "./ui";

type Draft = { id: string; uri: string; base64?: string | null; title: string; note: string; kind: "verse" | "station"; refText: string; stationId: string | null; existing: boolean };

const refToText = (key: string) => {
  const [b, ch, v] = key.split(":");
  return `${b} ${ch}${v ? "," + v : ""}`;
};

/** Foto aufnehmen oder hochladen und einer Bibelstelle bzw. Lektion zuordnen (nur lokal gespeichert). */
export function PhotoAdd({ visible, onClose, edit }: { visible: boolean; onClose: () => void; edit?: Photo | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const p = useProgress();
  const [perm, setPerm] = useState<null | "ask" | "blocked">(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("");
  const [lastEdit, setLastEdit] = useState<Photo | null | undefined>(undefined);
  // Bearbeiten eines vorhandenen Fotos: Entwurf beim Öffnen übernehmen
  if (visible && edit && lastEdit !== edit) {
    setLastEdit(edit);
    setDraft({ id: edit.id, uri: edit.uri, title: edit.title, note: edit.note, kind: edit.target.kind, refText: edit.target.kind === "verse" ? refToText(edit.target.ref) : "", stationId: edit.target.kind === "station" ? edit.target.id : null, existing: true });
  }
  if (!visible && lastEdit !== undefined) setLastEdit(undefined);

  const close = () => { setDraft(null); setPerm(null); setFilter(""); onClose(); };

  const pick = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, base64: Platform.OS === "web" };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPerm(null);
    setDraft({ id: uid(), uri: a.uri, base64: a.base64, title: "", note: "", kind: "verse", refText: "", stationId: null, existing: false });
  };

  const openCamera = async () => {
    if (Platform.OS === "web") return pick(true);
    const cur = await ImagePicker.getCameraPermissionsAsync();
    if (cur.granted) return pick(true);
    setPerm(cur.canAskAgain ? "ask" : "blocked");
  };
  const requestCamera = async () => {
    const r = await ImagePicker.requestCameraPermissionsAsync();
    if (r.granted) return pick(true);
    setPerm(r.canAskAgain ? "ask" : "blocked");
  };

  const ref = draft?.kind === "verse" ? parseRef(draft.refText) : null;
  const refKey = ref ? `${ref.code}:${ref.ch}${ref.v ? ":" + ref.v : ""}` : null;
  const stations = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return Object.values(STATION_INFO).filter((i) => !q || i.station.title.toLowerCase().includes(q) || i.campaign.title.toLowerCase().includes(q)).slice(0, 8);
  }, [filter]);
  const valid = draft && (draft.kind === "verse" ? !!refKey : !!draft.stationId);

  const save = () => {
    if (!draft || !valid) return;
    try {
      const uri = draft.existing ? draft.uri : persistPhoto(draft.id, draft.uri, draft.base64);
      p.savePhoto({ id: draft.id, uri, title: draft.title.trim(), note: draft.note.trim(), target: draft.kind === "verse" ? { kind: "verse", ref: refKey! } : { kind: "station", id: draft.stationId! } });
      toast.show("Foto gespeichert");
      close();
    } catch {
      toast.show("Foto konnte nicht gespeichert werden", "error");
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title={draft ? (draft.existing ? "Foto bearbeiten" : "Foto zuordnen") : "Foto hinzufügen"} testID="photo-sheet">
      {!draft ? (
        <View style={{ gap: spacing.md }}>
          <Text style={styles.hint}>Fotos werden nur auf diesem Gerät gespeichert und gehen bei einer Neuinstallation verloren.</Text>
          {perm ? (
            <View style={styles.perm} testID="camera-permission-info">
              <Icon name="camera" size={22} color={colors.brandPrimary} />
              <Text style={styles.permText}>
                {perm === "ask"
                  ? "Mit der Kamera kannst du z. B. Notizen, Tafelbilder oder Orte festhalten und einer Bibelstelle zuordnen."
                  : "Der Kamerazugriff wurde abgelehnt. Du kannst ihn in den Einstellungen erlauben – oder ein Bild aus der Galerie wählen."}
              </Text>
              {perm === "ask" ? (
                <Button testID="camera-permission-continue" label="Kamera erlauben" icon="check" onPress={requestCamera} />
              ) : (
                <Button testID="camera-open-settings" label="Einstellungen öffnen" icon="settings" onPress={() => Linking.openSettings()} />
              )}
            </View>
          ) : null}
          <Button testID="photo-camera" label="Mit Kamera aufnehmen" icon="camera" onPress={openCamera} />
          <Button testID="photo-gallery" label="Aus Galerie hochladen" icon="image" variant="secondary" onPress={() => pick(false)} />
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Image source={{ uri: draft.base64 ? `data:image/jpeg;base64,${draft.base64}` : draft.uri }} style={styles.preview} contentFit="cover" testID="photo-preview" />
          <TextInput testID="photo-title-input" value={draft.title} onChangeText={(t) => setDraft({ ...draft, title: t })} placeholder="Titel (optional)" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput testID="photo-note-input" value={draft.note} onChangeText={(t) => setDraft({ ...draft, note: t })} placeholder="Notiz (optional)" placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 80, paddingTop: spacing.md, textAlignVertical: "top" }]} />
          <Text style={styles.label}>Zuordnen zu</Text>
          <View style={styles.seg}>
            {([["verse", "book-open", "Bibelstelle"], ["station", "compass", "Lektion"]] as const).map(([k, ic, l]) => (
              <Pressable key={k} testID={`photo-target-${k}`} onPress={() => setDraft({ ...draft, kind: k })} style={[styles.segBtn, draft.kind === k && { backgroundColor: colors.surfaceInverse }]} accessibilityRole="button" accessibilityState={{ selected: draft.kind === k }}>
                <Icon name={ic} size={16} color={draft.kind === k ? colors.onSurfaceInverse : colors.onSurfaceSecondary} />
                <Text style={[styles.segText, { color: draft.kind === k ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
          {draft.kind === "verse" ? (
            <View>
              <TextInput testID="photo-ref-input" value={draft.refText} onChangeText={(t) => setDraft({ ...draft, refText: t })} placeholder="z. B. Joh 3,16 oder Ps 23" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
              <Text style={[styles.small, { color: refKey ? colors.success : colors.muted }]} testID="photo-ref-status">{refKey ? `✓ ${ref!.label}` : "Bitte eine gültige Bibelstelle eingeben"}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.xs }}>
              <TextInput testID="photo-station-filter" value={filter} onChangeText={setFilter} placeholder="Lektion suchen …" placeholderTextColor={colors.muted} style={styles.input} />
              {stations.map((i) => (
                <Pressable key={i.station.id} testID={`photo-station-${i.station.id}`} onPress={() => setDraft({ ...draft, stationId: i.station.id })} style={[styles.stItem, { borderLeftColor: i.world.palette.base }, draft.stationId === i.station.id && { backgroundColor: colors.surfaceTertiary }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stTitle} numberOfLines={1}>{i.station.title}</Text>
                    <Text style={styles.small} numberOfLines={1}>{i.world.title} · {i.campaign.title}</Text>
                  </View>
                  {draft.stationId === i.station.id ? <Icon name="check-circle" size={18} color={colors.success} /> : null}
                </Pressable>
              ))}
            </View>
          )}
          <Button testID="photo-save" label="Speichern" icon="save" disabled={!valid} onPress={save} />
        </View>
      )}
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  hint: { fontFamily: fonts.text, fontSize: 13, color: c.muted, lineHeight: 19 },
  perm: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  permText: { fontFamily: fonts.text, fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  preview: { width: "100%", height: 200, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary },
  input: { minHeight: 48, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
  label: { fontFamily: fonts.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary },
  seg: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: c.border },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 42, borderRadius: radius.pill },
  segText: { fontFamily: fonts.text, fontWeight: "800", fontSize: 14 },
  small: { fontFamily: fonts.text, fontSize: 12.5, color: c.muted, marginTop: 4, fontWeight: "700" },
  stItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, borderLeftWidth: 5 },
  stTitle: { fontFamily: fonts.text, fontSize: 15, fontWeight: "800", color: c.onSurface },
}));
