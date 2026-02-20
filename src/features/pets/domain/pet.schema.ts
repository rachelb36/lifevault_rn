import type { PetMedication, PetVaccination, PetWeightUnit } from "@/features/profiles/domain/profile.model";

export type PetProfileV1 = {
  schemaVersion: 1;
  id: string;
  petName: string;
  kind: string;
  kindOtherText?: string;
  breed?: string;
  breedOtherText?: string;
  dob?: string;
  adoptionDate?: string;
  avatar?: string;
  microchipId?: string;
  createdAt: string;
  updatedAt: string;

  // Weight
  weightValue?: string;
  weightUnit?: PetWeightUnit;

  // Daily care
  foodBrand?: string;
  foodType?: string;
  portionAmount?: string;
  portionUnit?: string;
  feedingTimes?: string[];
  treatAllowed?: string;
  treatRulesNotes?: string;

  // Bathroom / Walk
  pottyTimesPerDay?: string;
  pottyTimes?: string[];
  leashHarnessNotes?: string;
  avoidTriggers?: string[];
  avoidTriggersNotes?: string;

  // Sleep
  sleepLocation?: string;
  crateRule?: string;
  bedtimeRoutine?: string;

  // Behavior & Safety
  fears?: string[];
  separationAnxietyLevel?: string;
  separationAnxietyNotes?: string;

  // Medications & Vaccinations
  medications?: PetMedication[];
  vaccinations?: PetVaccination[];
};
