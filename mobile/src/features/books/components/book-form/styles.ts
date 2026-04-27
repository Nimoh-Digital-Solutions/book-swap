import { StyleSheet } from "react-native";

import { radius, spacing } from "@/constants/theme";

export const bookFormStyles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },

  coverWrap: {
    width: 120,
    height: 170,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  cover: { width: "100%", height: "100%" },

  isbnBadge: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  isbnText: { fontSize: 12, fontWeight: "500" },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  label: { fontSize: 14, fontWeight: "600" },
  required: { fontSize: 14, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 72,
    paddingTop: 12,
  },

  errorText: { fontSize: 12, marginTop: 4 },

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

  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 4,
  },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  genreChipText: { fontSize: 12, fontWeight: "600" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
  },
  primaryBtnText: { color: "#152018", fontWeight: "700", fontSize: 16 },

  dangerZone: {
    marginTop: spacing.xl + 8,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700" },
});
