import type { FieldDef } from "../formTypes";
import {
  TRAVEL_ID_OPTIONS,
  TRAVEL_LOYALTY_TYPE_OPTIONS,
} from "@/features/people/constants/options";

export const TRAVEL_DEFS: Partial<Record<string, FieldDef[]>> = {
  TRAVEL_IDS: [
    {
      key: "travelIds",
      label: "Travel IDs",
      type: "objectList",
      addLabel: "Add Travel ID",
      itemFields: [
        {
          key: "type",
          label: "Program type",
          type: "select",
          options: TRAVEL_ID_OPTIONS,
        },
        {
          key: "otherProgramName",
          label: "Other program name",
          showWhen: { key: "type", equals: "Other Trusted Traveler Program" },
        },
        {
          key: "number",
          label: ((values: Record<string, unknown>) => {
            const t = String(values.type ?? "");
            if (t === "TSA PreCheck") return "Known Traveler Number (KTN)";
            if (["Global Entry", "NEXUS", "SENTRI", "FAST"].includes(t))
              return "PASSID / Known Traveler Number";
            return "Program Number";
          }) as (values: Record<string, unknown>) => string,
        },
        { key: "expirationDate", label: "Expiration date", type: "date" },
        { key: "loginEmail", label: "Login email", placeholder: "Optional" },
        {
          key: "notes",
          label: "Notes",
          type: "multiline",
          placeholder: "Optional",
        },
      ],
    },
  ],

  LOYALTY_ACCOUNTS: [
    {
      key: "accounts",
      label: "Loyalty Accounts",
      type: "objectList",
      addLabel: "Add Loyalty Account",
      itemFields: [
        {
          key: "programType",
          label: "Program type",
          type: "select",
          options: TRAVEL_LOYALTY_TYPE_OPTIONS,
        },
        { key: "providerName", label: "Provider name" },
        { key: "memberNumber", label: "Member number" },
        {
          key: "loginEmailOrUsername",
          label: "Login email or username",
          placeholder: "Optional",
        },
        { key: "statusTier", label: "Status / tier", placeholder: "Optional" },
        {
          key: "notes",
          label: "Notes",
          type: "multiline",
          placeholder: "Optional",
        },
      ],
    },
  ],
};
