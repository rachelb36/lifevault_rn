import type { FieldType, LabelFn, ObjectListItemField, ShowWhen } from "../formTypes";

/**
 * Props passed to every field renderer by RecordTypeFormRenderer.
 *
 * Individual renderers pick what they need; the parent always passes the full bag.
 */
export type FieldRendererProps = {
  /** The field definition key (e.g. "firstName") */
  fieldKey: string;

  /** Resolved display label */
  label: string;

  /** Raw label from definition (may be a LabelFn) */
  rawLabel: string | LabelFn;

  /** Optional placeholder text */
  placeholder?: string;

  /** Current value for this field */
  fieldValue: unknown;

  /** Options for select / list fields */
  options?: readonly string[];

  /** Conditional visibility */
  showWhen?: ShowWhen;

  /** Whether the field is required */
  required?: boolean;

  /** Static content text (description fields) */
  content?: string;

  /** The declared field type */
  type?: FieldType;

  /** Sub-fields for objectList type */
  itemFields?: ObjectListItemField[];

  /** Custom add-row label for objectList */
  addLabel?: string;

  // ---- Callbacks from parent ----

  /** Set a top-level field value */
  setField: (key: string, value: unknown) => void;

  /** Open the date picker modal */
  openDatePicker: (
    fieldKey: string,
    fieldLabel: string,
    listContext?: {
      listFieldKey: string;
      rowIndex: number;
      itemKey: string;
      currentValue: unknown;
    },
  ) => void;

  /** Open the option picker sheet */
  openPickerSheet: (
    fieldKey: string,
    label: string,
    options: string[],
    multiSelect: boolean,
  ) => void;

  /** Open the contact picker modal */
  openContactPicker: (target: {
    scope: "top" | "row";
    fieldKey: string;
    rowIndex?: number;
    itemKey?: string;
    title: string;
  }) => void;

  // ---- Inline-add state (for list fields) ----

  inlineAdd: {
    fieldKey: string | null;
    fieldLabel: string;
    draft: string;
  };
  setInlineAdd: React.Dispatch<
    React.SetStateAction<{
      fieldKey: string | null;
      fieldLabel: string;
      draft: string;
    }>
  >;
  openInlineAdd: (fieldKey: string, fieldLabel: string) => void;
  closeInlineAdd: () => void;
  commitInlineAdd: () => void;

  // ---- Object list helpers ----

  expandedItem: { fieldKey: string; index: number } | null;
  expandItem: (fieldKey: string, index: number) => void;
  collapseItem: () => void;
  getObjectListItems: (fieldKey: string) => Record<string, unknown>[];
  addObjectListItem: (fieldKey: string, itemFields: ObjectListItemField[]) => void;
  updateObjectListItem: (fieldKey: string, index: number, itemKey: string, nextValue: unknown) => void;
  removeObjectListItem: (fieldKey: string, index: number) => void;

  /** Resolve contact ID to display label */
  resolveContactLabel: (idValue: unknown) => string;

  /** All current form values */
  allValues: Record<string, unknown>;
};
