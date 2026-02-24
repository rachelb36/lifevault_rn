// src/features/people/constants/options.ts

// ─────────────────────────────────────────────
// Person header fields
// ─────────────────────────────────────────────
export const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Partner",
  "Child",
  "Mother",
  "Father",
  "Parent",
  "Grandparent",
  "Caregiver",
  "Other",
] as const;

export type RelationshipOption = (typeof RELATIONSHIP_OPTIONS)[number];

export const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

// Useful if you want an optional field shown only when gender === "Other"
export const GENDER_OTHER_VALUE = "Other" as const;

// ─────────────────────────────────────────────
// People contacts / care team
// ─────────────────────────────────────────────
export const PEOPLE_CARE_PROVIDER_TYPE_OPTIONS = [
  "Primary Care",
  "Pediatrician",
  "Dentist",
  "Optometrist",
  "Therapist",
  "Specialist",
  "Pharmacy",
  "Emergency Contact",
  "Other",
] as const;

export type PeopleCareProviderTypeOption =
  (typeof PEOPLE_CARE_PROVIDER_TYPE_OPTIONS)[number];

// Optional: relationship on School authorized pickup list, etc.
export const CONTACT_RELATIONSHIP_OPTIONS = [
  ...RELATIONSHIP_OPTIONS,
  "Aunt",
  "Uncle",
  "Cousin",
  "Sibling",
  "Stepparent",
  "Step-sibling",
  "Family Friend",
  "Neighbor",
  "Babysitter",
  "Nanny",
  "Coach",
  "Teacher",
  "Guardian",
] as const;

export type ContactRelationshipOption =
  (typeof CONTACT_RELATIONSHIP_OPTIONS)[number];

