/**
 * profile.schemas.ts
 *
 * Zod validation schemas for profile-related forms.
 */
import { z } from 'zod';

/** Dutch postcode format: 4 digits, optional space, 2 letters. */
const DUTCH_POSTCODE_RE = /^\d{4}\s?[A-Za-z]{2}$/;

// ---------------------------------------------------------------------------
// Profile edit schema
// ---------------------------------------------------------------------------

export const profileEditSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  bio: z.string().max(300, 'Bio must be 300 characters or fewer').optional(),
  preferred_genres: z
    .array(z.string())
    .max(5, 'You can select up to 5 genres')
    .optional(),
  preferred_language: z.enum(['en', 'nl', 'both']).optional(),
  preferred_radius: z
    .number()
    .min(500, 'Minimum radius is 500 metres')
    .max(50_000, 'Maximum radius is 50 km')
    .optional(),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;

// ---------------------------------------------------------------------------
// Location setup schema — postcode OR coordinates
// ---------------------------------------------------------------------------

export const locationSchema = z
  .object({
    postcode: z
      .string()
      .regex(DUTCH_POSTCODE_RE, 'Enter a valid Dutch postcode (e.g. 1012 AB)')
      .optional()
      .or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine(
    data => {
      const hasPostcode = !!data.postcode;
      const hasCoords = data.latitude != null && data.longitude != null;
      return hasPostcode || hasCoords;
    },
    {
      message: 'Provide either a postcode or coordinates',
      path: ['postcode'],
    },
  );

export type LocationFormValues = z.infer<typeof locationSchema>;
