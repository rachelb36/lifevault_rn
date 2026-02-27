import type { FieldDef } from "../formTypes";
import {
  GENERAL_SIZE_OPTIONS,
  PERSON_MEASUREMENT_UNIT_OPTIONS,
  PERSON_SIZING_REFERENCE_OPTIONS,
  SHOE_CATEGORY_OPTIONS,
  SHOE_SYSTEM_OPTIONS,
  SHOE_WIDTH_OPTIONS,
} from "@/features/people/constants/options";

export const PREFERENCES_DEFS: Partial<Record<string, FieldDef[]>> = {
  PREFERENCES: [
    { key: "likes", label: "Likes", type: "list", placeholder: "Enter a like" },
    {
      key: "dislikes",
      label: "Dislikes",
      type: "list",
      placeholder: "Enter a dislike",
    },
    {
      key: "hobbies",
      label: "Hobbies",
      type: "list",
      placeholder: "Enter a hobby",
    },
    {
      key: "favoriteSports",
      label: "Favorite sports",
      type: "list",
      placeholder: "Enter a sport",
    },
    {
      key: "favoriteColors",
      label: "Favorite colors",
      type: "list",
      placeholder: "Enter a color",
    },
  ],

  PERSON_SIZING_PROFILE: [
    {
      key: "sizingReference",
      label: "Sizing reference",
      type: "select",
      options: PERSON_SIZING_REFERENCE_OPTIONS,
    },
    {
      key: "measurementUnit",
      label: "Measurement unit",
      type: "select",
      options: PERSON_MEASUREMENT_UNIT_OPTIONS,
    },
    {
      key: "generalSize",
      label: "General size",
      type: "select",
      options: GENERAL_SIZE_OPTIONS,
    },
    {
      key: "shoeSizes",
      label: "Shoe Sizes",
      type: "objectList",
      addLabel: "Add Shoe Size",
      itemFields: [
        { key: "label", label: "Size" },
        {
          key: "category",
          label: "Category",
          type: "select",
          options: SHOE_CATEGORY_OPTIONS,
        },
        {
          key: "system",
          label: "System",
          type: "select",
          options: SHOE_SYSTEM_OPTIONS,
        },
        {
          key: "width",
          label: "Width",
          type: "select",
          options: SHOE_WIDTH_OPTIONS,
        },
        { key: "brand", label: "Brand" },
      ],
    },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
};
