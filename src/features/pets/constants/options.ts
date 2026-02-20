export const KIND_OPTIONS = [
  "Dog",
  "Cat",
  "Bird",
  "Reptile",
  "Fish",
  "Small Animal",
  "Other",
] as const;

export const DOG_BREEDS = [
  "Akita",
  "Alaskan Malamute",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Beagle",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Border Collie",
  "Boston Terrier",
  "Boxer",
  "Bulldog",
  "Cane Corso",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chow Chow",
  "Cocker Spaniel",
  "Dachshund",
  "Doberman Pinscher",
  "English Setter",
  "English Springer Spaniel",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Havanese",
  "Husky (Siberian Husky)",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltese",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Mixed / Unknown",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Pit Bull / American Pit Bull Terrier",
  "Pomeranian",
  "Poodle (Miniature)",
  "Poodle (Standard)",
  "Poodle (Toy)",
  "Pug",
  "Rottweiler",
  "Samoyed",
  "Shiba Inu",
  "Shih Tzu",
  "Staffordshire Bull Terrier",
  "Vizsla",
  "Weimaraner",
  "West Highland White Terrier",
  "Yorkshire Terrier",
  "Other",
] as const;

export const CAT_BREEDS = [
  "Abyssinian",
  "American Curl",
  "American Shorthair",
  "Balinese",
  "Bengal",
  "Birman",
  "British Shorthair",
  "Burmese",
  "Cornish Rex",
  "Devon Rex",
  "Domestic Long Hair",
  "Domestic Medium Hair",
  "Domestic Short Hair",
  "Egyptian Mau",
  "Maine Coon",
  "Mixed / Unknown",
  "Norwegian Forest Cat",
  "Oriental Shorthair",
  "Persian",
  "Ragdoll",
  "Russian Blue",
  "Scottish Fold",
  "Siamese",
  "Siberian",
  "Sphynx",
  "Turkish Angora",
  "Other",
] as const;

// src/features/pets/options.ts
// Pet sitter profile / care plan options (constants only)

//
// ---------- Basic Daily Care ----------
//

export const PET_FOOD_TYPE_OPTIONS = [
  "Dry",
  "Wet",
  "Raw",
  "Fresh",
  "Prescription",
  "Other",
] as const;

export type PetFoodTypeOption = (typeof PET_FOOD_TYPE_OPTIONS)[number];

export const PET_PORTION_UNIT_OPTIONS = ["Cups", "Grams"] as const;
export type PetPortionUnitOption = (typeof PET_PORTION_UNIT_OPTIONS)[number];

// If you don't want to maintain brand lists, keep this empty and use free text.
// You can also seed with common brands later.
export const PET_FOOD_BRAND_OPTIONS = [] as const;
export type PetFoodBrandOption = (typeof PET_FOOD_BRAND_OPTIONS)[number];

export const PET_TREAT_ALLOWED_OPTIONS = ["Yes", "No", "Only for training"] as const;
export type PetTreatAllowedOption = (typeof PET_TREAT_ALLOWED_OPTIONS)[number];

export const PET_TREAT_PURPOSE_OPTIONS = [
  "Training",
  "After potty",
  "After walk",
  "Medication",
  "Calming",
  "Other",
] as const;

export type PetTreatPurposeOption = (typeof PET_TREAT_PURPOSE_OPTIONS)[number];

//
// ---------- Bathroom / Walk Routine ----------
//

export const CAT_LITTER_TYPE_OPTIONS = [
  "Clumping",
  "Non-clumping",
  "Crystal",
  "Pine / Pellet",
  "Paper",
  "Corn / Wheat",
  "Other",
] as const;

export type CatLitterTypeOption =
  (typeof CAT_LITTER_TYPE_OPTIONS)[number];

export const CAT_SCOOPING_SCHEDULE_OPTIONS = [
  "After each use",
  "1x per day",
  "2x per day",
  "Every other day",
  "As needed",
] as const;

export type CatScoopingScheduleOption =
  (typeof CAT_SCOOPING_SCHEDULE_OPTIONS)[number];


