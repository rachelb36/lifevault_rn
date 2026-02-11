// AUTO-GENERATED. DO NOT EDIT.
// Source: /Users/rachelburgos/my_applications/lifevault-api/docs/payloads.json

export const payloadShapes = {
  "PASSPORT": {
    "firstName": "",
    "middleName": "",
    "lastName": "",
    "passportNumber": "",
    "nationality": "",
    "dateOfBirth": "",
    "sex": "",
    "placeOfBirth": "",
    "issueDate": "",
    "expirationDate": "",
    "issuingCountry": "",
    "issuingAuthority": "",
    "mrzRaw": ""
  },
  "PASSPORT_CARD": {
    "fullName": "",
    "passportCardNumber": "",
    "dateOfBirth": "",
    "expirationDate": "",
    "issuingCountry": "",
    "mrzRaw": ""
  },
  "DRIVERS_LICENSE": {
    "fullName": "",
    "dlNumber": "",
    "dateOfBirth": "",
    "expirationDate": "",
    "issueDate": "",
    "address": {
      "line1": "",
      "line2": "",
      "city": "",
      "state": "",
      "postalCode": "",
      "country": ""
    },
    "licenseClass": "",
    "restrictions": [],
    "issuingRegion": ""
  },
  "BIRTH_CERTIFICATE": {
    "childFullName": "",
    "dateOfBirth": "",
    "placeOfBirth": {
      "city": "",
      "county": "",
      "state": "",
      "country": ""
    },
    "certificateNumber": "",
    "parents": {
      "includeParents": false,
      "parent1Name": null,
      "parent2Name": null
    }
  },
  "SOCIAL_SECURITY_CARD": {
    "fullName": "",
    "ssn": ""
  },
  "INSURANCE_POLICY": {
    "insuranceType": "",
    "insurerName": "",
    "memberName": "",
    "memberId": "",
    "groupNumber": "",
    "planName": "",
    "rx": {
      "bin": "",
      "pcn": "",
      "rxGroup": ""
    },
    "customerServicePhone": "",
    "website": "",
    "effectiveDate": "",
    "notes": ""
  },
  "MEDICAL_PROFILE": {
    "bloodType": "",
    "allergies": [
      {
        "id": "",
        "label": "",
        "severity": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "conditions": [
      {
        "id": "",
        "label": "",
        "severity": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "notes": ""
  },
  "MEDICAL_PROCEDURES": {
    "procedures": [
      {
        "id": "",
        "procedureName": "",
        "monthYear": "",
        "reasonNotes": "",
        "providerOrHospital": "",
        "complications": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "PRESCRIPTIONS": {
    "prescriptions": [
      {
        "id": "",
        "medicationName": "",
        "dosage": "",
        "frequency": "",
        "indication": "",
        "prescribingProviderContactId": "",
        "pharmacyContactId": "",
        "startDate": "",
        "endDate": null,
        "discontinued": false,
        "notes": "",
        "privacy": "STANDARD",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "VACCINATIONS": {
    "vaccinations": [
      {
        "id": "",
        "vaccineName": "",
        "doseNumber": "",
        "dateAdministered": "",
        "expirationDate": null,
        "providerContactId": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "VISION_PRESCRIPTION": {
    "rxDate": "",
    "doctorContactId": "",
    "notes": ""
  },
  "PRIVATE_HEALTH_PROFILE": {
    "privacyEnforced": true,
    "mentalHealthProviders": [
      {
        "id": "",
        "contactId": "",
        "specialty": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "mentalHealthMeds": [
      {
        "id": "",
        "medicationName": "",
        "dosage": "",
        "frequency": "",
        "startDate": "",
        "endDate": null,
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "stressors": [
      {
        "id": "",
        "title": "",
        "category": "",
        "severity": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "copingStrategies": [
      {
        "id": "",
        "title": "",
        "whenToUse": "",
        "helpfulContactId": null,
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "crisisPlan": {
      "warningSigns": [],
      "preferredActions": [],
      "emergencyContactIds": [],
      "providerToContactFirstId": "",
      "notes": ""
    },
    "privateNotes": [
      {
        "id": "",
        "note": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "SCHOOL_INFO": {
    "schoolName": "",
    "address": {
      "line1": "",
      "city": "",
      "state": "",
      "postalCode": "",
      "country": ""
    },
    "mainOfficePhone": "",
    "nurseContactId": "",
    "counselorContactId": "",
    "notes": ""
  },
  "AUTHORIZED_PICKUP": {
    "authorizedPickup": [
      {
        "id": "",
        "contactId": "",
        "relationship": "",
        "notes": "",
        "rules": [],
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "PET_PROFILE": {
    "kind": "",
    "breed": "",
    "dobOrAdoptionDate": "",
    "microchipId": "",
    "emergencyInstructions": "",
    "notes": ""
  },
  "PET_SERVICE_DOCS": {
    "label": "",
    "notes": ""
  },
  "PET_VET_RECORDS": {
    "label": "",
    "notes": ""
  },
  "PREFERENCES": {
    "likes": [],
    "dislikes": [],
    "hobbies": [],
    "favoriteSports": [],
    "favoriteColors": []
  },
  "SIZES": {
    "clothingSizes": [
      {
        "id": "",
        "label": "",
        "brand": "",
        "notes": "",
        "effectiveDate": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ],
    "shoeSizes": [
      {
        "id": "",
        "label": "",
        "brand": "",
        "notes": "",
        "effectiveDate": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "TRAVEL_IDS": {
    "travelIds": [
      {
        "id": "",
        "type": "",
        "number": "",
        "expirationDate": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "LOYALTY_ACCOUNTS": {
    "accounts": [
      {
        "id": "",
        "programType": "",
        "providerName": "",
        "memberNumber": "",
        "notes": "",
        "createdAt": "",
        "updatedAt": "",
        "isActive": true
      }
    ]
  },
  "LEGAL_PROPERTY_DOCUMENT": {
    "documentType": "",
    "title": "",
    "ownerEntityId": "",
    "issueDate": "",
    "expirationDate": null,
    "notes": ""
  },
  "OTHER_DOCUMENT": {
    "title": "",
    "notes": ""
  }
} as const;

export type PayloadRecordType = keyof typeof payloadShapes;

export type PayloadShapeMap = typeof payloadShapes;

export type PayloadFor<T extends PayloadRecordType> = PayloadShapeMap[T];
