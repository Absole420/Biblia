import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

import { FavHeart } from "./FavHeart";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { useToast } from "./Toast";
import { Button } from "./ui";

/** Herz (Favorit) + eigene Notiz zur Lektion – erscheinen in der Bibliothek unter „Studienreise“. */
export function LessonActions({ stationId, title }: { stationId: string; title: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const p = useProgress();
  const fav = p.state.favorites.lessons.some((f) => f.key === stationId);
  const existing = p.state.notes.find((n) => n.stationId === stationId);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <>
      <Pressable testID="lesson-note-button" style={styles.btn} onPress={() => { setText(existing?.text ?? ""); setOpen(true); }} accessibilityRole="button" accessibilityLabel={existing ? "Notiz zur Lektion bearbeiten" : "Notiz zur Lektion schreiben"}>
        <Icon name={existing ? "file-text" : "edit-3"} size={19} color={existing ? colors.brandPrimary : colors.onSurface} />
      </Pressable>
      <FavHeart testID="lesson-fav-button" active={fav} label={title} onPress={() => { p.toggleFavorite("lessons", stationId); toast.show(fav ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt"); }} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={`Notiz · ${title}`} testID="lesson-note-sheet">
        <View style={{ gap: spacing.md }}>
          <TextInput testID="lesson-note-input" value={text} onChangeText={setText} multiline placeholder="Gedanken, Fragen, Entdeckungen zu dieser Lektion …" placeholderTextColor={colors.muted} style={styles.input} />
          <Button testID="lesson-note-save" label="Speichern" icon="save" disabled={!text.trim()} onPress={() => { p.saveNote({ id: existing?.id, title, text: text.trim(), stationId }); setOpen(false); toast.show("Notiz gespeichert"); }} />
          {existing ? <Button testID="lesson-note-delete" label="Notiz löschen" icon="trash-2" variant="ghost" onPress={() => { p.deleteNote(existing.id); setOpen(false); toast.show("Notiz gelöscht"); }} /> : null}
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((c) => ({
  btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  input: { minHeight: 140, textAlignVertical: "top", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.lg, fontFamily: fonts.text, color: c.onSurface, fontSize: 16 },
}));
