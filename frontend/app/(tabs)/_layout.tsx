import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";

import { Icon } from "@/src/components/Icon";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="map.fill" />
          <NativeTabs.Trigger.Label>Karte</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bible">
          <NativeTabs.Trigger.Icon sf="book.fill" />
          <NativeTabs.Trigger.Label>Bibel</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Icon sf="books.vertical.fill" />
          <NativeTabs.Trigger.Label>Bibliothek</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" />
          <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }
  const tab = (title: string, icon: string, testID: string) => ({
    title,
    tabBarButtonTestID: testID,
    tabBarIcon: ({ color, size }: { color: any; size: number }) => <Icon name={icon} size={size - 2} color={color as string} />,
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onSurface,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.brandTertiary,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center", borderRadius: 16, marginHorizontal: 6, marginVertical: 4 },
        tabBarLabelStyle: { fontFamily: fonts.text, fontWeight: "700", fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={tab("Karte", "map", "tab-map")} />
      <Tabs.Screen name="bible" options={tab("Bibel", "book-open", "tab-bible")} />
      <Tabs.Screen name="library" options={tab("Bibliothek", "archive", "tab-library")} />
      <Tabs.Screen name="profile" options={tab("Profil", "user", "tab-profile")} />
    </Tabs>
  );
}