export const PET_POTTY_TIMES_PER_DAY_OPTIONS = ["1", "2", "3", "4", "5", "6"] as const;
export type PetPottyTimesPerDayOption =
  (typeof PET_POTTY_TIMES_PER_DAY_OPTIONS)[number];

export const PET_AVOID_TRIGGER_OPTIONS = [
  "Dogs",
  "Bikes",
  "Kids",
  "Cats",
  "Skateboards",
  "Crowds",
  "Other",
] as const;

export type PetAvoidTriggerOption = (typeof PET_AVOID_TRIGGER_OPTIONS)[number];

//
// ---------- Sleep ----------
//

export const PET_SLEEP_LOCATION_OPTIONS = [
  "Crate",
  "Dog bed",
  "Owner bed",
  "Couch",
  "Laundry room",
  "Other",
] as const;

export type PetSleepLocationOption = (typeof PET_SLEEP_LOCATION_OPTIONS)[number];

export const PET_CRATE_RULE_OPTIONS = ["Door open", "Door closed", "No crate"] as const;
export type PetCrateRuleOption = (typeof PET_CRATE_RULE_OPTIONS)[number];\



export const CAT_SLEEP_LOCATION_OPTIONS = [
  "In human bed",
  "Cat bed",
  "Cat tree",
  "Window perch",
  "Under bed",
  "Closet / hidden space",
  "On couch",
  "Other",
] as const;

export type CatSleepLocationOption =
  (typeof CAT_SLEEP_LOCATION_OPTIONS)[number];

//
// ---------- Personality & Behavioral Notes ----------
// (Fears list exactly as you specified; multi-select + Other text)
//

export const PET_FEAR_OPTIONS = [
  "Thunder",
  "Fireworks",
  "Vacuum",
  "Doorbell",
  "Strangers entering home",
  "Men with hats",
  "Children",
  "Other dogs",
  "Car rides",
  "Grooming",
  "Nail trimming",
  "Loud music",
  "Other",
] as const;

export type PetFearOption = (typeof PET_FEAR_OPTIONS)[number];

export const PET_SEPARATION_ANXIETY_LEVEL_OPTIONS = [
  "None – Completely calm",
  "Mild – Whines or paces briefly",
  "Moderate – Barks/howls for extended time",
  "Severe – Destructive behavior or self-harm risk",
  "Not sure",
] as const;

export type PetSeparationAnxietyLevelOption =
  (typeof PET_SEPARATION_ANXIETY_LEVEL_OPTIONS)[number];

export const PET_RESOURCE_GUARDING_OPTIONS = [
  "No",
  "Yes – Food only",
  "Yes – Toys only",
  "Yes – Bed/space",
  "Yes – Multiple items",
] as const;

export type PetResourceGuardingOption =
  (typeof PET_RESOURCE_GUARDING_OPTIONS)[number];

export const PET_ESCAPE_TENDENCY_OPTIONS = [
  "No – Reliable",
  "Occasionally curious",
  "Yes – Door-darter",
  "Yes – Fence climber/digger",
  "Yes – Will run if off leash",
] as const;

export type PetEscapeTendencyOption = (typeof PET_ESCAPE_TENDENCY_OPTIONS)[number];

export const PET_AGGRESSION_TRIGGER_OPTIONS = [
  "Food",
  "Toys",
  "Being touched while sleeping",
  "Touching paws",
  "Touching hips",
  "Grooming",
  "Other dogs",
  "Cats",
  "Children",
  "Strangers entering home",
  "Pain/injury",
  "No aggression history",
  "Other",
] as const;

export type PetAggressionTriggerOption =
  (typeof PET_AGGRESSION_TRIGGER_OPTIONS)[number];

export const PET_STRANGER_INTRODUCTION_OPTIONS = [
  "Friendly – Can approach immediately",
  "Needs calm introduction",
  "Should ignore pet at first",
  "Must meet outdoors first",
  "Avoid direct eye contact",
  "Not comfortable with strangers",
] as const;

