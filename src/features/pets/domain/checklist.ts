import type { ChecklistItem } from "./pet.model";

export function buildSuggestedChecklist(kind: string): ChecklistItem[] {
  const general: ChecklistItem[] = [
    { id: "g1", label: "Vet contact added", isChecked: false, isSuggested: true, category: "general" },
    { id: "g2", label: "Vaccination records uploaded", isChecked: false, isSuggested: true, category: "general" },
    { id: "g3", label: "Microchip ID saved", isChecked: false, isSuggested: true, category: "general" },
    { id: "g4", label: "Medications reviewed/added", isChecked: false, isSuggested: true, category: "general" },
    { id: "g5", label: "Pet insurance info added", isChecked: false, isSuggested: true, category: "general" },
    { id: "g6", label: "Emergency instructions added", isChecked: false, isSuggested: true, category: "general" },
    { id: "g7", label: "Caregiver/sitter added", isChecked: false, isSuggested: true, category: "general" },
  ];

  if (kind === "Dog") {
    return [
      ...general,
      { id: "d1", label: "Rabies tag / proof saved", isChecked: false, isSuggested: true, category: "dog_optional" },
      { id: "d2", label: "Heartworm prevention noted", isChecked: false, isSuggested: true, category: "dog_optional" },
      { id: "d3", label: "Flea/tick prevention noted", isChecked: false, isSuggested: true, category: "dog_optional" },
      { id: "d4", label: "Leash/harness size noted", isChecked: false, isSuggested: true, category: "dog_optional" },
      { id: "d5", label: "Boarding/daycare contact added", isChecked: false, isSuggested: true, category: "dog_optional" },
    ];
  }

  if (kind === "Cat") {
    return [
      ...general,
      { id: "c1", label: "Rabies tag / proof saved", isChecked: false, isSuggested: true, category: "cat_optional" },
      { id: "c2", label: "Flea/tick prevention noted", isChecked: false, isSuggested: true, category: "cat_optional" },
      { id: "c3", label: "Carrier location noted", isChecked: false, isSuggested: true, category: "cat_optional" },
      { id: "c4", label: "Litter preference noted", isChecked: false, isSuggested: true, category: "cat_optional" },
      { id: "c5", label: "Boarding/sitter contact added", isChecked: false, isSuggested: true, category: "cat_optional" },
    ];
  }

  return general;
}

/**
 * ✅ Fix: preserve custom items when kind changes.
 */
export function mergeChecklistPreservingCustom(
  kind: string,
  existing: ChecklistItem[]
): ChecklistItem[] {
  const suggested = buildSuggestedChecklist(kind);
  const suggestedIds = new Set(suggested.map((i) => i.id));

  const custom = existing.filter((item) => !item.isSuggested || !suggestedIds.has(item.id));

  const mergedSuggested = suggested.map((s) => {
    const old = existing.find((e) => e.id === s.id);
    return old ? { ...s, isChecked: old.isChecked } : s;
  });

  const relevantSuggested = mergedSuggested.filter((item) => {
    if (item.category === "general") return true;
    if (item.category === "dog_optional") return kind === "Dog";
    if (item.category === "cat_optional") return kind === "Cat";
    return true;
  });

  return [...relevantSuggested, ...custom];
}
