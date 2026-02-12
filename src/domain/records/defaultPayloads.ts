import { RecordType } from "./recordTypes";

// Keep this explicit map in-code until a generated payload registry is wired in.
export const DEFAULT_PAYLOADS: Partial<Record<RecordType, any>> = {};

export function defaultPayloadFor(type: RecordType) {
  const base = DEFAULT_PAYLOADS[type];
  if (!base) return {};
  // clone so edits don’t mutate the template
  return JSON.parse(JSON.stringify(base));
}
