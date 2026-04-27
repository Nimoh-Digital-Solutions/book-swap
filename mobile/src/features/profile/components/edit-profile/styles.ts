import { StyleSheet } from "react-native";

import { radius, spacing } from "@/constants/theme";

export const editProfileStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 20,
  },

  // Avatar
  avatarSection: { alignItems: "center", marginBottom: spacing.xl },
  avatarWrap: { position: "relative" },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarHint: { fontSize: 13, fontWeight: "500", marginTop: spacing.sm },

  // Labels
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md + 4,
    marginBottom: spacing.xs,
  },
  label: { fontSize: 14, fontWeight: "600" },
  required: { fontSize: 14, fontWeight: "700" },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, fontSize: 15, paddingVertical: 12 },
  atPrefix: { fontSize: 15, fontWeight: "600", marginRight: 2 },

  // Errors / hints
  errorText: { fontSize: 12, marginTop: 4 },
  hintText: { fontSize: 12, marginTop: 4 },
  errorBanner: { fontSize: 14, textAlign: "center", marginTop: spacing.md },

  // Picker button (genres)
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerBtnText: { flex: 1, fontSize: 15 },

  // Genre chips
  genreChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  genreChipText: { fontSize: 12, fontWeight: "600" },

  // Chip selectors (language, radius)
  chipScroll: { marginTop: 4 },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  // Submit
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl + 8,
  },
  submitBtnText: { color: "#152018", fontWeight: "700", fontSize: 16 },
});
