import { CITY_MONTH_COUNTS_2025 } from '../data/baseline2025';

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

export type GrowthComparisonMode = 
  | 'YOY_JAN_AUG'      // Jan - Agu 2025 vs Jan - Agu 2026 (Rekomendasi Utama)
  | 'YOY_MAY_AUG'      // Mei - Agu 2025 vs Mei - Agu 2026 (Periode Penuh Berjalan)
  | 'YOY_JAN_SEP'      // Jan - Sep 2025 vs Jan - Sep 2026 (YTD Kumulatif)
  | 'YOY_MONTH'        // Bulan Spesifik YoY (e.g. Agustus 2025 vs 2026)
  | 'MOM_MONTH';       // Bulan ke Bulan MoM (e.g. Agustus 2026 vs Juli 2026)

export interface MonthlyComparison {
  mode: GrowthComparisonMode;
  currentMonth: string; // for backward compatibility
  currentMonthLabel: string; // e.g. 'Jan - Agu 2026' or 'Agustus 2026'
  prevMonth: string;
  prevMonthLabel: string; // e.g. 'Jan - Agu 2025' or 'Juli 2026'
  totalCurrent: number;
  totalPrev: number;
  totalDiff: number;
  totalGrowthPct: number;
  areaStats: AreaGrowthStat[];
  growingAreas: AreaGrowthStat[];
  decliningAreas: AreaGrowthStat[];
  periodBadge: string;
  noticeText?: string;
  isSeptemberIncluded?: boolean;
}

// Centroid Koordinat Kota/Wilayah Distribusi DO Informa Living World Alam Sutera
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
  'Karawang': { lat: -6.3051, lng: 107.3025 },
  'Lebak': { lat: -6.5500, lng: 106.2500 },
  'Pandeglang': { lat: -6.3084, lng: 106.1064 },
  'Cianjur': { lat: -6.8222, lng: 107.1394 },
  'Sukabumi kota': { lat: -6.9277, lng: 106.9299 },
  'Surabaya': { lat: -7.2575, lng: 112.7521 },
  'Semarang kota': { lat: -6.9667, lng: 110.4167 },
  'Denpasar': { lat: -8.6705, lng: 115.2126 },
  'Badung': { lat: -8.5833, lng: 115.1833 },
  'Banyumas': { lat: -7.5144, lng: 109.2941 },
  'Manado': { lat: 1.4748, lng: 124.8428 },
  'Bandar Lampung': { lat: -5.4297, lng: 105.2625 },
  'Wilayah Lain': { lat: -6.2238, lng: 106.6525 },
};

/**
 * Standardize and clean city names based on raw city column and optional address hints
 */
