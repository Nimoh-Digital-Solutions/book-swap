import type { TFunction } from "i18next";
import { z } from "zod";

export function createProfileEditSchema(t: TFunction) {
  return z.object({
    first_name: z
      .string()
      .min(
        1,
        t(
          "profile.edit.validation.firstNameRequired",
          "First name is required",
        ),
      )
      .max(50),
    last_name: z
      .string()
      .min(
        1,
        t("profile.edit.validation.lastNameRequired", "Last name is required"),
      )
      .max(50),
    bio: z
      .string()
      .max(
        300,
        t("profile.edit.validation.bioMax", "Bio must be 300 characters or fewer"),
      ),
    preferred_genres: z
      .array(z.string())
      .max(
        5,
        t("profile.edit.validation.genresMax", "You can select up to 5 genres"),
      ),
    preferred_language: z.enum(["en", "nl", "both"]),
    preferred_radius: z.number().min(500).max(50_000),
  });
}

export type EditProfileFormValues = z.infer<
  ReturnType<typeof createProfileEditSchema>
>;

export const LANGUAGE_OPTION_KEYS = [
  "en",
  "nl",
  "both",
] as const satisfies readonly EditProfileFormValues["preferred_language"][];

export const RADIUS_VALUES = [
  1000, 2000, 5000, 10000, 25000, 50000,
] as const;

export const PROFILE_FORM_FIELDS: (keyof EditProfileFormValues)[] = [
  "first_name",
  "last_name",
  "bio",
  "preferred_genres",
  "preferred_language",
  "preferred_radius",
];
