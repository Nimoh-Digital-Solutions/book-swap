import type { ExchangeStatus } from "@/types";

export interface BookOwner {
  id: string;
  username: string;
  avatar: string | null;
  neighborhood: string;
  avg_rating: string;
}

export interface BookDetailData {
  owner: BookOwner | string;
  [key: string]: unknown;
}

/** Statuses that allow re-requesting a swap (treated as "no exchange"). */
export const RE_REQUESTABLE_STATUSES: ExchangeStatus[] = [
  "cancelled",
  "expired",
  "declined",
];
