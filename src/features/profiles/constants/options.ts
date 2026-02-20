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

export type SensorySensitivityOption = (typeof SENSORY_SENSITIVITY_OPTIONS)[number];

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

export type TransitionSupportOption = (typeof TRANSITION_SUPPORT_OPTIONS)[number];

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
