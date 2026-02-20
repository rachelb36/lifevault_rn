import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nowIso() {
  return new Date().toISOString();
}

export function normalizeAndMigratePetList(raw: unknown): PetProfileV1[] {
  const list = asArray<any>(raw);

  return list
    .map((p): PetProfileV1 | null => {
      const id = asString(p?.id).trim();
      const petName = asString(p?.petName || p?.name).trim();
      if (!id || !petName) return null;

      const createdAt = asString(p?.createdAt) || nowIso();
      const updatedAt = nowIso();

      // Legacy migration: dobOrAdoptionDate → dob
      const dob =
        asString(p?.dob) ||
        asString(p?.dobOrAdoptionDate) ||
        "";

      return {
        schemaVersion: 1,
        id,
        petName,
        kind: asString(p?.kind) || "Other",
        kindOtherText: asString(p?.kindOtherText) || undefined,
        breed: asString(p?.breed) || undefined,
        breedOtherText: asString(p?.breedOtherText) || undefined,
        dob: dob || undefined,
        adoptionDate: asString(p?.adoptionDate) || undefined,
        avatar: asString(p?.avatar) || undefined,
        microchipId: asString(p?.microchipId) || undefined,
        createdAt,
        updatedAt,

        // Preserve all extended fields
        weightValue: asString(p?.weightValue) || undefined,
        weightUnit: p?.weightUnit || undefined,

        foodBrand: asString(p?.foodBrand) || undefined,
        foodType: asString(p?.foodType) || undefined,
        portionAmount: asString(p?.portionAmount) || undefined,
        portionUnit: asString(p?.portionUnit) || undefined,
        feedingTimes: Array.isArray(p?.feedingTimes) ? p.feedingTimes : undefined,
        treatAllowed: asString(p?.treatAllowed) || undefined,
        treatRulesNotes: asString(p?.treatRulesNotes) || undefined,

        pottyTimesPerDay: asString(p?.pottyTimesPerDay) || undefined,
        pottyTimes: Array.isArray(p?.pottyTimes) ? p.pottyTimes : undefined,
        leashHarnessNotes: asString(p?.leashHarnessNotes) || undefined,
        avoidTriggers: Array.isArray(p?.avoidTriggers) ? p.avoidTriggers : undefined,
        avoidTriggersNotes: asString(p?.avoidTriggersNotes) || undefined,

        sleepLocation: asString(p?.sleepLocation) || undefined,
        crateRule: asString(p?.crateRule) || undefined,
        bedtimeRoutine: asString(p?.bedtimeRoutine) || undefined,

        fears: Array.isArray(p?.fears) ? p.fears : undefined,
        separationAnxietyLevel: asString(p?.separationAnxietyLevel) || undefined,
        separationAnxietyNotes: asString(p?.separationAnxietyNotes) || undefined,

        medications: Array.isArray(p?.medications) ? p.medications : undefined,
        vaccinations: Array.isArray(p?.vaccinations) ? p.vaccinations : undefined,
      };
    })
    .filter(Boolean) as PetProfileV1[];
}
