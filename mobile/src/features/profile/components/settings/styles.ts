import { StyleSheet } from "react-native";

import { radius, spacing } from "@/constants/theme";

export const settingsStyles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: 20,
  },

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + 4,
    paddingVertical: spacing.lg,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 14, fontWeight: "500", marginTop: 2 },

  // Section heading
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingLeft: 4,
  },

  // Card
  card: {
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 20,
    elevation: 1,
  },
  divider: { height: 1, marginHorizontal: spacing.md },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },

  // Location & radius
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  locationBtnText: { fontSize: 12, fontWeight: "600" },
  radiusSection: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  radiusScroll: { marginTop: spacing.sm + 2 },
  radiusChips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  radiusChipText: { fontSize: 13, fontWeight: "600" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
    marginTop: spacing.xl + 8,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },

  // Bottom links row
  bottomLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  bottomLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },
  bottomLinkText: { fontSize: 13, textDecorationLine: "underline" },
  bottomDot: { width: 3, height: 3, borderRadius: 1.5 },

  // Manual location sheet
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", marginBottom: spacing.xs },
  sheetDesc: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  sheetInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  sheetBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  sheetBtnText: { color: "#152018", fontWeight: "700", fontSize: 16 },
  sheetResetLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  sheetResetText: { fontSize: 14, fontWeight: "600" },

  // Footer
  footer: {
    textAlign: "center",
    marginTop: spacing.xl,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
