// src/shared/utils/phone.ts
export function onlyDigits(input: string) {
  return (input || "").replace(/\D/g, "");
}

// US formatting: (###) ###-####
export function formatPhoneUS(input: string) {
  const digits = onlyDigits(input).slice(0, 10);
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 10);

  if (digits.length <= 3) return a;
  if (digits.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

export function isValidPhoneUS(input: string) {
  return onlyDigits(input).length === 10;
}