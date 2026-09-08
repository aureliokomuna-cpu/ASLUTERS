export interface AreaGrowthStat {
  cityName: string;
  currentCount: number;
  prevCount: number;
  diff: number;
  growthPct: number; // e.g. +15.5 or -12.3
  status: 'GROWTH' | 'DECLINE' | 'STABLE';
  lat: number;
  lng: number;
  recommendation: string;
}

export interface MonthlyComparison {
  currentMonth: string; // '2026-08'
  currentMonthLabel: string; // 'Agustus 2026'
  prevMonth: string; // '2026-07'
  prevMonthLabel: string; // 'Juli 2026'
  totalCurrent: number;
  totalPrev: number;
  totalDiff: number;
  totalGrowthPct: number;
  areaStats: AreaGrowthStat[];
  growingAreas: AreaGrowthStat[];
  decliningAreas: AreaGrowthStat[]; // Area yang perlu di-improve
}

// Koordinat Centroid Kota/Wilayah Distribusi DO Informa Living World Alam Sutera
export const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Tangerang': { lat: -6.1783, lng: 106.6319 },
  'Tangerang Selatan': { lat: -6.2886, lng: 106.7179 },
  'Kab. Tangerang': { lat: -6.1950, lng: 106.5200 },
  'Jakarta Barat': { lat: -6.1683, lng: 106.7589 },
  'Jakarta Selatan': { lat: -6.2615, lng: 106.8106 },
  'Jakarta Utara': { lat: -6.1384, lng: 106.8640 },
  'Jakarta Pusat': { lat: -6.1805, lng: 106.8284 },
  'Jakarta Timur': { lat: -6.2250, lng: 106.9004 },
  'DKI Jakarta': { lat: -6.2088, lng: 106.8456 },
  'Depok': { lat: -6.4025, lng: 106.7942 },
  'Bogor': { lat: -6.5971, lng: 106.8060 },
  'Bekasi': { lat: -6.2383, lng: 106.9756 },
  'Serang': { lat: -6.1104, lng: 106.1640 },
  'Bandung': { lat: -6.9175, lng: 107.6191 },
  'Wilayah Lain': { lat: -6.2238, lng: 106.6525 },
};

export function cleanCityName(raw: string | undefined): string {
  if (!raw) return 'Tangerang';
  const l = raw.toLowerCase().trim();
  if (l.includes('tangerang selatan') || l.includes('tangsel') || l.includes('living world') || l.includes('alam sutera') || l.includes('serpong')) {
    return 'Tangerang Selatan';
  }
  if (l.includes('kab') && l.includes('tangerang')) {
    return 'Kab. Tangerang';
  }
  if (l.includes('tangerang')) {
    return 'Tangerang';
  }
  if (l.includes('jakarta barat') || l.includes('jakbar')) {
    return 'Jakarta Barat';
  }
  if (l.includes('jakarta selatan') || l.includes('jaksel')) {
    return 'Jakarta Selatan';
  }
  if (l.includes('jakarta utara') || l.includes('jakut')) {
    return 'Jakarta Utara';
  }
  if (l.includes('jakarta pusat') || l.includes('jakpus')) {
    return 'Jakarta Pusat';
  }
  if (l.includes('jakarta timur') || l.includes('jaktim')) {
    return 'Jakarta Timur';
  }
  if (l.includes('jakarta')) {
    return 'DKI Jakarta';
  }
  if (l.includes('depok')) {
    return 'Depok';
  }
  if (l.includes('bogor')) {
    return 'Bogor';
  }
  if (l.includes('bekasi')) {
    return 'Bekasi';
  }
  if (l.includes('serang') || l.includes('cilegon')) {
    return 'Serang';
  }
  if (l.includes('bandung')) {
    return 'Bandung';
  }

  // Format cleanly (capitalize first letter)
  const cleaned = raw.replace(/^(kota\.|kab\.)\s*/i, '').trim();
  if (!cleaned) return 'Tangerang';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'ALL') return 'Semua Periode';
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}

export function getPreviousMonthKey(monthKey: string, availableMonths: string[]): string | null {
  if (!monthKey || monthKey === 'ALL') return null;
  const sorted = [...availableMonths].sort();
  const currentIndex = sorted.indexOf(monthKey);
  if (currentIndex > 0) {
    return sorted[currentIndex - 1];
  }
  return null;
}

export function getRecommendationForArea(cityName: string, status: 'GROWTH' | 'DECLINE' | 'STABLE', growthPct: number): string {
  if (status === 'DECLINE') {
    if (cityName.includes('Tangerang') || cityName.includes('Selatan')) {
      return `Penurunan DO ${Math.abs(growthPct).toFixed(1)}% di ring 1 ALSUT. Perlu intensifikasi follow up database cluster perumahan setempat & sounding promo Informa Living World!`;
    }
    if (cityName.includes('Jakarta')) {
      return `Penurunan DO ${Math.abs(growthPct).toFixed(1)}%. Perlu edukasi kemudahan free ongkir Informa ALSUT & tawarkan katalog online furniture terbaru.`;
    }
    return `Penurunan DO ${Math.abs(growthPct).toFixed(1)}%. Rekomendasi Sales: Tingkatkan kontak customer repeat order & sounding promo cashback.`;
  }
  if (status === 'GROWTH') {
    return `Pertumbuhan solid +${growthPct.toFixed(1)}%! Rekomendasi Sales: Pertahankan kepuasan customer, ajak gabung Informa Rewards & tawarkan aksesoris komplementer.`;
  }
  return `Performa stabil (fluktuasi ${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%). Rekomendasi Sales: Jaga hubungan baik & reminder berkala.`;
}

