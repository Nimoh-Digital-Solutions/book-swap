/**
 * block.service.ts
 *
 * Thin API wrappers for block endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  Block,
  BlockUserPayload,
  PaginatedBlocks,
} from '../types/trustSafety.types';

export const blockService = {
  /** List all users the current user has blocked. */
  async list(): Promise<PaginatedBlocks> {
    const { data } = await http.get<PaginatedBlocks>(API.blocks.list);
    return data;
  },

  /** Block a user. */
  async create(payload: BlockUserPayload): Promise<Block> {
    const { data } = await http.post<Block>(API.blocks.create, payload);
    return data;
  },

  /** Unblock a user. */
  async remove(userId: string): Promise<void> {
    await http.delete(API.blocks.delete(userId));
  },
};
