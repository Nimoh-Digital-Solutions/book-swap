import { StyleSheet } from "react-native";

import { radius, shadows, spacing } from "@/constants/theme";

export const bookDetailStyles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 16 },

  coverHero: {
    height: 280,
    objectFit: "cover",
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  coverTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  coverAuthor: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  availBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  author: { fontSize: 15 },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  metaText: { fontSize: 13, fontWeight: "600" },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  descSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  description: { fontSize: 15, lineHeight: 24 },
  inlineEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.sm,
  },
  inlineEmptyText: { fontSize: 14, fontStyle: "italic" },

  ownerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 15, fontWeight: "700" },
  ownerStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  ownerStat: { fontSize: 12, fontWeight: "500" },
  ownerDot: { fontSize: 12 },

  ctaWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  ctaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  wishlistBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },

  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },

  reportRow: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  reportText: {
    fontSize: 13,
    fontWeight: "500",
  },

  bottomSpacer: { height: 20 },

  exchangeCtaContent: {
    flex: 1,
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  exchangeBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  exchangeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  exchangeBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  editHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 0.5,
  },
});

export const COVER_COLORS = [
  "#2D5F3F",
  "#3B4F7A",
  "#6B3A5E",
  "#7A5C2E",
  "#2B4E5F",
] as const;
