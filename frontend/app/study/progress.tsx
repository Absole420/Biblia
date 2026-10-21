import React from "react";

import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BIBLE_BOOKS, BOOK_BY_CODE } from "@/src/data/books";

import { Button } from "@/src/components/ui";
import { Bar, StudyScreen, useStudyStyles } from "@/src/components/StudyUI";
import { bookProgress, markRead, unmarkRead } from "@/src/lib/study";
import { useProgress } from "@/src/lib/store";

/** Fortschritt je Buch nach eindeutig gelesenen Versen (keine Doppelzählung). */
export default function ReadingProgress() {
  const s = useStudyStyles();
  const router = useRouter();
  const { state, updateStudy } = useProgress();
  const read = state.study.read;
  const all = BIBLE_BOOKS.map((b) => ({ b, p: bookProgress(read, b.code) }));
  const verses = all.reduce((a, x) => a + x.p.verses, 0), total = all.reduce((a, x) => a + x.p.total, 0);
  return (
    <StudyScreen title="Lesefortschritt" sub="Persönlicher Fortschritt – getrennt von Leseplänen und Lernmodulen" testID="reading-progress">
      <View style={s.card} testID="progress-total">
        <Text style={s.title}>Ganze Bibel: {(verses / total * 100).toFixed(1)} %</Text>
        <Bar value={verses / total} />
        <Text style={s.sub}>{verses} von {total} Versen eindeutig gelesen</Text>
      </View>
      {all.map(({ b, p }) => (
        <View key={b.code} style={s.card} testID={`book-progress-${b.code}`}>
          <View style={s.row}><Text style={[s.title, { flex: 1 }]}>{b.name}</Text><Text style={s.sub}>{Math.round(p.pct * 100)} %</Text></View>
          <Bar value={p.pct} />
          <Text style={s.sub}>{p.readCh} von {b.chapters} Kapiteln gelesen · {p.partial} teilweise</Text>
          {p.next ? (
            <Pressable testID={`book-next-${b.code}`} onPress={() => router.navigate({ pathname: "/(tabs)/bible", params: { b: b.code, ch: String(p.next!.ch), v: String(p.next!.v) } })}>
              <Text style={s.body}>Nächster ungelesener Abschnitt: {BOOK_BY_CODE[b.code].name} {p.next.ch},{p.next.v} →</Text>
            </Pressable>
          ) : <Text style={s.body}>Vollständig gelesen ✓</Text>}
          <View style={s.row}>
            <Button testID={`book-mark-${b.code}`} variant="ghost" icon="check" label="Buch als gelesen" onPress={() => updateStudy((x) => { let r = x.read; for (let c = 1; c <= b.chapters; c++) r = markRead(r, b.code, c); return { ...x, read: r }; })} />
            {p.verses ? <Button testID={`book-unmark-${b.code}`} variant="ghost" icon="rotate-ccw" label="Zurücksetzen" onPress={() => updateStudy((x) => { let r = x.read; for (let c = 1; c <= b.chapters; c++) r = unmarkRead(r, b.code, c); return { ...x, read: r }; })} /> : null}
          </View>
        </View>
      ))}
    </StudyScreen>
  );
}
