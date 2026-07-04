export function normalizeMoroccanPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If it starts with 06 or 07 and has 10 digits, replace 0 with +212
  if ((cleaned.startsWith('06') || cleaned.startsWith('07')) && cleaned.length === 10) {
    return '+212' + cleaned.substring(1);
  }

  // If it starts with 212 and has 12 digits, just add the +
  if (cleaned.startsWith('212') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  return phone; // Return as is if it doesn't match, let the form handle the error
}

export function isValidMoroccanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Valid if 10 digits starting with 06/07 OR 12 digits starting with 212
  return (
    ((cleaned.startsWith('06') || cleaned.startsWith('07')) && cleaned.length === 10) ||
    (cleaned.startsWith('212') && cleaned.length === 12)
  );
}
