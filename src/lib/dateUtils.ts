import { parseISO, format, isValid } from 'date-fns';

/**
 * Converts any date representation into strict YYYY-MM-DD string format for <input type="date">
 * Handles:
 * - "Wed Aug 12 2026 00:00:00 GMT+0530 (India Standard Time)"
 * - "2026-08-12T00:00:00.000Z"
 * - "2026-08-12"
 * - Date objects
 */
export function toYYYYMMDD(input: any): string {
  if (!input) return '';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Handle YYYY-MM-DDTHH:mm:ss... ISO format
    if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    // Try parseISO
    try {
      const parsedIso = parseISO(trimmed);
      if (isValid(parsedIso)) {
        return format(parsedIso, 'yyyy-MM-dd');
      }
    } catch {}
    // Try new Date
    try {
      const parsedDate = new Date(trimmed);
      if (isValid(parsedDate) && !isNaN(parsedDate.getTime())) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
    } catch {}
  } else if (input instanceof Date && isValid(input)) {
    return format(input, 'yyyy-MM-dd');
  }
  return '';
}

/**
 * Formats date for display: e.g. "Aug 12, 2026"
 */
export function formatDisplayDate(input: any): string {
  const ymd = toYYYYMMDD(input);
  if (!ymd) return '';
  const [year, month, day] = ymd.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return format(d, 'MMM d, yyyy');
}

/**
 * Formats Start Date and End/Due Date range for Kanban Card display:
 * e.g., "Aug 12 — Aug 19, 2026" or "Aug 12, 2026"
 */
export function formatDateRangeDisplay(startInput: any, dueInput: any): string {
  const startYmd = toYYYYMMDD(startInput);
  const dueYmd = toYYYYMMDD(dueInput);

  if (startYmd && dueYmd) {
    const [sY, sM, sD] = startYmd.split('-').map(Number);
    const [dY, dM, dD] = dueYmd.split('-').map(Number);
    const startDate = new Date(sY, sM - 1, sD);
    const dueDate = new Date(dY, dM - 1, dD);

    if (startYmd === dueYmd) {
      return format(startDate, 'MMM d, yyyy');
    }

    if (sY === dY) {
      return `${format(startDate, 'MMM d')} — ${format(dueDate, 'MMM d, yyyy')}`;
    }
    return `${format(startDate, 'MMM d, yyyy')} — ${format(dueDate, 'MMM d, yyyy')}`;
  }

  if (startYmd) {
    return `Start: ${formatDisplayDate(startYmd)}`;
  }

  if (dueYmd) {
    return `Due: ${formatDisplayDate(dueYmd)}`;
  }

  return 'No Dates Set';
}
