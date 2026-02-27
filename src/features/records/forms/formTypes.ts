export type FieldType =
  | "text"
  | "multiline"
  | "document"
  | "select"
  | "date"
  | "list"
  | "toggle"
  | "objectList"
  | "description"
  | "timeList";

export type ShowWhen = { key: string; equals: string };

export type LabelFn = (values: Record<string, unknown>) => string;

export type ObjectListItemField = {
  key: string;
  label: string | LabelFn;
  placeholder?: string;
  type?: Exclude<FieldType, "objectList">;
  options?: readonly string[];
  showWhen?: ShowWhen;
};

export type FieldDef = {
  key: string;
  label: string | LabelFn;
  placeholder?: string;
  type?: FieldType;
  content?: string;
  required?: boolean;
  options?: readonly string[];
  showWhen?: ShowWhen;
  itemFields?: ObjectListItemField[];
  addLabel?: string;
  forcePills?: boolean;
};

export type RecordData = Record<string, unknown> | null | undefined;