// ─────────────────────────────────────────────
// Medical / health helpers (reused across records)
// ─────────────────────────────────────────────
export const BLOOD_TYPE_OPTIONS = [
  "Unknown",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export type BloodTypeOption = (typeof BLOOD_TYPE_OPTIONS)[number];

export const SEVERITY_OPTIONS = [
  "Unknown",
  "Mild",
  "Moderate",
  "Severe",
] as const;

export type SeverityOption = (typeof SEVERITY_OPTIONS)[number];

export const ALLERGY_TYPE_OPTIONS = [
  "Food",
  "Medication",
  "Environmental",
  "Insect",
  "Latex",
  "Other",
] as const;

export type AllergyTypeOption = (typeof ALLERGY_TYPE_OPTIONS)[number];

export const VACCINE_DOSE_OPTIONS = [
  "Unknown",
  "1",
  "2",
  "3",
  "Booster",
  "Annual",
  "Other",
] as const;

export type VaccineDoseOption = (typeof VACCINE_DOSE_OPTIONS)[number];

export const HUMAN_VACCINATION_OPTIONS = [
  "COVID-19",
  "Influenza (Flu)",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "MMR (Measles, Mumps, Rubella)",
  "Varicella (Chickenpox)",
  "Hepatitis A",
  "Hepatitis B",
  "HPV",
  "Meningococcal",
  "Pneumococcal",
  "Polio (IPV)",
  "Rotavirus",
  "Shingles (Zoster)",
  "RSV",
  "Other",
] as const;
export type HumanVaccinationOption = (typeof HUMAN_VACCINATION_OPTIONS)[number];

// Privacy is used in your prescriptions objectList right now
export const PRIVACY_LEVEL_OPTIONS = ["STANDARD", "PRIVATE"] as const;
export type PrivacyLevelOption = (typeof PRIVACY_LEVEL_OPTIONS)[number];

// ─────────────────────────────────────────────
// Private health / support profile (your existing lists)
// ─────────────────────────────────────────────
export const ADVOCACY_NEED_OPTIONS = [
  "Extra processing time",
  "Clear/simple instructions",
  "Breaks without penalty",
  "Movement breaks",
  "One direction at a time",
  "Visual schedule",
  "First/Then language",
  "Advance notice for changes",
  "Reduced transitions",
  "Prefer quiet environment",
  "Headphones allowed",
  "Seating preference (front/back/edge)",
  "Nonverbal response accepted",
  "Adult check-ins",
  "Safe person identified",
  "Written instructions preferred",
  "Chunked tasks",
  "Assistive tech/AAC support",
  "Behavior is communication reminder",
  "Sensory supports allowed",
  "Food/water access allowed",
  "Prefer not to be touched",
  "Permission-based interaction only",
  "Other",
] as const;

export type AdvocacyNeedOption = (typeof ADVOCACY_NEED_OPTIONS)[number];

export const STRESSOR_OPTIONS = [
  "Crowds",
  "Noise (general)",
  "Transitions between activities",
  "Being rushed",
  "Unpredictable schedule",
  "Time pressure",
  "Multi-step directions",
  "Bright lights",
  "Strong smells",
  "Messy/chaotic spaces",
  "New places",
  "New people",
  "Social demands",
  "Conflict/tension nearby",
  "Waiting in lines",
  "Hunger/thirst",
  "Poor sleep",
  "Unexpected touch",
  "Too many questions",
  "Too much talking",
  "Performance pressure",
  "Change in caregiver/teacher",
  "Medical appointments",
  "Other",
] as const;

export type StressorOption = (typeof STRESSOR_OPTIONS)[number];

export const TRIGGER_OPTIONS = [
  "Unexpected change",
  "Sensory overload",
  "Hunger",
  "Fatigue",
  "Denied a preferred item/activity",
  "Sudden loud sounds",
  "Teasing/bullying",
  "Feeling misunderstood",
  "Being corrected publicly",
  "Loss of control/choice",
  "Forced eye contact",
  "Forced physical contact",
  "Transitions without warning",
  "Tasks that feel too hard",
  "Pain/illness",
  "Embarrassment",
  "Being interrupted",
  "Being told 'calm down'",
  "Being ignored",
  "Other",
] as const;

export type TriggerOption = (typeof TRIGGER_OPTIONS)[number];

export const COPING_STRATEGY_OPTIONS = [
  "Quiet space / cool down corner",
  "Movement break",
  "Headphones/ear defenders",
  "Breathing exercises",
  "Deep pressure (hug/weighted blanket)",
  "Compression clothing",
  "Music",
  "Dim lights",
  "Count-down / timer",
  "Swinging/rocking",
  "Fidget tool",
  "Chewing tool",
  "Cold water / ice",
  "Snack / hydration",
  "Visual schedule",
  "First/Then reminders",
  "Social story",
  "Short walk",
  "Body scan / mindfulness",
  "Scripting what to say",
  "Text instead of speaking",
  "Choice board",
  "Reward/motivation system",
  "Parallel play",
  "One trusted adult support",
  "Other",
] as const;

export type CopingStrategyOption = (typeof COPING_STRATEGY_OPTIONS)[number];

export const AVOID_OPTIONS = [
  "Raising voice",
  "Physical restraint (unless safety emergency)",
  "Public correction",
  "Sarcasm",
  "Arguing / lengthy reasoning in the moment",
  "Crowding their space",
  "Too many questions",
  "Threats or ultimatums",
  "Taking away all choices",
  "Forcing eye contact",
  "Touch without consent",
  "Other",
] as const;

export type AvoidOption = (typeof AVOID_OPTIONS)[number];

export const SENSORY_SENSITIVITY_OPTIONS = [
  "Sound (high volume)",
  "Touch (light touch)",
  "Smells",
  "Bright lights",
  "Sound (multiple sources)",
  "Touch (tags/seams)",
  "Taste/textures",
  "Visual clutter",
  "Crowds/close proximity",
  "Heat",
  "Cold",
  "Other",
] as const;

export type SensorySensitivityOption =
  (typeof SENSORY_SENSITIVITY_OPTIONS)[number];

export const SENSORY_SEEKING_OPTIONS = [
  "Chewing",
  "Jumping",
  "Rocking",
  "Spinning",
  "Crashing into cushions",
  "Humming/vocalizing",
  "Touching textures",
  "Pacing",
  "Carrying heavy objects",
  "Other",
] as const;

export type SensorySeekingOption = (typeof SENSORY_SEEKING_OPTIONS)[number];

export const SENSORY_SUPPORT_OPTIONS = [
  "Noise-canceling headphones",
  "Fidgets",
  "Weighted blanket/lap pad",
  "Movement breaks",
  "Compression vest/clothing",
  "Chewelry",
  "Wobble cushion",
  "Quiet room",
  "Dim lighting",
  "Visual boundaries",
  "Other",
] as const;

export type SensorySupportOption = (typeof SENSORY_SUPPORT_OPTIONS)[number];

export const TRANSITION_SUPPORT_OPTIONS = [
  "5-minute warning",
  "Visual schedule",
  "Timer visible",
  "First/Then board",
  "2-minute warning",
  "Choice at transition (walk/hop/skip)",
  "Transition object",
  "Preview plan before leaving",
  "Social story",
  "Other",
] as const;

export type TransitionSupportOption =
  (typeof TRANSITION_SUPPORT_OPTIONS)[number];

export const SAFETY_RISK_OPTIONS = [
  "Elopement / running off",
  "Impulsivity near streets",
  "Self-injury",
  "Aggression when overwhelmed",
  "Climbing / jumping risks",
  "Pica (eating non-food items)",
  "Water safety concerns",
  "Medication risks",
  "Online safety concerns",
  "Other",
] as const;

export type SafetyRiskOption = (typeof SAFETY_RISK_OPTIONS)[number];

// ─────────────────────────────────────────────
// Travel (merged in from travelOptions.ts)
// ─────────────────────────────────────────────
export const TRAVEL_ID_OPTIONS = [
  "TSA PreCheck",
  "Global Entry",
  "NEXUS",
  "SENTRI",
  "FAST",
  "Other Trusted Traveler Program",
] as const;

export type TravelIdOption = (typeof TRAVEL_ID_OPTIONS)[number];

export const TRAVEL_LOYALTY_TYPE_OPTIONS = [
  "Airline",
  "Hotel",
  "Car Rental",
  "Booking Site / OTA",
  "Other",
] as const;

export type TravelLoyaltyTypeOption =
  (typeof TRAVEL_LOYALTY_TYPE_OPTIONS)[number];

// ─────────────────────────────────────────────
// Sizing profiles (NEW — what you couldn’t find)
// ─────────────────────────────────────────────

// Which sizing "system" does this profile refer to?
export const PERSON_SIZING_REFERENCE_OPTIONS = [
  "Women's Regular",
  "Women's Plus",
  "Women's Petite",
  "Women's Junior",
  "Women's Casual Shirts",
  "Women's Pants Regular",
  "Women's Pants Plus",
  "Women's Pants Petite",
  "Men's Dress Shirt",
  "Men's Casual Shirt",
  "Men's Casual Shirt Big & Tall",
  "Men's Coats & Jackets",
  "Youth",
  "Custom",
] as const;

export type PersonSizingReferenceOption =
  (typeof PERSON_SIZING_REFERENCE_OPTIONS)[number];

// Units for measurements
export const PERSON_MEASUREMENT_UNIT_OPTIONS = ["in", "cm"] as const;
export type PersonMeasurementUnitOption =
  (typeof PERSON_MEASUREMENT_UNIT_OPTIONS)[number];

// General size labels (used by many systems)
export const GENERAL_SIZE_OPTIONS = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
] as const;