export type PetStrangerIntroductionOption =
  (typeof PET_STRANGER_INTRODUCTION_OPTIONS)[number];

export const PET_TOUCH_SENSITIVITY_AREA_OPTIONS = [
  "Ears",
  "Paws",
  "Tail",
  "Hips",
  "Back",
  "Stomach",
  "Face",
  "No sensitivities",
  "Other",
] as const;

export type PetTouchSensitivityAreaOption =
  (typeof PET_TOUCH_SENSITIVITY_AREA_OPTIONS)[number];

//
// ---------- Medications & Supplements ----------
//

export const PET_MED_ADMIN_METHOD_OPTIONS = [
  "With food",
  "Hidden in pill pocket",
  "Crushed",
  "Directly by mouth",
  "Topical",
  "Injection",
  "Other",
] as const;

export type PetMedAdminMethodOption =
  (typeof PET_MED_ADMIN_METHOD_OPTIONS)[number];

export const PET_MISSED_DOSE_INSTRUCTION_OPTIONS = [
  "Give as soon as remembered",
  "Skip missed dose (do not double)",
  "Call owner",
  "Call vet",
  "Other",
] as const;

export type PetMissedDoseInstructionOption =
  (typeof PET_MISSED_DOSE_INSTRUCTION_OPTIONS)[number];

export const PET_SIDE_EFFECT_SEVERITY_OPTIONS = [
  "Mild (monitor)",
  "Moderate (contact owner)",
  "Severe (emergency vet)",
] as const;

export type PetSideEffectSeverityOption =
  (typeof PET_SIDE_EFFECT_SEVERITY_OPTIONS)[number];

//
// ---------- Optional helper: risk flags for sitter summary ----------
//

export const PET_HIGH_RISK_SEPARATION_LEVELS: ReadonlyArray<PetSeparationAnxietyLevelOption> =
  ["Severe – Destructive behavior or self-harm risk"];

export const PET_HIGH_RISK_ESCAPE_LEVELS: ReadonlyArray<PetEscapeTendencyOption> =
  ["Yes – Door-darter", "Yes – Fence climber/digger", "Yes – Will run if off leash"];



export const PET_DOCUMENT_TYPE_OPTIONS = [
  "Vaccination Record",
  "Rabies Certificate",
  "ESA Letter",
  "Training Certificate",
  "Service Animal ID",
  "Adoption Papers",
  "Registration / License",
  "Microchip Registration",
  "Other",
] as const;

export type PetDocumentType = (typeof PET_DOCUMENT_TYPE_OPTIONS)[number];

export const PET_PROVIDER_TYPE_OPTIONS = [
  "Primary Vet",
  "Emergency Vet",
  "Specialist Vet",
  "Boarding",
  "Walker",
  "Trainer",
  "Sitter",
  "Other",
] as const;

// Vaccinations (dog vs cat)

export const DOG_VACCINATION_OPTIONS = [
  "Rabies",
  "DHPP (Distemper, Hepatitis/Adenovirus, Parvovirus, Parainfluenza)",
  "Bordetella (Kennel Cough)",
  "Leptospirosis",
  "Canine Influenza",
  "Lyme",
  "Rattlesnake",
  "Other",
] as const;

export type DogVaccinationOption = (typeof DOG_VACCINATION_OPTIONS)[number];

export const CAT_VACCINATION_OPTIONS = [
  "Rabies",
  "FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)",
  "FeLV (Feline Leukemia)",
  "FIV (Feline Immunodeficiency Virus)",
  "Chlamydia",
  "Bordetella",
  "Other",
] as const;

export type CatVaccinationOption = (typeof CAT_VACCINATION_OPTIONS)[number];

export type PetProviderTypeOption = (typeof PET_PROVIDER_TYPE_OPTIONS)[number];

export const PET_NEUTERED_OPTIONS = ["Yes", "No", "Unknown"] as const;

export type PetNeuteredOption = (typeof PET_NEUTERED_OPTIONS)[number];