export function cleanCityName(raw?: string, address?: string): string {
  const combined = ((raw || '') + ' ' + (address || '')).toLowerCase().trim();
  if (!combined) return 'Tangerang';

  // 1. Tangerang Selatan (Ring 1 Alam Sutera & BSD)
  if (
    combined.includes('tangerang selatan') || 
    combined.includes('tangsel') || 
    combined.includes('living world') || 
    combined.includes('alam sutera') || 
    combined.includes('serpong') ||
    combined.includes('bsd') ||
    combined.includes('bintaro') ||
    combined.includes('ciputat') ||
    combined.includes('pamulang') ||
    combined.includes('pondok aren') ||
    combined.includes('setu')
  ) {
    return 'Tangerang Selatan';
  }

  // 2. Kab. Tangerang
  if (
    (combined.includes('kab') && combined.includes('tangerang')) ||
    combined.includes('kelapa dua') ||
    combined.includes('curug') ||
    combined.includes('cikupa') ||
    combined.includes('balaraja') ||
    combined.includes('pasar kemis') ||
    combined.includes('legok') ||
    combined.includes('pagedangan') ||
    combined.includes('teluknaga') ||
    combined.includes('kosambi')
  ) {
    return 'Kab. Tangerang';
  }

  // 3. Tangerang Kota
  if (
    combined.includes('tangerang') ||
    combined.includes('tanggerang') ||
    combined.includes('cipondoh') ||
    combined.includes('karawaci') ||
    combined.includes('ciledug') ||
    combined.includes('pinang') ||
    combined.includes('batuceper') ||
    combined.includes('periuk') ||
    combined.includes('jatiuwung') ||
    combined.includes('larangan') ||
    combined.includes('karang tengah')
  ) {
    return 'Tangerang';
  }

  // 4. DKI Jakarta Sub-areas
  if (combined.includes('jakarta barat') || combined.includes('jakbar') || combined.includes('kebon jeruk') || combined.includes('puri') || combined.includes('cengkareng') || combined.includes('kembangan') || combined.includes('palmerah') || combined.includes('grogol') || combined.includes('kalideres')) {
    return 'Jakarta Barat';
  }
  if (combined.includes('jakarta selatan') || combined.includes('jaksel') || combined.includes('pondok indah') || combined.includes('kebayoran') || combined.includes('cilandak') || combined.includes('pesanggrahan') || combined.includes('tebet')) {
    return 'Jakarta Selatan';
  }
  if (combined.includes('jakarta utara') || combined.includes('jakut') || combined.includes('pik') || combined.includes('pantai indah kapuk') || combined.includes('pluit') || combined.includes('kelapa gading') || combined.includes('sunter') || combined.includes('penjaringan')) {
    return 'Jakarta Utara';
  }
  if (combined.includes('jakarta pusat') || combined.includes('jakpus') || combined.includes('menteng') || combined.includes('tanah abang') || combined.includes('senayan') || combined.includes('gambir')) {
    return 'Jakarta Pusat';
  }
  if (combined.includes('jakarta timur') || combined.includes('jaktim') || combined.includes('duren sawit') || combined.includes('rawamangun') || combined.includes('cakung')) {
    return 'Jakarta Timur';
  }
  if (combined.includes('jakarta')) {
    return 'Jakarta Barat'; // Default Jakbar as closest Jakarta area to Alam Sutera
  }

  // 5. Bodetabek & Banten
  if (combined.includes('depok') || combined.includes('cinere') || combined.includes('sawangan')) return 'Depok';
  if (combined.includes('bogor') || combined.includes('sentul') || combined.includes('cibinong')) return 'Bogor';
  if (combined.includes('bekasi') || combined.includes('cikarang')) return 'Bekasi';
  if (combined.includes('serang') || combined.includes('cilegon')) return 'Serang';
  if (combined.includes('lebak') || combined.includes('rangkasbitung')) return 'Lebak';
  if (combined.includes('pandeglang')) return 'Pandeglang';
  if (combined.includes('karawang')) return 'Karawang';
  if (combined.includes('bandung')) return 'Bandung';
  if (combined.includes('cianjur')) return 'Cianjur';
  if (combined.includes('sukabumi')) return 'Sukabumi kota';
  if (combined.includes('surabaya')) return 'Surabaya';
  if (combined.includes('denpasar')) return 'Denpasar';
  if (combined.includes('badung')) return 'Badung';

  // Clean raw city name
  const rawCity = (raw || '').replace(/^(kota\.|kab\.)\s*/i, '').trim();
  if (!rawCity || rawCity === '57' || rawCity.length < 2) return 'Tangerang';
  return rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
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

export function getRecommendationForArea(cityName: string, status: 'GROWTH' | 'DECLINE' | 'STABLE', growthPct: number): string {
  if (status === 'DECLINE') {
    if (cityName === 'Tangerang Selatan' || cityName === 'Tangerang' || cityName === 'Kab. Tangerang') {
      return `Penurunan DO (${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%) di Ring 1 ALSUT. Perlu evaluasi door-to-door cluster baru BSD/Bintaro/Gading Serpong & aktifkan promo khusus Free Ongkir Living World!`;
    }
    if (cityName.includes('Jakarta')) {
      return `Penurunan DO (${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%). Reaktivasi customer loyal via WhatsApp Blast Informa Mobile App & sounding katalog promo Living World.`;
    }
    return `Penurunan volume DO (${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%). Rekomendasi Sales: Follow up database customer repeat order furnitur dan tawarkan gift voucher Informa.`;
  }
  if (status === 'GROWTH') {
    return `Pertumbuhan solid +${growthPct.toFixed(1)}%! Rekomendasi Sales: Pertahankan kepuasan customer, ajak gabung Informa Rewards & tawarkan aksesoris/home decor komplementer.`;
  }
  return `Performa stabil (${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%). Rekomendasi Sales: Jaga hubungan baik pelanggan & reminder berkala service garansi instalasi.`;
}

/**
 * Calculate accurate Year-over-Year (2025 vs 2026) or MoM Growth per Kota
 */
export function calculateGrowthComparison(
  items: Array<{ transactionDateRaw?: string; transactionDate?: Date | null; cityName?: string; address?: string; datasetYear?: 2025 | 2026 }>,
  mode: GrowthComparisonMode = 'YOY_JAN_AUG',
  specificMonth: number = 8, // Default to August for specific month YoY
  liveStats2025?: Record<string, Record<number, number>>
): MonthlyComparison | null {
  // Aggregate 2026 data and 2025 data (if present in items) per city and per month
  const stats2026: Record<string, Record<number, number>> = {};
  const extractedStats2025: Record<string, Record<number, number>> = {};

  items.forEach((item) => {
    let m = 0;
    let y = item.datasetYear || 0;

    if (item.transactionDate) {
      y = y || item.transactionDate.getFullYear();
      m = item.transactionDate.getMonth() + 1;
    } else if (item.transactionDateRaw) {
      const match = item.transactionDateRaw.match(/(202\d)[-/.](\d{1,2})/);
      if (match) {
        y = y || parseInt(match[1], 10);
        m = parseInt(match[2], 10);
      }
    }

    const city = cleanCityName(item.cityName, item.address);

    if (y === 2026 && m >= 1 && m <= 12) {
      if (!stats2026[city]) stats2026[city] = {};
      stats2026[city][m] = (stats2026[city][m] || 0) + 1;
    } else if (y === 2025 && m >= 1 && m <= 12) {
      if (!extractedStats2025[city]) extractedStats2025[city] = {};
      extractedStats2025[city][m] = (extractedStats2025[city][m] || 0) + 1;
    }
  });

  // Prioritize live 2025 stats from API/items, then fallback to CITY_MONTH_COUNTS_2025
  const hasExtracted2025 = Object.keys(extractedStats2025).length > 0;
  const stats2025 = liveStats2025 || (hasExtracted2025 ? extractedStats2025 : CITY_MONTH_COUNTS_2025);

  let currentLabel = '';
  let prevLabel = '';
  let periodBadge = '';
  let noticeText = '';
  let isSeptemberIncluded = false;

  const currentCityCounts: Record<string, number> = {};
  const prevCityCounts: Record<string, number> = {};

  if (mode === 'YOY_MAY_AUG') {
    // Mode Khusus: Mei - Agustus 2025 vs 2026 (4 Bulan Penuh Transaksi Aktif)
    currentLabel = 'Mei - Agustus 2026';
    prevLabel = 'Mei - Agustus 2025';
    periodBadge = 'YoY: Mei-Agu (4 Bln Penuh)';
    noticeText = 'Periode Mei-Agustus adalah 4 bulan penuh dengan pencatatan transaksi aktif di kedua tahun (2025 vs 2026).';
    isSeptemberIncluded = false;

    // Sum 5..8
    for (const city of Object.keys(stats2026)) {
      let sum = 0;
      for (let m = 5; m <= 8; m++) sum += (stats2026[city]?.[m] || 0);
      currentCityCounts[city] = sum;
    }
    for (const city of Object.keys(stats2025)) {
      let sum = 0;
      for (let m = 5; m <= 8; m++) sum += (stats2025[city]?.[m] || 0);
      prevCityCounts[city] = sum;
    }
  } else if (mode === 'YOY_JAN_AUG') {
    // Mode Utama: Januari - Agustus 2025 vs 2026
    currentLabel = 'Januari - Agustus 2026';
    prevLabel = 'Januari - Agustus 2025';
    periodBadge = 'YoY: Jan-Agu (Data Penuh)';
    noticeText = 'Periode Jan-Agu 2025 vs 2026 dipilih sebagai baseline utama agar data bersih dari anomali bulan September 2026 yang saat ini masih berjalan.';
    isSeptemberIncluded = false;

    // Sum 1..8
    for (const city of Object.keys(stats2026)) {
      let sum = 0;
      for (let m = 1; m <= 8; m++) sum += (stats2026[city]?.[m] || 0);
      currentCityCounts[city] = sum;
    }
    for (const city of Object.keys(stats2025)) {
      let sum = 0;
      for (let m = 1; m <= 8; m++) sum += (stats2025[city]?.[m] || 0);
      prevCityCounts[city] = sum;
    }
  } else if (mode === 'YOY_JAN_SEP') {
    // Mode YTD Kumulatif: Januari - September 2025 vs 2026
    currentLabel = 'Januari - September 2026';
    prevLabel = 'Januari - September 2025';
    periodBadge = 'YoY: Jan-Sep (YTD)';
    noticeText = 'Catatan: Data bulan September 2026 saat ini masih berjalan (cut-off transaksi tanggal 8/9 September), sehingga total transaksi September belum 1 bulan penuh.';
    isSeptemberIncluded = true;

    // Sum 1..9
    for (const city of Object.keys(stats2026)) {
      let sum = 0;
      for (let m = 1; m <= 9; m++) sum += (stats2026[city]?.[m] || 0);
      currentCityCounts[city] = sum;
    }
    for (const city of Object.keys(stats2025)) {
      let sum = 0;
      for (let m = 1; m <= 9; m++) sum += (stats2025[city]?.[m] || 0);
      prevCityCounts[city] = sum;
    }
  } else if (mode === 'YOY_MONTH') {
    // Mode YoY Bulan Spesifik (e.g. Agustus 2025 vs 2026)
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mName = monthNames[specificMonth - 1] || `Bulan ${specificMonth}`;
    currentLabel = `${mName} 2026`;
    prevLabel = `${mName} 2025`;
    periodBadge = `YoY: ${mName}`;
    if (specificMonth === 9) {
      noticeText = 'Catatan: Data transaksi September 2026 baru berjalan sebagian (cut-off 8 September 2026).';
      isSeptemberIncluded = true;
    }

    for (const city of Object.keys(stats2026)) {
      currentCityCounts[city] = stats2026[city]?.[specificMonth] || 0;
    }
    for (const city of Object.keys(stats2025)) {
      prevCityCounts[city] = stats2025[city]?.[specificMonth] || 0;
    }
  } else {
    // Mode MOM_MONTH: Agustus 2026 vs Juli 2026
    currentLabel = 'Agustus 2026';
    prevLabel = 'Juli 2026';
    periodBadge = 'MoM: Agu vs Jul 2026';
    noticeText = 'Perbandingan Month-over-Month (Bulan ke Bulan) tahun 2026.';

    for (const city of Object.keys(stats2026)) {
      currentCityCounts[city] = stats2026[city]?.[8] || 0;
      prevCityCounts[city] = stats2026[city]?.[7] || 0;
    }
  }

  // Combine all cities
  const allCities = Array.from(new Set([...Object.keys(currentCityCounts), ...Object.keys(prevCityCounts)]));

  let totalCurrent = 0;
  let totalPrev = 0;

  const areaStats: AreaGrowthStat[] = allCities
    .map((cityName) => {
      const curr = currentCityCounts[cityName] || 0;
      const prev = prevCityCounts[cityName] || 0;
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
      if (growthPct >= 1.0) status = 'GROWTH';
      else if (growthPct <= -1.0) status = 'DECLINE';

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
    })
    .filter((a) => a.currentCount > 0 || a.prevCount > 0);

  // Sort by highest volume currently
  areaStats.sort((a, b) => b.currentCount - a.currentCount);

  const totalDiff = totalCurrent - totalPrev;
  const totalGrowthPct = totalPrev > 0 ? Math.round(((totalDiff / totalPrev) * 100) * 10) / 10 : 0;

  const growingAreas = areaStats.filter((a) => a.status === 'GROWTH').sort((a, b) => b.growthPct - a.growthPct);
  const decliningAreas = areaStats.filter((a) => a.status === 'DECLINE').sort((a, b) => a.growthPct - b.growthPct);

  return {
    mode,
    currentMonth: currentLabel,
    currentMonthLabel: currentLabel,
    prevMonth: prevLabel,
    prevMonthLabel: prevLabel,
    totalCurrent,
    totalPrev,
    totalDiff,
    totalGrowthPct,
    areaStats,
    growingAreas,
    decliningAreas,
    periodBadge,
    noticeText,
    isSeptemberIncluded,
  };
}

/**
 * Backward compatibility wrapper for existing component calls
 */
export function calculateMonthlyComparison(
  items: Array<{ transactionDateRaw?: string; transactionDate?: Date | null; cityName?: string; address?: string }>,
  _targetMonthKey?: string,
  _baselineMonthKey?: string
): MonthlyComparison | null {
  return calculateGrowthComparison(items, 'YOY_JAN_AUG');
}
