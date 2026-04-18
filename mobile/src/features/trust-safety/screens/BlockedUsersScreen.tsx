import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { radius, spacing } from "@/constants/theme";
import { useBlocks, useUnblockUser } from "../hooks/useBlocks";
import type { Block } from "@/types";

export function BlockedUsersScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { data: blocks, isLoading, refetch } = useBlocks();
  const unblock = useUnblockUser();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const confirmUnblock = useCallback(
    (block: Block) => {
      Alert.alert(
        t("blocks.unblockTitle", "Unblock {{name}}?", {
          name: block.blocked_user.first_name || block.blocked_user.username,
        }),
        t(
          "blocks.unblockMessage",
          "They will be able to see your books and send you swap requests again.",
        ),
        [
          { text: t("common.cancel", "Cancel"), style: "cancel" },
          {
            text: t("blocks.unblock", "Unblock"),
            style: "destructive",
            onPress: () => unblock.mutate(block.blocked_user.id),
          },
        ],
      );
    },
    [unblock, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Block }) => {
      const user = item.blocked_user;
      return (
        <View
          style={[
            s.row,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Avatar
            uri={user.avatar}
            name={user.first_name || user.username}
            size={40}
          />
          <View style={s.info}>
            <Text style={[s.name, { color: c.text.primary }]} numberOfLines={1}>
              {user.first_name || user.username}
            </Text>
            <Text
              style={[s.username, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              @{user.username}
            </Text>
          </View>
          <Pressable
            onPress={() => confirmUnblock(item)}
            disabled={unblock.isPending}
            style={({ pressed }) => [
              s.unblockBtn,
              {
                borderColor: c.status.error + "60",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[s.unblockText, { color: c.status.error }]}>
              {t("blocks.unblock", "Unblock")}
            </Text>
          </Pressable>
        </View>
      );
    },
    [cardBg, cardBorder, c, confirmUnblock, unblock.isPending, t],
  );

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            icon={ShieldOff}
            title={t("blocks.emptyTitle", "No blocked users")}
            subtitle={t(
              "blocks.emptySubtitle",
              "Users you block won't be able to see your books or contact you.",
            )}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.md,
    paddingBottom: 20,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700" },
  username: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  unblockText: { fontSize: 13, fontWeight: "600" },
});