export type GeneralSizeOption = (typeof GENERAL_SIZE_OPTIONS)[number];

// Women’s plus label set often uses 0X-5X (keep separate)
export const WOMENS_PLUS_SIZE_OPTIONS = [
  "0X",
  "1X",
  "2X",
  "3X",
  "4X",
  "5X",
] as const;
export type WomensPlusSizeOption = (typeof WOMENS_PLUS_SIZE_OPTIONS)[number];

// Youth general sizes (common retail)
export const YOUTH_SIZE_OPTIONS = [
  "2T",
  "3T",
  "4T",
  "5T",
  "XS",
  "S",
  "M",
  "L",
  "XL",
] as const;

export const SHOE_CATEGORY_OPTIONS = ["Women's", "Men's", "Youth"] as const;

export const SHOE_SYSTEM_OPTIONS = ["US", "EU", "UK"] as const;

export const SHOE_WIDTH_OPTIONS = [
  "Narrow",
  "Regular",
  "Wide",
  "Extra Wide",
] as const;

export type YouthSizeOption = (typeof YOUTH_SIZE_OPTIONS)[number];

// Shoe sizes are messy; keep it as free text in the form,
// but if you want a starter list you can use this:
export const SHOE_SIZE_NOTE_OPTIONS = ["US", "EU", "UK", "Kids"] as const;

export type ShoeSizeNoteOption = (typeof SHOE_SIZE_NOTE_OPTIONS)[number];

// ─────────────────────────────────────────────
// Legal / Property documents
// ─────────────────────────────────────────────
export const LEGAL_DOCUMENT_TYPE_OPTIONS = [
  "Will",
  "Trust",
  "Power of Attorney",
  "Living Will",
  "Court Order",
  "Deed",
  "Title",
  "Other",
] as const;

export type LegalDocumentTypeOption = (typeof LEGAL_DOCUMENT_TYPE_OPTIONS)[number];

// ─────────────────────────────────────────────
// Other documents
// ─────────────────────────────────────────────
export const OTHER_DOCUMENT_CATEGORY_OPTIONS = [
  "Financial",
  "Employment",
  "Education",
  "Tax",
  "Insurance",
  "Membership",
  "Warranty",
  "Other",
] as const;

export type OtherDocumentCategoryOption = (typeof OTHER_DOCUMENT_CATEGORY_OPTIONS)[number];
