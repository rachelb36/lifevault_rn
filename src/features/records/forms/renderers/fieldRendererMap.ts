import type React from "react";
import type { FieldRendererProps } from "./FieldRendererProps";

import DescriptionField from "./DescriptionField";
import TextInputField from "./TextInputField";
import ToggleField from "./ToggleField";
import SelectField from "./SelectField";
import DateField from "./DateField";
import ContactIdField from "./ContactIdField";
import DocumentField from "./DocumentField";
import ListField from "./ListField";
import ObjectListField from "./ObjectListField";
import TimeListField from "./TimeListField";

/**
 * Maps a FieldType string to the React component that renders it.
 *
 * "text" and "multiline" both use TextInputField (the component checks `type`
 * for multiline behavior). The default fallback is also TextInputField.
 */
export const fieldRendererMap: Record<
  string,
  React.ComponentType<FieldRendererProps>
> = {
  description: DescriptionField,
  text: TextInputField,
  multiline: TextInputField,
  toggle: ToggleField,
  select: SelectField,
  date: DateField,
  contactId: ContactIdField,
  document: DocumentField,
  list: ListField,
  objectList: ObjectListField,
  timeList: TimeListField,
};

/** Get the renderer for a field type, falling back to TextInputField. */
export function getFieldRenderer(
  type: string | undefined,
): React.ComponentType<FieldRendererProps> {
  return fieldRendererMap[type ?? "text"] ?? TextInputField;
}
