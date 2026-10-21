import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvatarView } from "@/src/components/AvatarView";
import { Icon } from "@/src/components/Icon";
import { Button } from "@/src/components/ui";
import { Avatar, AVATAR_OPTIONS, DEFAULT_AVATAR, randomAvatar } from "@/src/lib/avatar";
import { useProgress } from "@/src/lib/store";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const TABS = [
  { id: "basis", label: "Person" }, { id: "face", label: "Gesicht" }, { id: "hair", label: "Haare" }, { id: "extras", label: "Brille & Hut" },
] as const;

/** Avatar-Editor mit Live-Vorschau; „Abbrechen“ verwirft den Entwurf. */
export default function AvatarEditor() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useProgress();
  const [draft, setDraft] = useState<Avatar>(p.state.avatar ?? DEFAULT_AVATAR);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("basis");
  const close = () => (router.canGoBack() ? router.back() : router.navigate("/profile"));
  const set = <K extends keyof Avatar>(k: K, v: Avatar[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const opts = <K extends keyof Avatar>(k: K, label: string) => (
    <View key={k} style={styles.group}>
      <Text style={styles.gLabel}>{label}</Text>
      <View style={styles.wrap}>
        {(AVATAR_OPTIONS[k as keyof typeof AVATAR_OPTIONS] as readonly (readonly [unknown, string])[]).map(([v, l]) => (
          <Pressable key={String(v)} testID={`avatar-opt-${k}-${v}`} onPress={() => set(k, v as Avatar[K])} style={[styles.opt, draft[k] === v && styles.optOn]}>
            <Text style={[styles.optText, draft[k] === v && { color: colors.onBrandPrimary }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const swatches = <K extends keyof Avatar>(k: K, label: string) => (
    <View key={k} style={styles.group}>
      <Text style={styles.gLabel}>{label}</Text>
      <View style={styles.wrap}>
        {(AVATAR_OPTIONS[k as keyof typeof AVATAR_OPTIONS] as readonly string[]).map((c) => (
          <Pressable key={c} testID={`avatar-color-${k}-${c.slice(1)}`} onPress={() => set(k, c as Avatar[K])} accessibilityLabel={`${label} ${c}`} style={[styles.swatch, { backgroundColor: c }, draft[k] === c && { borderColor: colors.brandPrimary, borderWidth: 4 }]} />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root} testID="avatar-editor">
      <View style={[styles.preview, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <Pressable testID="avatar-cancel" style={styles.round} onPress={close} accessibilityLabel="Abbrechen"><Icon name="x" size={22} color={colors.onSurface} /></Pressable>
          <Text style={styles.h1}>Avatar gestalten</Text>
          <Pressable testID="avatar-random" style={styles.round} onPress={() => setDraft(randomAvatar(draft.name))} accessibilityLabel="Zufällig"><Icon name="shuffle" size={20} color={colors.onSurface} /></Pressable>
        </View>
        <View style={styles.stage} testID="avatar-preview"><AvatarView a={draft} size={170} /></View>
        <TextInput testID="avatar-name-input" value={draft.name} onChangeText={(t) => set("name", t.slice(0, 40))} placeholder="Name" placeholderTextColor={colors.muted} style={styles.name} />
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} testID={`avatar-tab-${t.id}`} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && { borderBottomColor: colors.brandPrimary }]}>
            <Text style={[styles.tabText, tab === t.id && { color: colors.brandPrimary }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {tab === "basis" ? <>{opts("gender", "Geschlecht")}{opts("age", "Alter")}{swatches("skin", "Hautfarbe")}</> : null}
        {tab === "face" ? <>{swatches("eyes", "Augenfarbe")}{opts("nose", "Nase")}{opts("lips", "Lippenform")}{swatches("lipColor", "Lippenfarbe")}{opts("freckles", "Sommersprossen")}</> : null}
        {tab === "hair" ? <>{opts("hair", "Frisur")}{swatches("hairColor", "Haarfarbe")}</> : null}
        {tab === "extras" ? <>{opts("glasses", "Brille")}{swatches("glassesColor", "Brillenfarbe")}{opts("hat", "Kopfbedeckung")}{swatches("hatColor", "Farbe der Kopfbedeckung")}</> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button testID="avatar-cancel-button" label="Abbrechen" variant="secondary" style={{ flex: 1 }} onPress={close} />
        <Button testID="avatar-save" label="Speichern" icon="check" style={{ flex: 1 }} onPress={() => { p.setAvatar({ ...draft, name: draft.name.trim() || "Mein Avatar" }); close(); }} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  preview: { backgroundColor: c.surfaceSecondary, alignItems: "center", paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: c.divider },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", alignSelf: "stretch", paddingHorizontal: spacing.lg },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  h1: { fontFamily: fonts.display, fontSize: 20, fontWeight: "700", color: c.onSurface },
  stage: { width: 200, height: 200, borderRadius: 100, backgroundColor: c.mapLand, alignItems: "center", justifyContent: "flex-end", overflow: "hidden", marginTop: spacing.sm, borderWidth: 3, borderColor: c.brandPrimary },
  name: { marginTop: spacing.md, minWidth: 220, minHeight: 44, textAlign: "center", fontFamily: fonts.display, fontSize: 18, color: c.onSurface, backgroundColor: c.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.divider },
  tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabText: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.muted },
  group: { marginBottom: spacing.lg },
  gLabel: { fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: c.onSurfaceSecondary, marginBottom: spacing.sm },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  opt: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, justifyContent: "center" },
  optOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  optText: { fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: c.onSurface },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: c.border },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.divider },
}));
