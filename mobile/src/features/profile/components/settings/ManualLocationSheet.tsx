import { Navigation } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors, useIsDark } from "@/hooks/useColors";

import { settingsStyles as s } from "./styles";

interface ManualLocationSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (postcode: string) => Promise<{ neighborhood?: string | null }>;
  onUseGps: () => void;
}

export function ManualLocationSheet({
  visible,
  onClose,
  onSubmit,
  onUseGps,
}: ManualLocationSheetProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const data = await onSubmit(trimmed);
      onClose();
      setInput("");
      Alert.alert(
        t("settings.locationUpdated", "Location updated"),
        data.neighborhood
          ? t("settings.locationUpdatedMsg", "Set to {{neighborhood}}", {
              neighborhood: data.neighborhood,
            })
          : t(
              "settings.locationUpdatedGeneric",
              "Your location has been updated.",
            ),
      );
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "settings.manualLocationError",
          "Could not find that location. Please check and try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.sheetOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={s.sheetBackdrop} onPress={onClose} />
        <View
          style={[
            s.sheetContent,
            { backgroundColor: isDark ? c.auth.card : c.surface.white },
          ]}
        >
          <View style={s.sheetHandle} />
          <Text style={[s.sheetTitle, { color: c.text.primary }]}>
            {t("settings.setManually", "Set location manually")}
          </Text>
          <Text style={[s.sheetDesc, { color: c.text.secondary }]}>
            {t(
              "settings.manualLocationHint",
              "Enter a city, neighborhood, or postcode to set your location without using GPS.",
            )}
          </Text>
          <TextInput
            style={[
              s.sheetInput,
              {
                color: c.text.primary,
                backgroundColor: isDark ? c.auth.bg : c.neutral[50],
                borderColor: isDark ? c.auth.cardBorder : c.border.default,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder={t(
              "settings.manualLocationPlaceholder",
              "e.g. Amsterdam West, 1054",
            )}
            placeholderTextColor={c.text.placeholder}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            autoFocus
          />
          <Pressable
            onPress={handleSubmit}
            disabled={submitting || !input.trim()}
            style={({ pressed }) => [
              s.sheetBtn,
              {
                backgroundColor: c.auth.golden,
                opacity:
                  submitting || !input.trim() ? 0.5 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={c.auth.bgDeep} />
            ) : (
              <Text style={s.sheetBtnText}>
                {t("settings.setLocationBtn", "Set location")}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onUseGps();
            }}
            style={({ pressed }) => [
              s.sheetResetLink,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Navigation size={14} color={c.text.placeholder} />
            <Text style={[s.sheetResetText, { color: c.text.placeholder }]}>
              {t("settings.resetToGps", "Use GPS instead")}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
