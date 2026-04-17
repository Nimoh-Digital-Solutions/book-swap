import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";

const AVATAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

interface Participant {
  username: string;
  swap_count: number;
}

interface Props {
  requester: Participant;
  owner: Participant;
  label: string;
  requesterRole: string;
  ownerRole: string;
}

export function DetailParticipants({
  requester,
  owner,
  label,
  requesterRole,
  ownerRole,
}: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  const reqColor =
    AVATAR_COLORS[requester.username.charCodeAt(0) % AVATAR_COLORS.length];
  const ownColor =
    AVATAR_COLORS[owner.username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View style={s.wrap}>
      <Text style={[s.label, { color: c.text.placeholder }]}>{label}</Text>

      <View style={s.row}>
        <View style={s.participant}>
          <View style={[s.avatar, { backgroundColor: reqColor + "20" }]}>
            <Text style={[s.avatarText, { color: reqColor }]}>
              {requester.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={s.info}>
            <Text style={[s.name, { color: c.text.primary }]} numberOfLines={1}>
              @{requester.username}
            </Text>
            <Text
              style={[s.role, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {requesterRole} · {requester.swap_count} swaps
            </Text>
          </View>
        </View>

        <View style={s.participant}>
          <View style={[s.avatar, { backgroundColor: ownColor + "20" }]}>
            <Text style={[s.avatarText, { color: ownColor }]}>
              {owner.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={s.info}>
            <Text style={[s.name, { color: c.text.primary }]} numberOfLines={1}>
              @{owner.username}
            </Text>
            <Text
              style={[s.role, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {ownerRole} · {owner.swap_count} swaps
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  participant: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "700" },
  role: { fontSize: 10, marginTop: 1 },
});
