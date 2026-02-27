import type { FieldDef } from "../formTypes";
import {
  PET_AGGRESSION_TRIGGER_OPTIONS,
  PET_AVOID_TRIGGER_OPTIONS,
  PET_CRATE_RULE_OPTIONS,
  PET_DOCUMENT_TYPE_OPTIONS,
  PET_ESCAPE_TENDENCY_OPTIONS,
  PET_FEAR_OPTIONS,
  PET_FOOD_TYPE_OPTIONS,

  PET_MED_ADMIN_METHOD_OPTIONS,
  PET_MISSED_DOSE_INSTRUCTION_OPTIONS,
  PET_NEUTERED_OPTIONS,
  PET_PORTION_UNIT_OPTIONS,
  PET_POTTY_TIMES_PER_DAY_OPTIONS,
  PET_PROVIDER_TYPE_OPTIONS,
  PET_RESOURCE_GUARDING_OPTIONS,
  PET_SEPARATION_ANXIETY_LEVEL_OPTIONS,

  PET_SLEEP_LOCATION_OPTIONS,
  PET_STRANGER_INTRODUCTION_OPTIONS,
  PET_TOUCH_SENSITIVITY_AREA_OPTIONS,
  PET_TREAT_ALLOWED_OPTIONS,
  PET_TREAT_PURPOSE_OPTIONS,
  PET_WEIGHT_UNIT_OPTIONS,
} from "@/features/pets/constants/options";

