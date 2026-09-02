import { CorridorTrafficInfo, JabodetabekTrafficSummary, TrafficStatusLevel } from '../types/traffic';

/**
 * Generates dynamic daily traffic status for Jabodetabek, focusing on Tangerang & Tangerang Selatan
 */
export function getDailyTrafficReport(customDate: Date = new Date()): JabodetabekTrafficSummary {
  const hour = customDate.getHours();
  const minutes = customDate.getMinutes();
  const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} WIB`;

  let peakHourStatus: 'MORNING_PEAK' | 'MIDDAY_NORMAL' | 'EVENING_PEAK' | 'NIGHT_SMOOTH' = 'MIDDAY_NORMAL';
  let peakHourLabel = 'Siang Hari - Arus Relatif Terkendali';

  if (hour >= 6 && hour < 10) {
    peakHourStatus = 'MORNING_PEAK';
    peakHourLabel = 'Jam Sibuk Pagi (06:00 - 10:00 WIB) - Arus Padat Menuju Jakarta & Kawasan Bisnis';
  } else if (hour >= 16 && hour < 20) {
    peakHourStatus = 'EVENING_PEAK';
    peakHourLabel = 'Jam Sibuk Sore/Malam (16:00 - 20:00 WIB) - Arus Pulang Padat Tangerang & Tangsel';
  } else if (hour >= 20 || hour < 6) {
    peakHourStatus = 'NIGHT_SMOOTH';
    peakHourLabel = 'Malam / Dini Hari - Arus Bebas Hambatan';
  }

  // Determine corridor statuses based on time of day
  const corridors: CorridorTrafficInfo[] = [
    // 1. TANGERANG SELATAN (TANGSEL) - Core Hub & Surrounding
    {
      id: 'alsut-blvd',
      name: 'Jl. Jalur Sutera & Bundaran Living World ALSUT',
      area: 'TANGSEL',
      areaLabel: 'Tangerang Selatan',
      status: peakHourStatus === 'EVENING_PEAK' ? 'YELLOW' : 'GREEN',
      speedKmh: peakHourStatus === 'EVENING_PEAK' ? 25 : 45,
      condition: peakHourStatus === 'EVENING_PEAK' ? 'Ramai Padat di Persimpangan Mall & Tol' : 'Lancar & Terkendali',
      notes: 'Akses utama armada keluar-masuk Store Informa Living World.',
      peakHourImpact: 'MEDIUM',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'serpong-bsd',
      name: 'Jl. Raya Serpong - BSD Grand Boulevard - AEON Mall',
      area: 'TANGSEL',
      areaLabel: 'Tangerang Selatan',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'YELLOW' : 'GREEN',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 22 : 40,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Padat Merayap di Lampu Merah Gading Serpong & WTC' : 'Lancar Mengalir',
      notes: 'Lampu merah simpang Serpong & Gading Serpong aktif padat jam sibuk.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'bintaro-ciledug',
      name: 'Koridor Bintaro Sektor 7-9 & Jl. Ciledug Raya',
      area: 'TANGSEL',
      areaLabel: 'Tangerang Selatan',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'RED' : 'YELLOW',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 14 : 28,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Macet Tersendat di Simpang Pasar Cipadu & Flyover' : 'Padat Mengalir',
      notes: 'Area padat pemukiman, disarankan armada antisipasi durasi pengiriman tambahan 15-20 menit.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'ciputat-pamulang',
      name: 'Jl. Ir. H. Juanda (Ciputat) - Pamulang - Gaplek',
      area: 'TANGSEL',
      areaLabel: 'Tangerang Selatan',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'RED' : 'YELLOW',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 16 : 30,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Kepadatan Tinggi di Flyover Ciputat & U-Turn' : 'Merayap Terkendali',
      notes: 'Banyak titik putar balik (U-turn) dan persimpangan tanpa lampu lalu lintas.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },

    // 2. TANGERANG KOTA
    {
      id: 'mh-thamrin-nanas',
      name: 'Jl. MH Thamrin - Kebon Nanas - Cikokol',
      area: 'TANGERANG_KOTA',
      areaLabel: 'Tangerang Kota',
      status: peakHourStatus === 'EVENING_PEAK' ? 'YELLOW' : 'GREEN',
      speedKmh: peakHourStatus === 'EVENING_PEAK' ? 24 : 42,
      condition: peakHourStatus === 'EVENING_PEAK' ? 'Padat Menjelang Simpang Cikokol & Tangcity' : 'Lancar Terkendali',
      notes: 'Jalur penghubung utama Living World ALSUT menuju Kota Tangerang.',
      peakHourImpact: 'MEDIUM',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'daan-mogot-batuceper',
      name: 'Jl. Daan Mogot - Batuceper - Kalideres',
      area: 'TANGERANG_KOTA',
      areaLabel: 'Tangerang Kota',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'RED' : 'YELLOW',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 15 : 32,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Tersendat di Perlintasan Rel & Halte Busway' : 'Ramai Teratur',
      notes: 'Jalur perbatasan Jakarta Barat - Tangerang Kota, antisipasi traffic truk kontainer.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'cipondoh-kh-hasyim',
      name: 'Jl. KH Hasyim Ashari - Cipondoh - Poris',
      area: 'TANGERANG_KOTA',
      areaLabel: 'Tangerang Kota',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'YELLOW' : 'GREEN',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 20 : 38,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Merayap di Sekitar Pasar Sipon & Danau Cipondoh' : 'Lancar Mengalir',
      notes: 'Jalur alternatif pengantaran customer area perumahan Cipondoh & Poris.',
      peakHourImpact: 'MEDIUM',
      lastUpdatedTime: timeStr,
    },

    // 3. AKSES TOL UTAMA ALSUT
    {
      id: 'tol-jkt-tgr',
      name: 'Tol Jakarta - Tangerang (Gerbang Tol Kunciran / Alam Sutera)',
      area: 'TOL_ALSUT',
      areaLabel: 'Tol Akses ALSUT',
      status: peakHourStatus === 'MORNING_PEAK' ? 'YELLOW' : (peakHourStatus === 'EVENING_PEAK' ? 'RED' : 'GREEN'),
      speedKmh: peakHourStatus === 'EVENING_PEAK' ? 28 : (peakHourStatus === 'MORNING_PEAK' ? 35 : 75),
      condition: peakHourStatus === 'EVENING_PEAK' ? 'Antrean Keluar Exit Alam Sutera & Karang Tengah' : (peakHourStatus === 'MORNING_PEAK' ? 'Padat Arah Tomang / Kebon Jeruk' : 'Lancar Kecepatan Penuh'),
      notes: 'Urat nadi pengiriman logistik & sales visit antar wilayah.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'tol-jorr2-kunciran-serpong',
      name: 'Tol JORR 2 (Kunciran - Serpong - Pamulang - Cinere)',
      area: 'TOL_ALSUT',
      areaLabel: 'Tol Akses ALSUT',
      status: 'GREEN',
      speedKmh: 80,
      condition: 'Sangat Lancar & Bebas Hambatan',
      notes: 'Rute tercepat & paling direkomendasikan untuk pengiriman ke Pamulang, BSD, & Depok.',
      peakHourImpact: 'LOW',
      lastUpdatedTime: timeStr,
    },

    // 4. JABODETABEK LINTAS WILAYAH
    {
      id: 'tol-jorr-w2-puri',
      name: 'Tol JORR W2 (Kembangan - Puri Indah - Ulujami)',
      area: 'JABODETABEK',
      areaLabel: 'Jabodetabek Lintas',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'YELLOW' : 'GREEN',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 30 : 65,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Padat Antrean Simpang Susun Tomang & Puri' : 'Lancar Terkendali',
      notes: 'Akses logistik customer wilayah Jakarta Barat & Jakarta Selatan.',
      peakHourImpact: 'MEDIUM',
      lastUpdatedTime: timeStr,
    },
    {
      id: 'tol-dalkot-tomang-cawang',
      name: 'Tol Dalam Kota (Tomang - Semanggi - Cawang)',
      area: 'JABODETABEK',
      areaLabel: 'Jabodetabek Lintas',
      status: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'RED' : 'YELLOW',
      speedKmh: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 18 : 45,
      condition: (peakHourStatus === 'MORNING_PEAK' || peakHourStatus === 'EVENING_PEAK') ? 'Macet Padat Merayap di Simpang Semanggi & Kuningan' : 'Ramai Mengalir',
      notes: 'Antisipasi waktu tempuh bila armada melayani pengiriman area Central Jakarta.',
      peakHourImpact: 'HIGH',
      lastUpdatedTime: timeStr,
    },
  ];

  // Calculate overall status
  const redCount = corridors.filter(c => c.status === 'RED').length;
  const yellowCount = corridors.filter(c => c.status === 'YELLOW').length;

  let overallStatus: TrafficStatusLevel = 'GREEN';
  let statusTitle = '🟢 LALU LINTAS JABODETABEK & TANGERANG RAYA LANCAR';
  let statusSubtitle = 'Arus lalu lintas jalur arteri & tol di sekitar Living World Alam Sutera terpantau lancar tanpa hambatan berarti.';

  if (redCount >= 3 || (redCount >= 2 && yellowCount >= 3)) {
    overallStatus = 'RED';
    statusTitle = '🔴 PERINGATAN KEPADATAN TINGGI (TRAFFIC LIGHT MERAH)';
    statusSubtitle = 'Terjadi titik kemacetan signifikan di beberapa koridor Tangsel (Ciledug, Ciputat) & Daan Mogot. Mohon beri info estimasi ke customer.';
  } else if (redCount > 0 || yellowCount >= 3) {
    overallStatus = 'YELLOW';
    statusTitle = '🟡 LALU LINTAS PADAT MERAYAP DI JAM SIBUK';
    statusSubtitle = 'Arus kendaraan padat di persimpangan lampu merah utama Serpong, Cikokol, & Exit Tol ALSUT. Kecepatan rata-rata 20-35 km/jam.';
  }

  return {
    overallStatus,
    statusTitle,
    statusSubtitle,
    peakHourStatus,
    peakHourLabel,
    weatherCondition: 'Cerah Berawan (Suhu 29-33°C)',
    weatherImpact: 'Kondisi jalan kering & aman untuk pengiriman furnitur / instalasi.',
    corridors,
  };
}
