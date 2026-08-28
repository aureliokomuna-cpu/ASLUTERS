/**
 * Utilities for Date parsing and calculation for Informa Logistics Tracking
 */

import { DeliveryStatus, ProgressStep } from '../types';

/**
 * Check if the raw date string indicates an unscheduled placeholder (1/1/1900)
 */
export function isUnscheduled1900(dateStr?: string | null): boolean {
  if (!dateStr) return true;
  const trimmed = dateStr.trim();
  if (!trimmed) return true;
  if (trimmed.includes('1900')) return true;
  if (trimmed === '1/1/1900' || trimmed === '01/01/1900' || trimmed === '1900-01-01') return true;
  return false;
}

/**
 * Parse a raw date string into a Date object at 00:00:00 local time
 */
export function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr || isUnscheduled1900(dateStr)) {
    return null;
  }

  const trimmed = dateStr.trim();
  
  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const parts = trimmed.split(/[-T ]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (year === 1900) return null;
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Format: M/D/YYYY or D/M/YYYY or DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
    const parts = trimmed.split(/[\/ ]/);
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (year === 1900) return null;

    // Default to M/D/YYYY (standard in this Google Sheets export)
    // If p1 > 12 and p2 <= 12, then p1 is day and p2 is month (DD/MM/YYYY)
    let month = p1 - 1;
    let day = p2;
    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    }

    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Fallback native parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    if (parsed.getFullYear() === 1900) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }

  return null;
}

/**
 * Get midnight Date for reference (defaults to current system date)
 */
export function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Format a Date to Indonesian localized string (e.g. "28 Agu 2026")
 */
export function formatIndonesianDate(date: Date | null, rawFallback?: string): string {
  if (!date) {
    if (rawFallback && !isUnscheduled1900(rawFallback)) {
      return rawFallback;
    }
    return 'Belum Dijadwalkan';
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();

  return `${d} ${m} ${y}`;
}

/**
 * Format a Date to full Indonesian localized string (e.g. "Jumat, 28 Agustus 2026")
 */
export function formatIndonesianDateFull(date: Date | null, rawFallback?: string): string {
  if (!date) {
    if (rawFallback && !isUnscheduled1900(rawFallback)) {
      return rawFallback;
    }
    return 'Belum Dijadwalkan';
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();

  return `${dayName}, ${d} ${m} ${y}`;
}

/**
 * Format Year & Month to Indonesian string (e.g. "Agustus 2026")
 */
export function formatMonthYearIndonesian(year: number, monthIndex: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[monthIndex]} ${year}`;
}

/**
 * Format Year & Month to Short Indonesian string (e.g. "Agu 2026")
 */
export function formatMonthYearShort(year: number, monthIndex: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return `${months[monthIndex]} ${year}`;
}

/**
 * Get Month key in YYYY-MM format from a Date or null
 */
export function getTransactionMonthKey(date: Date | null): string {
  if (!date) return 'NO_DATE';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Calculate difference in days between target date and today
 * Returns null if target is null (unscheduled)
 */
export function getDaysDiff(targetDate: Date | null, refDate = getTodayMidnight()): number | null {
  if (!targetDate) return null;
  const diffTime = targetDate.getTime() - refDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Compute Delivery Status based on JADWAL_INSTALASI
 */
export function calculateDeliveryStatus(
  installDate: Date | null, 
  rawInstallDate?: string,
  refDate = getTodayMidnight()
): {
  status: DeliveryStatus;
  statusLabel: string;
  isUrgentTomorrow: boolean;
  isToday: boolean;
  daysUntilInstall: number | null;
} {
  // Case 1: 1/1/1900 or empty or null
  if (!installDate || isUnscheduled1900(rawInstallDate)) {
    return {
      status: 'WAITING_SCHEDULE',
      statusLabel: 'Menunggu Jadwal Instalasi',
      isUrgentTomorrow: false,
      isToday: false,
      daysUntilInstall: null,
    };
  }

  const daysDiff = getDaysDiff(installDate, refDate)!;

  // Case 2: In the future or today
  if (daysDiff >= 0) {
    const isUrgentTomorrow = daysDiff === 1;
    const isToday = daysDiff === 0;
    
    let label = 'Dalam Proses Pengiriman';
    if (isToday) label = 'Instalasi Hari Ini';
    else if (isUrgentTomorrow) label = 'Instalasi Besok (H-1)';
    else label = `Dalam Pengiriman (H-${daysDiff})`;

    return {
      status: 'IN_TRANSIT',
      statusLabel: label,
      isUrgentTomorrow,
      isToday,
      daysUntilInstall: daysDiff,
    };
  }

  // Case 3: In the past -> Completed
  return {
    status: 'COMPLETED',
    statusLabel: 'Selesai / Terinstalasi',
    isUrgentTomorrow: false,
    isToday: false,
    daysUntilInstall: daysDiff,
  };
}

/**
 * Calculate visual progress step and percent (0-100)
 */
export function calculateProgress(
  status: DeliveryStatus,
  transDate: Date | null,
  deliveryDate: Date | null,
  installDate: Date | null,
  refDate = getTodayMidnight()
): { step: ProgressStep; percent: number } {
  if (status === 'WAITING_SCHEDULE') {
    return { step: 'PREPARING', percent: 20 };
  }

  if (status === 'COMPLETED') {
    return { step: 'INSTALLED', percent: 100 };
  }

  // If status is IN_TRANSIT
  if (!installDate) {
    return { step: 'PREPARING', percent: 25 };
  }

  const daysToInstall = getDaysDiff(installDate, refDate) ?? 0;
  const daysToDelivery = deliveryDate ? (getDaysDiff(deliveryDate, refDate) ?? 0) : daysToInstall;

  if (daysToInstall <= 0) {
    // Today is install day!
    return { step: 'ARRIVED', percent: 85 };
  }

  if (daysToInstall === 1) {
    // H-1
    return { step: 'ON_DELIVERY', percent: 70 };
  }

  if (daysToDelivery <= 0) {
    // Delivery has started
    return { step: 'ON_DELIVERY', percent: 55 };
  }

  // Still preparing in warehouse ALSUT
  if (daysToDelivery <= 2) {
    return { step: 'PREPARING', percent: 35 };
  }

  return { step: 'ORDER_RECEIVED', percent: 15 };
}
