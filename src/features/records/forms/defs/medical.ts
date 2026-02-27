import type { FieldDef } from "../formTypes";
import {
  ADVOCACY_NEED_OPTIONS,
  AVOID_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  COPING_STRATEGY_OPTIONS,
  PEOPLE_CARE_PROVIDER_TYPE_OPTIONS,
  PRIVACY_LEVEL_OPTIONS,
  SAFETY_RISK_OPTIONS,
  SENSORY_SEEKING_OPTIONS,
  SENSORY_SENSITIVITY_OPTIONS,
  SENSORY_SUPPORT_OPTIONS,
  SEVERITY_OPTIONS,
  STRESSOR_OPTIONS,
  TRANSITION_SUPPORT_OPTIONS,
  TRIGGER_OPTIONS,
  VACCINE_DOSE_OPTIONS,
  HUMAN_VACCINATION_OPTIONS,
} from "@/features/people/constants/options";

export const MEDICAL_DEFS: Partial<Record<string, FieldDef[]>> = {

  MEDICAL_PROFILE: [
    { key: "bloodType", label: "Blood type", type: "select", options: BLOOD_TYPE_OPTIONS },
    {
      key: "allergies",
      label: "Allergies",
      type: "objectList",
      addLabel: "Add Allergy",
      itemFields: [
        { key: "label", label: "Allergy" },
        { key: "severity", label: "Severity", type: "select", options: SEVERITY_OPTIONS },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
    {
      key: "conditions",
      label: "Conditions",
      type: "objectList",
      addLabel: "Add Condition",
      itemFields: [
        { key: "label", label: "Condition" },
        { key: "severity", label: "Severity", type: "select", options: SEVERITY_OPTIONS },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
  ],

  MEDICAL_INSURANCE: [
    { key: "insuranceType", label: "Insurance type" },
    { key: "insurerName", label: "Insurer name" },
    { key: "memberName", label: "Member name" },
    { key: "memberId", label: "Member ID" },
    { key: "groupNumber", label: "Group number" },
    { key: "planName", label: "Plan name" },
    { key: "rx.bin", label: "RX BIN" },
    { key: "rx.pcn", label: "RX PCN" },
    { key: "rx.rxGroup", label: "RX Group" },
    { key: "customerServicePhone", label: "Customer service phone" },
    { key: "website", label: "Website" },
    { key: "effectiveDate", label: "Effective date", type: "date" },
  ],

  MEDICAL_PROCEDURES: [
    {
      key: "procedures",
      label: "Procedures",
      type: "objectList",
      addLabel: "Add Procedure",
      itemFields: [
        { key: "procedureName", label: "Procedure name" },
        { key: "monthYear", label: "Date", type: "date" },
        { key: "reasonNotes", label: "Reason / Notes", type: "multiline" },
        { key: "providerOrHospital", label: "Provider / Hospital" },
        { key: "complications", label: "Complications" },
      ],
    },
  ],

  PRESCRIPTIONS: [
    {
      key: "prescriptions",
      label: "Prescriptions",
      type: "objectList",
      addLabel: "Add Prescription",
      itemFields: [
        { key: "medicationName", label: "Medication name" },
        { key: "dosage", label: "Dosage" },
        { key: "frequency", label: "Frequency" },
        { key: "indication", label: "Indication" },
        {
          key: "prescribingProviderContactId",
          label: "Prescribing provider contact ID",
        },
        { key: "pharmacyContactId", label: "Pharmacy contact ID" },
        { key: "startDate", label: "Start date", type: "date" },
        { key: "endDate", label: "End date", type: "date" },
        { key: "discontinued", label: "Discontinued", type: "toggle" },
        {
          key: "privacy",
          label: "Privacy",
          type: "select",
          options: PRIVACY_LEVEL_OPTIONS,
        },
        { key: "isActive", label: "Active", type: "toggle" },
      ],
    },
  ],

  VACCINATIONS: [
    {
      key: "vaccinations",
      label: "Vaccinations",
      type: "objectList",
      addLabel: "Add Vaccination",
      itemFields: [
        { key: "vaccineName", label: "Vaccine name", type: "select", options: [...HUMAN_VACCINATION_OPTIONS] },
        { key: "doseNumber", label: "Dose number", type: "select", options: VACCINE_DOSE_OPTIONS },
        { key: "dateAdministered", label: "Date administered", type: "date" },
        { key: "expirationDate", label: "Expiration date", type: "date" },
        { key: "providerContactId", label: "Provider contact ID" },
      ],
    },
  ],

  VISION_PRESCRIPTION: [
    { key: "rxDate", label: "RX date", type: "date" },
    { key: "doctorContactId", label: "Doctor contact ID" },
  ],

  PRIVATE_HEALTH_PROFILE: [
    {
      key: "_intro",
      label: "",
      type: "description",
      content:
        "This section helps others understand how to support this person in stressful, medical, or high-demand situations.\n\nAdd triggers, stressors, sensory needs, and strategies that help them feel safe, regulated, and understood.\n\nOnly visible to you unless shared.",
    },
    {
      key: "advocacyNeeds",
      label:
        "What accommodations or supports help this person succeed in school, social, or medical settings?",
      type: "list",
      options: ADVOCACY_NEED_OPTIONS,
    },
    {
      key: "stressors",
      label:
        "What situations or environments commonly increase stress or overwhelm?",
      type: "list",
      options: STRESSOR_OPTIONS,
    },
    {
      key: "triggers",
      label:
        "What specific experiences or interactions may cause immediate distress or escalation?",
      type: "list",
      options: TRIGGER_OPTIONS,
    },
    {
      key: "copingStrategies",
      label:
        "What helps this person calm, regulate, or feel safe when overwhelmed?",
      type: "list",
      options: COPING_STRATEGY_OPTIONS,
    },
    {
      key: "avoids",
      label: "What approaches should be avoided during stress or escalation?",
      type: "list",
      options: AVOID_OPTIONS,
    },
    {
      key: "sensorySensitivities",
      label:
        "Are there sensory inputs that are especially uncomfortable or overwhelming?",
      type: "list",
      options: SENSORY_SENSITIVITY_OPTIONS,
    },
    {
      key: "sensorySeeking",
      label: "Does this person actively seek certain sensory input?",
      type: "list",
      options: SENSORY_SEEKING_OPTIONS,
    },
    {
      key: "sensorySupports",
      label:
        "What tools or environmental supports help regulate sensory needs?",
      type: "list",
      options: SENSORY_SUPPORT_OPTIONS,
    },
    {
      key: "transitionSupports",
      label:
        "What helps during transitions between activities or environments?",
      type: "list",
      options: TRANSITION_SUPPORT_OPTIONS,
    },
    {
      key: "safetyRisks",
      label: "Are there safety considerations caregivers should be aware of?",
      type: "list",
      options: SAFETY_RISK_OPTIONS,
    },
  ],

  PEOPLE_CARE_PROVIDERS: [
    {
      key: "providerType",
      label: "Provider type",
      type: "select",
      options: PEOPLE_CARE_PROVIDER_TYPE_OPTIONS,
    },
    { key: "contactId", label: "Contact ID" },
  ],
};
