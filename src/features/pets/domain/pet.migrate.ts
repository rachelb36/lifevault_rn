// src/features/pets/domain/pet.migrate.ts
import type { PetProfileV1 } from "@/features/pets/domain/pet.schema";

function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function nowIso() {
  return new Date().toISOString();
}

// Accept your existing shape and normalize to PetProfileV1
export function normalizeAndMigratePetList(raw: unknown): PetProfileV1[] {
  const list = asArray<any>(raw);

  return list
    .map((p): PetProfileV1 | null => {
      const id = asString(p.id);
      const petName = asString(p.petName);
      if (!id || !petName) return null;

      const createdAt = asString(p.createdAt) || nowIso();
      const updatedAt = nowIso();

      // Your current code stores:
      // - serviceDocuments
      // - serviceProviders
      // - dob/adoptionDate sometimes both
      const dobOrAdoptionDate =
        asString(p.dobOrAdoptionDate) ||
        asString(p.dob) ||
        asString(p.adoptionDate) ||
        "";

      return {
        schemaVersion: 1,
        id,
        petName,

        kind: (asString(p.kind) as any) || "Other",
        kindOtherText: asString(p.kindOtherText) || undefined,

        breed: asString(p.breed) || undefined,
        breedOtherText: asString(p.breedOtherText) || undefined,

        dobOrAdoptionDate: dobOrAdoptionDate || undefined,

        microchipId: asString(p.microchipId) || undefined,

        vetContact: p.vetContact ?? null,

        vaccinations: asArray(p.vaccinations),
        documents: asArray(p.documents).length ? asArray(p.documents) : asArray(p.serviceDocuments),
        medications: asArray(p.medications).map((m: any) => ({
          ...m,
          status: m.status === "history" ? "history" : "active",
        })),
        providers: asArray(p.providers).length ? asArray(p.providers) : asArray(p.serviceProviders),

        insuranceProvider: asString(p.insuranceProvider) || undefined,
        policyNumber: asString(p.policyNumber) || undefined,
        insuranceNotes: asString(p.insuranceNotes) || undefined,

        emergencyInstructions: asString(p.emergencyInstructions) || undefined,
        checklistItems: asArray(p.checklistItems),

        createdAt,
        updatedAt,
      };
    })
    .filter(Boolean) as PetProfileV1[];
}