export function calculateMonthlyComparison(
  items: Array<{ transactionDateRaw?: string; transactionDate?: Date | null; cityName?: string }>,
  currentMonthKey: string,
  baselineMonthKey?: string
): MonthlyComparison | null {
  if (!items || items.length === 0) return null;

  // Extract month keys from items
  const monthSet = new Set<string>();
  const monthCityCounts: Record<string, Record<string, number>> = {};

  items.forEach((item) => {
    let mKey = '';
    if (item.transactionDate) {
      const y = item.transactionDate.getFullYear();
      const m = String(item.transactionDate.getMonth() + 1).padStart(2, '0');
      mKey = `${y}-${m}`;
    } else if (item.transactionDateRaw) {
      const match = item.transactionDateRaw.match(/202\d[-/]\d{2}/);
      if (match) {
        mKey = match[0].replace('/', '-');
      }
    }

    if (mKey) {
      monthSet.add(mKey);
      if (!monthCityCounts[mKey]) monthCityCounts[mKey] = {};
      const city = cleanCityName(item.cityName);
      monthCityCounts[mKey][city] = (monthCityCounts[mKey][city] || 0) + 1;
    }
  });

  const sortedMonths = Array.from(monthSet).sort();
  if (sortedMonths.length === 0) return null;

  // Target month
  let targetMonth = currentMonthKey;
  if (!targetMonth || targetMonth === 'ALL' || !sortedMonths.includes(targetMonth)) {
    // Default to the latest month with substantial data (e.g. August 2026 or July 2026)
    targetMonth = sortedMonths[sortedMonths.length - 1];
    // If the latest month is partial (e.g. September with few days), if there is a previous full month, consider it
    if (sortedMonths.length >= 2) {
      const latestCount = Object.values(monthCityCounts[targetMonth] || {}).reduce((a, b) => a + b, 0);
      const prev = sortedMonths[sortedMonths.length - 2];
      const prevCount = Object.values(monthCityCounts[prev] || {}).reduce((a, b) => a + b, 0);
      if (latestCount < 500 && prevCount > 1000) {
        // Target previous month as default comparison target so data is robust
        targetMonth = prev;
      }
    }
  }

  // Previous month
  let prevMonth = baselineMonthKey;
  if (!prevMonth || !sortedMonths.includes(prevMonth)) {
    const targetIdx = sortedMonths.indexOf(targetMonth);
    if (targetIdx > 0) {
      prevMonth = sortedMonths[targetIdx - 1];
    } else if (sortedMonths.length > 1) {
      prevMonth = sortedMonths[1];
    } else {
      prevMonth = targetMonth;
    }
  }

  const currentCounts = monthCityCounts[targetMonth] || {};
  const prevCounts = monthCityCounts[prevMonth] || {};

  const allCities = Array.from(new Set([...Object.keys(currentCounts), ...Object.keys(prevCounts)]));

  let totalCurrent = 0;
  let totalPrev = 0;

  const areaStats: AreaGrowthStat[] = allCities.map((cityName) => {
    const curr = currentCounts[cityName] || 0;
    const prev = prevCounts[cityName] || 0;
    totalCurrent += curr;
    totalPrev += prev;

    const diff = curr - prev;
    let growthPct = 0;
    if (prev > 0) {
      growthPct = ((curr - prev) / prev) * 100;
    } else if (curr > 0) {
      growthPct = 100;
    }

    let status: 'GROWTH' | 'DECLINE' | 'STABLE' = 'STABLE';
    if (growthPct > 2) status = 'GROWTH';
    else if (growthPct < -2) status = 'DECLINE';

    // Get centroid
    const centroid = CITY_CENTROIDS[cityName] || CITY_CENTROIDS['Wilayah Lain'];

    return {
      cityName,
      currentCount: curr,
      prevCount: prev,
      diff,
      growthPct: Math.round(growthPct * 10) / 10,
      status,
      lat: centroid.lat,
      lng: centroid.lng,
      recommendation: getRecommendationForArea(cityName, status, growthPct),
    };
  });

  // Sort area stats by volume current
  areaStats.sort((a, b) => b.currentCount - a.currentCount);

  const totalDiff = totalCurrent - totalPrev;
  const totalGrowthPct = totalPrev > 0 ? Math.round(((totalDiff / totalPrev) * 100) * 10) / 10 : 0;

  const growingAreas = areaStats.filter((a) => a.status === 'GROWTH').sort((a, b) => b.growthPct - a.growthPct);
  const decliningAreas = areaStats.filter((a) => a.status === 'DECLINE').sort((a, b) => a.growthPct - b.growthPct); // Most negative first

  return {
    currentMonth: targetMonth,
    currentMonthLabel: formatMonthLabel(targetMonth),
    prevMonth,
    prevMonthLabel: formatMonthLabel(prevMonth),
    totalCurrent,
    totalPrev,
    totalDiff,
    totalGrowthPct,
    areaStats,
    growingAreas,
    decliningAreas,
  };
}
