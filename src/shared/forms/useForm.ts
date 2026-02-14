import { useMemo, useState } from "react";

export type Validator<T> = (value: any, values: T) => string | null;

export type Validators<T> = Partial<Record<keyof T, Validator<T>>>;

export function useForm<T extends Record<string, any>>(opts: {
  initialValues: T;
  validators?: Validators<T>;
}) {
  const { initialValues, validators = {} } = opts;

  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validateField = (key: keyof T, nextValue?: any) => {
    const v = validators[key];
    if (!v) return null;

    const value = typeof nextValue !== "undefined" ? nextValue : values[key];
    const err = v(value, { ...values, [key]: value });
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
    return err;
  };

  const validateAll = () => {
    const nextErrors: Partial<Record<keyof T, string>> = {};
    (Object.keys(validators) as Array<keyof T>).forEach((k) => {
      const err = validators[k]?.(values[k], values) ?? null;
      if (err) nextErrors[k] = err;
    });
    setErrors(nextErrors);
    return nextErrors;
  };

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const setField = (key: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // if user already touched field, validate as they type
    if (touched[key]) validateField(key, value);
  };

  const blurField = (key: keyof T) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    validateField(key);
  };

  const touchAll = () => {
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    (Object.keys(values) as Array<keyof T>).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);
  };

  return {
    values,
    setValues,
    setField,
    errors,
    touched,
    isValid,
    blurField,
    validateField,
    validateAll,
    touchAll,
  };
}