import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, PenLine, Check, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { radius, spacing } from "@/constants/theme";
import type { AddBookPreference } from "@/lib/storage";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (choice: AddBookPreference, remember: boolean) => void;
}

interface OptionProps {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  onPress: () => void;
  cardBg: string;
  cardBorder: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

function OptionCard({
  icon: Icon,
  label,
  subtitle,
  onPress,
  cardBg,
  cardBorder,
  accent,
  textPrimary,
  textSecondary,
}: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.optionCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[s.optionIcon, { backgroundColor: accent + "18" }]}>
        <Icon size={24} color={accent} />
      </View>
      <View style={s.optionText}>
        <Text style={[s.optionLabel, { color: textPrimary }]}>{label}</Text>
        <Text style={[s.optionSub, { color: textSecondary }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function AddBookModal({ visible, onClose, onSelect }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const [remember, setRemember] = useState(false);

  const sheetBg = isDark ? c.auth.bgDeep : "#fff";
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];

  const handleSelect = (choice: AddBookPreference) => {
    onSelect(choice, remember);
    setRemember(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable
          style={[s.sheet, { backgroundColor: sheetBg }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          {/* Header */}
          <View style={s.header}>
            <Text style={[s.title, { color: c.text.primary }]}>
              Add a book
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            How would you like to add your book?
          </Text>

          {/* Options */}
          <View style={s.options}>
            <OptionCard
              icon={Camera}
              label="Scan barcode"
              subtitle="Point your camera at the book's barcode"
              onPress={() => handleSelect("scan")}
              cardBg={cardBg}
              cardBorder={cardBorder}
              accent={accent}
              textPrimary={c.text.primary}
              textSecondary={c.text.secondary}
            />
            <OptionCard
              icon={PenLine}
              label="Enter ISBN manually"
              subtitle="Type the book details yourself"
              onPress={() => handleSelect("manual")}
              cardBg={cardBg}
              cardBorder={cardBorder}
              accent={accent}
              textPrimary={c.text.primary}
              textSecondary={c.text.secondary}
            />
          </View>

          {/* Remember checkbox */}
          <Pressable
            onPress={() => setRemember((prev) => !prev)}
            style={s.rememberRow}
          >
            <View
              style={[
                s.checkbox,
                {
                  borderColor: remember ? accent : cardBorder,
                  backgroundColor: remember ? accent : "transparent",
                },
              ]}
            >
              {remember && <Check size={13} color="#152018" strokeWidth={3} />}
            </View>
            <Text style={[s.rememberText, { color: c.text.secondary }]}>
              Remember my choice
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 16,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: "800" },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 14, marginBottom: spacing.lg },

  options: { gap: spacing.sm },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 16, fontWeight: "700" },
  optionSub: { fontSize: 13 },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: { fontSize: 14, fontWeight: "500" },
});
