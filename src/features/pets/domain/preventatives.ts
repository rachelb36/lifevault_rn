// src/features/pets/domain/preventatives.ts

export type PreventativeCategory = "Flea" | "Tick" | "Heartworm" | "Combination" | "Other";

export type PetPreventative = {
  id: string;
  petId: string;

  name: string; // e.g. NexGard
  category: PreventativeCategory;

  lastAdministeredDate: string; // ISO date-only: YYYY-MM-DD
  frequencyDays: number; // 30, 90, etc.

  nextDueDate: string; // ISO date-only, computed
  reminderEnabled: boolean;

  // Local notification id if scheduled (Expo)
  notificationId?: string;

  notes?: string;

  createdAt: string;
  updatedAt: string;
};