export const PET_DEFS: Partial<Record<string, FieldDef[]>> = {
  PET_BASICS: [
    {
      key: "isNeutered",
      label: "Neutered / Spayed",
      type: "select",
      options: PET_NEUTERED_OPTIONS,
    },
    { key: "microchipId", label: "Microchip ID" },
  ],

  PET_WEIGHT_ENTRY: [
    { key: "weightValue", label: "Weight" },
    {
      key: "weightUnit",
      label: "Unit",
      type: "select",
      options: PET_WEIGHT_UNIT_OPTIONS,
    },
    { key: "measuredAt", label: "Date measured", type: "date" },
  ],
  PET_CARE_PROVIDERS: [
    {
      key: "providerType",
      label: "Provider type",
      type: "select",
      options: PET_PROVIDER_TYPE_OPTIONS,
    },
    { key: "contactId", label: "Contact ID" },
  ],
  PET_VACCINATIONS: [
    { key: "vaccineName", label: "Vaccine name" },
    { key: "dateAdministered", label: "Date administered", type: "date" },
    { key: "doseNumber", label: "Dose number" },
    { key: "doseTotal", label: "Dose total" },
    { key: "providerContactId", label: "Provider contact ID" },
  ],
  PET_FLEA_PREVENTION: [
    { key: "productName", label: "Product name" },
    { key: "dateGiven", label: "Date given", type: "date" },
    { key: "nextDueDate", label: "Next due date", type: "date" },
  ],
  PET_SURGERIES: [
    { key: "procedureName", label: "Procedure name" },
    { key: "date", label: "Date", type: "date" },
    { key: "clinicOrHospital", label: "Clinic or hospital" },
    { key: "surgeonOrVetContactId", label: "Surgeon/Vet contact ID" },
  ],
  PET_INSURANCE: [
    { key: "providerName", label: "Provider name" },
    { key: "policyNumber", label: "Policy number" },
    { key: "memberId", label: "Member ID" },
    { key: "customerServicePhone", label: "Customer service phone" },
  ],


  PET_MEDICATIONS: [
    { key: "medicationName", label: "Medication name" },
    { key: "dosage", label: "Dosage" },
    {
      key: "adminMethod",
      label: "How administered",
      type: "select",
      options: PET_MED_ADMIN_METHOD_OPTIONS,
    },
    {
      key: "missedDoseAction",
      label: "If missed dose",
      type: "select",
      options: PET_MISSED_DOSE_INSTRUCTION_OPTIONS,
    },
    {
      key: "sideEffectsNotes",
      label: "Side effects to watch for",
      type: "multiline",
    },
  ],
  PET_DIAGNOSES: [
    { key: "diagnosisName", label: "Diagnosis" },
    { key: "date", label: "Date", type: "date" },
    { key: "notes", label: "Notes", type: "multiline" },
  ],
  PET_FEEDING_ROUTINE: [
    { key: "foodBrand", label: "Food brand" },
    {
      key: "foodType",
      label: "Food type",
      type: "select",
      options: PET_FOOD_TYPE_OPTIONS,
    },
    { key: "portionAmount", label: "Portion amount" },
    {
      key: "portionUnit",
      label: "Portion unit",
      type: "select",
      options: PET_PORTION_UNIT_OPTIONS,
    },
    {
      key: "feedingTimes",
      label: "Feeding times",
      type: "timeList",
    },
    {
      key: "treatAllowed",
      label: "Treats allowed",
      type: "select",
      options: PET_TREAT_ALLOWED_OPTIONS,
    },
    {
      key: "treatPurpose",
      label: "Treat purpose",
      type: "select",
      options: PET_TREAT_PURPOSE_OPTIONS,
    },
    { key: "treatRulesNotes", label: "Treat rules / notes", type: "multiline" },
  ],
  PET_BATHROOM_ROUTINE: [
    { key: "pottyTimesPerDay", label: "Times per day", type: "select", options: PET_POTTY_TIMES_PER_DAY_OPTIONS },
    {
      key: "leashHarnessNotes",
      label: "Leash / harness details",
      type: "multiline",
    },
    {
      key: "avoidTriggers",
      label: "Avoid triggers",
      type: "list",
      options: PET_AVOID_TRIGGER_OPTIONS,
    },
    { key: "avoidTriggersNotes", label: "Trigger notes", type: "multiline" },
    {
      key: "pottyScheduleTimes",
      label: "Potty schedule",
      type: "timeList",
    },
  ],
  PET_SLEEP_ROUTINE: [
    {
      key: "sleepLocation",
      label: "Sleep location",
      type: "select",
      options: PET_SLEEP_LOCATION_OPTIONS,
    },
    {
      key: "crateRule",
      label: "Crate rules",
      type: "select",
      options: PET_CRATE_RULE_OPTIONS,
    },
    { key: "bedtimeRoutine", label: "Bedtime routine", type: "multiline" },
  ],
  PET_BEHAVIOR_PROFILE: [
    { key: "fears", label: "Fears", type: "list", options: PET_FEAR_OPTIONS, forcePills: true },
    {
      key: "separationAnxietyLevel",
      label: "Separation anxiety",
      type: "select",
      options: PET_SEPARATION_ANXIETY_LEVEL_OPTIONS,
    },
    {
      key: "separationAnxietyNotes",
      label: "Anxiety notes",
      type: "multiline",
    },
    {
      key: "resourceGuarding",
      label: "Resource guarding",
      type: "select",
      options: PET_RESOURCE_GUARDING_OPTIONS,
    },
    {
      key: "escapeTendency",
      label: "Escape tendency",
      type: "select",
      options: PET_ESCAPE_TENDENCY_OPTIONS,
    },
    {
      key: "aggressionTriggers",
      label: "Aggression triggers",
      type: "list",
      options: PET_AGGRESSION_TRIGGER_OPTIONS,
      forcePills: true,
    },
    {
      key: "strangerIntro",
      label: "Stranger introduction",
      type: "select",
      options: PET_STRANGER_INTRODUCTION_OPTIONS,
    },
    {
      key: "touchSensitivities",
      label: "Touch sensitivities",
      type: "list",
      options: PET_TOUCH_SENSITIVITY_AREA_OPTIONS,
      forcePills: true,
    },
  ],
  PET_DOCUMENT: [
    { key: "label", label: "Label" },
    {
      key: "documentType",
      label: "Document type",
      type: "select",
      options: PET_DOCUMENT_TYPE_OPTIONS,
    },
  ],
};
