import { RecordType } from "@/domain/records/recordTypes";
import type { FieldDef } from "../formTypes";
import { IDENTIFICATION_DEFS } from "./identification";
import { MEDICAL_DEFS } from "./medical";
import { SCHOOL_DEFS } from "./school";
import { PREFERENCES_DEFS } from "./preferences";
import { TRAVEL_DEFS } from "./travel";
import { LEGAL_DEFS } from "./legal";
import { PET_DEFS } from "./pet";

export const FORM_DEFS: Partial<Record<RecordType, FieldDef[]>> = {
  ...IDENTIFICATION_DEFS,
  ...MEDICAL_DEFS,
  ...SCHOOL_DEFS,
  ...PREFERENCES_DEFS,
  ...TRAVEL_DEFS,
  ...LEGAL_DEFS,
  ...PET_DEFS,
} as Partial<Record<RecordType, FieldDef[]>>;
