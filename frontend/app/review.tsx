import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/Icon";
import { TaskView } from "@/src/components/TaskView";
import { Button } from "@/src/components/ui";
import { JOHN } from "@/src/data/john";
import { Task } from "@/src/data/types";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, spacing, useTheme } from "@/src/theme";

export default function ReviewScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const p = useProgress();
  // Snapshot beim Öffnen, damit die Liste während der Wiederholung stabil bleibt
  const queue = useMemo(() => {
    const all: { task: Task; station: string }[] = [];
    for (const s of JOHN.stations) for (const t of [...s.tasks, ...s.exam]) if (p.state.wrong[t.id]) all.push({ task: t, station: s.title });
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [right, setRight] = useState(0);
  const cur = queue[idx];

  return (
    <View style={styles.root} testID="review-screen">
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.back} onPress={() => router.back()} testID="review-back-button" accessibilityLabel="Zurück">
          <Icon name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Wiederholung</Text>
          <Text style={styles.sub}>{queue.length ? `Frage ${Math.min(idx + 1, queue.length)} von ${queue.length}` : "Keine offenen Fragen"}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl }}>
        {!cur ? (
          <View style={styles.empty} testID="review-empty">
            <Icon name="check-circle" size={44} color={colors.success} />
            <Text style={styles.emptyTitle}>{queue.length ? `Geschafft! ${right} von ${queue.length} richtig.` : "Alles wiederholt!"}</Text>
            <Text style={styles.sub}>Falsch beantwortete Fragen aus Stationen erscheinen automatisch hier.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.station}>{cur.station}</Text>
            <TaskView
              key={cur.task.id}
              task={cur.task}
              fontScale={p.state.settings.fontScale}
              testPrefix="review"
              onAnswered={(ok) => {
                setDone(true);
                if (ok) { setRight((r) => r + 1); p.clearWrong(cur.task.id); }
              }}
            />
          </>
        )}
      </ScrollView>
      {cur ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="review-next-button" label={idx >= queue.length - 1 ? "Fertig" : "Nächste Frage"} icon="arrow-right" disabled={!done} onPress={() => { setIdx(idx + 1); setDone(false); }} />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  title: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface },
  sub: { fontFamily: fonts.text, fontSize: 13, color: c.muted, fontWeight: "700", textAlign: "left" },
  station: { fontFamily: fonts.text, fontSize: 13, color: c.info, fontWeight: "800", marginBottom: spacing.md },
  empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxxl },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.divider },
}));
