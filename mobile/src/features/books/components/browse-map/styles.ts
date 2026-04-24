import { Platform, StyleSheet } from "react-native";

import { spacing, radius as themeRadius } from "@/constants/theme";

export const browseMapStyles = StyleSheet.create({
  root: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    borderRadius: themeRadius.pill,
    borderWidth: 1,
    marginHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  filtersSection: {
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: themeRadius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chipDivider: {
    width: 1,
    height: 24,
    alignSelf: "center",
    marginHorizontal: 2,
  },

  genreWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: themeRadius.pill,
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  sheetBg: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  sheetContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  sheetListContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.sm,
  },

  mapControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    borderRadius: themeRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mapControlIcon: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  mapControlDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },

  listHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.sm,
  },

  bookItemWrap: {},

  skeletonWrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },

  footerLoader: {
    paddingTop: spacing.sm,
  },
  loadErrorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: themeRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  loadErrorTitle: { fontSize: 15, fontWeight: "700" },
  loadErrorBody: { fontSize: 13, lineHeight: 18 },
  loadErrorRetry: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: themeRadius.pill,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  loadErrorRetryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emptyAfterError: { minHeight: 48 },
});
