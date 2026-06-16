import type { CheckInType, ExceptionReasonCategory, ExceptionTokenType } from '../api/types';

export function formatPoints(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, '');
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const [date] = value.split('T');
  const parts = date.split('-');
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}`;
}

export function checkInTypeLabel(type: CheckInType): string {
  switch (type) {
    case 0:
      return '5AM';
    case 1:
      return 'Recuperacion dia';
    case 2:
      return 'Recuperacion finde';
    default:
      return 'Check-in';
  }
}

export function tokenTypeLabel(type: ExceptionTokenType): string {
  switch (type) {
    case 0:
      return 'Salud';
    case 1:
      return 'Compromiso obligatorio';
    case 2:
      return 'Cambio de horario';
    default:
      return 'Ficha';
  }
}

export function reasonCategoryLabel(category: ExceptionReasonCategory): string {
  switch (category) {
    case 0:
      return 'Salud';
    case 1:
      return 'Periodo';
    case 2:
      return 'Viaje laboral';
    case 3:
      return 'Viaje obligatorio';
    case 4:
      return 'Aprobada';
    default:
      return 'Ficha';
  }
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = status.toLowerCase();
  if (normalized.includes('valid') || normalized.includes('applied')) {
    return 'success';
  }

  if (normalized.includes('invalid') || normalized.includes('void')) {
    return 'danger';
  }

  if (normalized.includes('pending') || normalized.includes('available')) {
    return 'warning';
  }

  return 'neutral';
}
