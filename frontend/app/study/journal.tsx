import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { refLabel, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { Button } from "@/src/components/ui";
import { JournalEntry, today } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";

const PROMPTS: [keyof JournalEntry, string][] = [["noticed", "Was fällt mir im Text auf?"], ["unclear", "Was verstehe ich noch nicht?"], ["connection", "Welche Querverbindung habe ich entdeckt?"], ["apply", "Was möchte ich vertiefen oder im Alltag umsetzen?"]];

/** Studienjournal – Reflexionen werden nicht bewertet. */
export default function Journal() {
  const s = useStudyStyles();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const { state, updateStudy } = useProgress();
  const blank = (r: string): JournalEntry => ({ id: `j-${Date.now()}`, ref: r, date: today(), noticed: "", unclear: "", connection: "", apply: "" });
  const [draft, setDraft] = useState<JournalEntry | null>(() => (ref ? blank(ref) : null));
  const [newRef, setNewRef] = useState("");
  const save = () => {
    if (!draft) return;
    updateStudy((x) => ({ ...x, journal: [draft, ...x.journal.filter((j) => j.id !== draft.id)] }));
    setDraft(null);
  };
  return (
    <StudyScreen title="Studienjournal" sub="Deine Gedanken – ohne Bewertung" testID="journal-screen">
      {draft ? (
        <View testID="journal-editor">
          <Text style={s.title}>{refLabel(draft.ref)} · {draft.date}</Text>
          {PROMPTS.map(([k, q]) => (
            <View key={k}>
              <Text style={s.h2}>{q}</Text>
              <TextInput testID={`journal-${k}`} multiline value={draft[k] as string} onChangeText={(t) => setDraft({ ...draft, [k]: t })} style={[s.input, { minHeight: 70 }]} accessibilityLabel={q} />
            </View>
          ))}
          <View style={s.row}><Button testID="journal-cancel" variant="ghost" label="Abbrechen" onPress={() => setDraft(null)} /><Button testID="journal-save" icon="save" label="Speichern" onPress={save} /></View>
        </View>
      ) : (
        <View style={s.row}>
          <TextInput testID="journal-new-ref" value={newRef} onChangeText={setNewRef} placeholder="Bibelstelle, z. B. Joh:3:16" style={[s.input, { flex: 1 }]} />
          <Button testID="journal-new" icon="plus" label="Neu" onPress={() => setDraft(blank(newRef.trim() || "Allgemein"))} />
        </View>
      )}
      <Text style={s.h2}>Einträge</Text>
      {state.study.journal.length === 0 ? <Text style={s.body}>Noch keine Einträge.</Text> : null}
      {state.study.journal.map((j) => (
        <Pressable key={j.id} testID={`journal-entry-${j.id}`} style={s.card} onPress={() => setDraft(j)}>
          <Text style={s.title}>{refLabel(j.ref)} · {j.date}</Text>
          {PROMPTS.filter(([k]) => j[k]).map(([k, q]) => <Text key={k} style={s.body}><Text style={s.sub}>{q} </Text>{j[k] as string}</Text>)}
        </Pressable>
      ))}
    </StudyScreen>
  );
}
