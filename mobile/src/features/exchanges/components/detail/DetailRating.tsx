import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { radius, shadows, spacing } from "@/constants/theme";
import {
  useExchangeRatingStatus,
  useSubmitRating,
} from "@/features/ratings/hooks/useRatings";
import { StarInput } from "@/features/ratings/components/StarInput";
import { StarDisplay } from "@/features/ratings/components/StarDisplay";

interface Props {
  exchangeId: string;
}

const MAX_COMMENT = 300;

export function DetailRating({ exchangeId }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  const {
    data: status,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useExchangeRatingStatus(exchangeId);
  const submitMutation = useSubmitRating(exchangeId);

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");

  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const handleSubmit = useCallback(() => {
    if (score === 0) return;
    submitMutation.mutate(
      { score, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert(
            t("ratings.submitted", "Rating submitted!"),
            t("ratings.thankYou", "Thanks for sharing your experience."),
          );
        },
        onError: () => {
          Alert.alert(
            t("ratings.error", "Error"),
            t("ratings.submitFailed", "Failed to submit rating. Please try again."),
          );
        },
      },
    );
  }, [score, comment, submitMutation, t]);

  if (isLoading && !status) {
    return (
      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ActivityIndicator size="small" color={accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[s.errorText, { color: c.text.secondary }]}>
          {t("ratings.loadFailed", "Could not load rating status.")}
        </Text>
        <Pressable
          onPress={() => refetch()}
          disabled={isFetching}
          accessibilityRole="button"
          accessibilityLabel={t("ratings.retry", "Retry")}
          style={({ pressed }) => [
            s.retryBtn,
            { borderColor: accent, opacity: pressed || isFetching ? 0.7 : 1 },
          ]}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <Text style={[s.retryBtnText, { color: accent }]}>
              {t("ratings.retry", "Retry")}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (!status) return null;

  // Already rated — show existing ratings
  if (status.my_rating) {
    return (
      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[s.label, { color: c.text.placeholder }]}>
          {t("ratings.myRating", "My Rating")}
        </Text>
        <View style={s.ratingRow}>
          <StarDisplay score={status.my_rating.score} size={18} />
          <Text style={[s.scoreText, { color: c.text.primary }]}>
            {status.my_rating.score}/5
          </Text>
        </View>
        {!!status.my_rating.comment && (
          <Text style={[s.commentText, { color: c.text.secondary }]}>
            {status.my_rating.comment}
          </Text>
        )}

        {status.partner_rating && (
          <View style={[s.partnerSection, { borderTopColor: cardBorder }]}>
            <Text style={[s.partnerLabel, { color: c.text.placeholder }]}>
              {t("ratings.partnerRating", "Partner's Rating")}
            </Text>
            <View style={s.ratingRow}>
              <StarDisplay score={status.partner_rating.score} size={14} />
              <Text style={[s.partnerScore, { color: c.text.primary }]}>
                {status.partner_rating.score}/5
              </Text>
            </View>
            {!!status.partner_rating.comment && (
              <Text style={[s.commentText, { color: c.text.secondary }]}>
                {status.partner_rating.comment}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Can't rate — expired or not eligible
  if (!status.can_rate) return null;

  // Rating form
  return (
    <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={s.headerRow}>
        <View style={[s.iconWrap, { backgroundColor: accent + "18" }]}>
          <Star size={18} color={accent} />
        </View>
        <View style={s.headerText}>
          <Text style={[s.label, { color: c.text.placeholder }]}>
            {t("ratings.rateExchange", "Rate This Exchange")}
          </Text>
          <Text style={[s.prompt, { color: c.text.secondary }]}>
            {t("ratings.ratePrompt", "How was your experience with this swap?")}
          </Text>
        </View>
      </View>

      <View style={s.starsWrap}>
        <StarInput
          value={score}
          onChange={setScore}
          disabled={submitMutation.isPending}
        />
      </View>

      <TextInput
        style={[
          s.input,
          {
            color: c.text.primary,
            backgroundColor: isDark ? c.auth.bgDeep : c.neutral[50],
            borderColor: cardBorder,
          },
        ]}
        accessibilityLabel={t(
          "ratings.a11y.commentField",
          "Optional rating comment",
        )}
        placeholder={t(
          "ratings.commentPlaceholder",
          "Leave an optional comment (max 300 characters)…",
        )}
        placeholderTextColor={c.text.placeholder}
        value={comment}
        onChangeText={(text) => setComment(text.slice(0, MAX_COMMENT))}
        multiline
        maxLength={MAX_COMMENT}
        editable={!submitMutation.isPending}
        textAlignVertical="top"
      />
      <Text style={[s.charCount, { color: c.text.placeholder }]}>
        {comment.length}/{MAX_COMMENT}
      </Text>

      <Pressable
        onPress={handleSubmit}
        disabled={score === 0 || submitMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel={t("ratings.submitButton", "Submit Rating")}
        style={({ pressed }) => [
          s.submitBtn,
          {
            backgroundColor: accent,
            opacity: score === 0 || submitMutation.isPending ? 0.5 : pressed ? 0.9 : 1,
          },
        ]}
      >
        {submitMutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={s.submitText}>
            {t("ratings.submitButton", "Submit Rating")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  prompt: {
    fontSize: 13,
    lineHeight: 18,
  },
  starsWrap: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  input: {
    minHeight: 72,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  submitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: "700",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  partnerSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  partnerLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partnerScore: {
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  retryBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
