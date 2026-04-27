import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { Avatar } from "@/components/Avatar";

interface Participant {
  username: string;
  avatar: string | null;
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
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  return (
    <View style={[s.wrap, { borderColor: cardBorder + '40' }]}>
      <Text style={[s.label, { color: c.text.placeholder }]}>{label}</Text>

      <View style={s.row}>
        <View style={s.participant}>
          <Avatar
            uri={requester.avatar}
            name={requester.username}
            size={36}
          />
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
          <Avatar
            uri={owner.avatar}
            name={owner.username}
            size={36}
          />
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
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "700" },
  role: { fontSize: 10, marginTop: 1 },
});
