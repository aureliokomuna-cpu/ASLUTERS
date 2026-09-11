import React, { useState, useMemo } from 'react';
import { 
  List, 
  Map as MapIcon, 
  Search, 
  Download, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Phone,
  MessageCircle,
  Building2,
  Users,
  MapPin,
  Filter,
  Calendar,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles
} from 'lucide-react';
import { DeliveryItem } from '../types';
import { CustomerMap } from './CustomerMap';
import { 
  formatIndonesianDate, 
  formatMonthYearIndonesian, 
  formatMonthYearShort, 
  getTransactionMonthKey 
} from '../utils/dateUtils';
import { 
  calculateGrowthComparison, 
  GrowthComparisonMode, 
  MonthlyComparison, 
  AreaGrowthStat 
} from '../utils/growthUtils';

interface CustomerDatabaseTabProps {
  items: DeliveryItem[];
  cities: string[];
  onViewDetail: (item: DeliveryItem) => void;
  selectedMapItem: DeliveryItem | null;
  onSelectMapItem: (item: DeliveryItem | null) => void;
}

interface MonthData {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  timestamp: number;
}

const ITEMS_PER_PAGE = 20;

export const CustomerDatabaseTab: React.FC<CustomerDatabaseTabProps> = ({
  items,
  cities,
  onViewDetail,
  selectedMapItem,
  onSelectMapItem
}) => {
  // Default view to COMBINED (Map + List) so the interactive OSM map is always visible right away
  const [viewMode, setViewMode] = useState<'COMBINED' | 'MAP' | 'LIST'>('COMBINED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL'); // 'ALL' or 'YYYY-MM' or 'NO_DATE'
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'COMPLETED' | 'IN_TRANSIT' | 'WAITING_SCHEDULE'>('ALL');
  const [sortBy, setSortBy] = useState<'TRANS_DATE_DESC' | 'TRANS_DATE_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'RECEIPT'>('TRANS_DATE_DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [growthMode, setGrowthMode] = useState<GrowthComparisonMode>('YOY_JAN_AUG');
  const [growthSpecificMonth, setGrowthSpecificMonth] = useState<number>(8);
  const [growthSearchCity, setGrowthSearchCity] = useState<string>('');
  const [isGrowthSectionExpanded, setIsGrowthSectionExpanded] = useState<boolean>(true);
  const [initialMapMode, setInitialMapMode] = useState<'DELIVERIES' | 'GROWTH'>('DELIVERIES');

  // Extract unique transaction months across all customer items
  const availableMonths = useMemo(() => {
    const map = new Map<string, MonthData>();
    
    items.forEach((item) => {
      if (item.transactionDate) {
        const y = item.transactionDate.getFullYear();
        const m = item.transactionDate.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, {
            key,
            label: formatMonthYearIndonesian(y, m),
            shortLabel: formatMonthYearShort(y, m),
            count: 1,
            timestamp: new Date(y, m, 1).getTime(),
          });
        }
      } else {
        const key = 'NO_DATE';
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, {
            key,
            label: 'Tanggal Belum Tercatat',
            shortLabel: 'Tanpa Tgl',
            count: 1,
            timestamp: 0,
          });
        }
      }
    });

    const result: MonthData[] = [];
    map.forEach((val) => {
      result.push(val);
    });
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [items]);

  // Filtered customer items based on Month, Status, City, and Search Query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    return items.filter((item) => {
      // 1. Month filter (Bulan Transaksi)
      if (selectedMonth !== 'ALL') {
        const itemMonthKey = getTransactionMonthKey(item.transactionDate);
        if (itemMonthKey !== selectedMonth) {
          return false;
        }
      }

      // 2. Status filter
      if (selectedStatus !== 'ALL') {
        if (item.status !== selectedStatus) {
          return false;
        }
      }

      // 3. City filter
      if (selectedCity !== 'ALL') {
        if (item.cityName.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // 4. Search query
      if (q) {
        const matches = 
          item.receiptNo.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.bestPhone.toLowerCase().includes(q) ||
          item.memberNo.toLowerCase().includes(q) ||
          (item.transactionDateRaw && item.transactionDateRaw.toLowerCase().includes(q)) ||
          (item.installScheduleRaw && item.installScheduleRaw.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'TRANS_DATE_DESC') {
        const timeA = a.transactionDate?.getTime() ?? 0;
        const timeB = b.transactionDate?.getTime() ?? 0;
        return timeB - timeA;
      }
      if (sortBy === 'TRANS_DATE_ASC') {
        const timeA = a.transactionDate?.getTime() ?? 0;
        const timeB = b.transactionDate?.getTime() ?? 0;
        return timeA - timeB;
      }
      if (sortBy === 'DATE_DESC') {
        const timeA = a.installScheduleDate?.getTime() ?? 0;
        const timeB = b.installScheduleDate?.getTime() ?? 0;
        return timeB - timeA;
      }
      if (sortBy === 'DATE_ASC') {
        const timeA = a.installScheduleDate?.getTime() ?? 0;
        const timeB = b.installScheduleDate?.getTime() ?? 0;
        return timeA - timeB;
      }
      if (sortBy === 'NAME_ASC') {
        return a.customerName.localeCompare(b.customerName);
      }
      if (sortBy === 'RECEIPT') {
        return a.receiptNo.localeCompare(b.receiptNo);
      }
      return 0;
    });
  }, [items, selectedMonth, selectedStatus, selectedCity, searchQuery, sortBy]);

  // Items for Map (filtered by month and status)
  const mapItems = useMemo(() => {
    return filteredItems;
  }, [filteredItems]);

  // Selected Month metadata
  const selectedMonthInfo = useMemo(() => {
    if (selectedMonth === 'ALL') return null;
    return availableMonths.find((m) => m.key === selectedMonth) || null;
  }, [selectedMonth, availableMonths]);

  // Executive Growth Comparison per Kota (YoY 2025 vs 2026 / MoM)
  const monthlyComparison = useMemo(() => {
    return calculateGrowthComparison(items, growthMode, growthSpecificMonth);
  }, [items, growthMode, growthSpecificMonth]);

  const filteredDecliningAreas = useMemo(() => {
    if (!monthlyComparison) return [];
    if (!growthSearchCity.trim()) return monthlyComparison.decliningAreas;
    const q = growthSearchCity.toLowerCase();
    return monthlyComparison.decliningAreas.filter((a) => a.cityName.toLowerCase().includes(q));
  }, [monthlyComparison, growthSearchCity]);

  const filteredGrowingAreas = useMemo(() => {
    if (!monthlyComparison) return [];
    if (!growthSearchCity.trim()) return monthlyComparison.growingAreas;
    const q = growthSearchCity.toLowerCase();
    return monthlyComparison.growingAreas.filter((a) => a.cityName.toLowerCase().includes(q));
  }, [monthlyComparison, growthSearchCity]);

  const handleFocusAreaOnMap = (cityName: string) => {
    setSelectedCity(cityName);
    setViewMode('COMBINED');
    setInitialMapMode('GROWTH');
    setTimeout(() => {
      const mapElem = document.getElementById('customer-map-section');
      if (mapElem) {
        mapElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safeCurrentPage]);

  // Summary KPIs based on filtered dataset
  const mappableCount = useMemo(() => {
    return filteredItems.filter((i) => i.hasValidCoords && !i.isPickupAtStore).length;
  }, [filteredItems]);

  // Top City in filtered dataset
  const topCity = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredItems.forEach((i) => {
      if (i.cityName) {
        counts[i.cityName] = (counts[i.cityName] || 0) + 1;
      }
    });
    let best = '-';
    let max = 0;
    Object.entries(counts).forEach(([city, count]) => {
      if (count > max) {
        max = count;
        best = city;
      }
    });
    return { name: best, count: max };
  }, [filteredItems]);

  // Export to CSV helper
  const handleExportCsv = () => {
    const headers = [
      'No Receipt',
      'Nama Customer',
      'No Member',
      'Alamat',
      'Kota',
      'No HP',
      'Tanggal Transaksi',
      'Tanggal Pengiriman',
      'Tanggal Selesai Instalasi',
      'Status',
      'Surat Jalan',
      'Ekspedisi/Channel'
    ];

    const rows = filteredItems.map((i) => [
      `"${i.receiptNo}"`,
      `"${i.customerName.replace(/"/g, '""')}"`,
      `"${i.memberNo}"`,
      `"${i.address.replace(/"/g, '""')}"`,
      `"${i.cityName}"`,
      `"${i.bestPhone}"`,
      `"${i.transactionDateRaw}"`,
      `"${i.deliveryScheduleRaw}"`,
      `"${i.installScheduleRaw}"`,
      `"${i.statusLabel}"`,
      `"${i.installNo}"`,
      `"${i.typeOrder || i.deliveryId || 'Informa Fleet'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const monthSuffix = selectedMonthInfo ? `_${selectedMonthInfo.key}` : '_Semua_Bulan';
    link.setAttribute('download', `Database_Customer_Informa_ALSUT${monthSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Quick Summary Cards (GoPay/Informa Blue Styling) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 gopay-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#003B73] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              {selectedMonth === 'ALL' ? 'Total Customer' : 'Customer Bulan Ini'}
            </span>
            <div className="text-lg font-black text-[#003B73] leading-tight">
              {filteredItems.length} <span className="text-xs font-semibold text-slate-500">Order</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 gopay-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Bulan Transaksi
            </span>
            <div className="text-xs font-black text-slate-900 leading-tight truncate">
              {selectedMonthInfo ? selectedMonthInfo.label : `Semua (${availableMonths.length} Bulan)`}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 gopay-shadow flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00AA13] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Titik Koordinat
            </span>
            <div className="text-lg font-black text-slate-900 leading-tight">
              {mappableCount} <span className="text-xs font-semibold text-slate-500">Lokasi</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 gopay-shadow col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Wilayah Terbanyak
            </span>
            <div className="text-sm font-black text-slate-900 leading-tight truncate">
              {topCity.name} <span className="text-xs font-normal text-slate-500">({topCity.count})</span>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH SEPARATION / FILTER PILLS (Pilihan Bulan Transaksi Agar Tidak Nyampur) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 gopay-shadow p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#003B73] text-white flex items-center justify-center shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#003B73] uppercase tracking-wider">
                Pilih Bulan Transaksi Customer
              </span>
              <p className="text-[11px] text-slate-500">
                Pemisah database transaksi per periode bulan agar data rapi & tidak bercampur
              </p>
            </div>
          </div>

          {(selectedMonth !== 'ALL' || selectedStatus !== 'ALL' || selectedCity !== 'ALL' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setSelectedMonth('ALL');
                setSelectedStatus('ALL');
                setSelectedCity('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer border border-red-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Scrollable Month Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => {
              setSelectedMonth('ALL');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedMonth === 'ALL'
                ? 'bg-[#003B73] text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Semua Bulan</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              selectedMonth === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {items.length}
            </span>
          </button>

          {availableMonths.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                setSelectedMonth(m.key);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl font-black text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedMonth === m.key
                  ? 'bg-[#003B73] text-white shadow-md ring-2 ring-sky-300'
                  : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#003B73] border border-slate-200'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedMonth === m.key ? 'text-sky-300' : 'text-slate-400'}`} />
              <span>{m.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedMonth === m.key ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {m.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* BAHAN PEMBANDING TIAP BULAN & ANALISIS GROWTH / MINUS WILAYAH DO ALSUT */}
      {monthlyComparison && (
        <div className="bg-white rounded-3xl border border-slate-200/80 gopay-shadow overflow-hidden transition-all">
          {/* Header Bar */}
          <div className="p-3.5 sm:p-4 bg-linear-to-r from-slate-900 via-[#003B73] to-blue-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xs shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    Analisis Growth Pengiriman DO ALSUT (Per Kota)
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                    {monthlyComparison.periodBadge}
                  </span>
                </div>
                <p className="text-xs text-sky-100/90 mt-0.5">
                  Bahan evaluasi tim sales store untuk melihat pergerakan per kota (2025 vs 2026) tanpa bias data anomali
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Selector Tabs */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 text-xs">
                <button
                  onClick={() => setGrowthMode('YOY_JAN_AUG')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    growthMode === 'YOY_JAN_AUG'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-sky-100 hover:text-white hover:bg-white/10'
                  }`}
                  title="Januari - Agustus 2025 vs 2026 (Data Bersih Penuh)"
                >
                  ⭐ Jan - Agu (YoY)
                </button>

                <button
                  onClick={() => setGrowthMode('YOY_JAN_SEP')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    growthMode === 'YOY_JAN_SEP'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-sky-100 hover:text-white hover:bg-white/10'
                  }`}
                  title="Januari - September 2025 vs 2026 (Kumulatif 9 Bulan)"
                >
                  Jan - Sep (YTD)
                </button>

                <button
                  onClick={() => setGrowthMode('YOY_MONTH')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    growthMode === 'YOY_MONTH'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-sky-100 hover:text-white hover:bg-white/10'
                  }`}
                  title="Pilih 1 Bulan Tertentu (YoY)"
                >
                  Per Bulan YoY
                </button>

                <button
                  onClick={() => setGrowthMode('MOM_MONTH')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    growthMode === 'MOM_MONTH'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-sky-100 hover:text-white hover:bg-white/10'
                  }`}
                  title="Bulan ke Bulan 2026 (MoM)"
                >
                  MoM
                </button>
              </div>

              {/* Specific Month Selector when in YOY_MONTH mode */}
              {growthMode === 'YOY_MONTH' && (
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 text-xs">
                  <span className="text-sky-200 font-semibold text-[11px]">Bulan:</span>
                  <select
                    value={growthSpecificMonth}
                    onChange={(e) => setGrowthSpecificMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value={8} className="text-slate-900">Agustus</option>
                    <option value={7} className="text-slate-900">Juli</option>
                    <option value={6} className="text-slate-900">Juni</option>
                    <option value={5} className="text-slate-900">Mei</option>
                    <option value={4} className="text-slate-900">April</option>
                    <option value={3} className="text-slate-900">Maret</option>
                    <option value={2} className="text-slate-900">Februari</option>
                    <option value={1} className="text-slate-900">Januari</option>
                    <option value={9} className="text-slate-900">September (Parsial)</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => setIsGrowthSectionExpanded(!isGrowthSectionExpanded)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white shrink-0"
                title={isGrowthSectionExpanded ? 'Sembunyikan detail' : 'Tampilkan detail'}
              >
                {isGrowthSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Context Notice / Explanation Banner */}
          {monthlyComparison.noticeText && (
            <div className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-2 ${
              growthMode === 'YOY_JAN_AUG'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : growthMode === 'YOY_JAN_SEP'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-sky-50 text-sky-900 border-sky-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 font-black">
                  {growthMode === 'YOY_JAN_AUG' ? '✓ REKOMENDASI UTAMA:' : 'ℹ️ CATATAN PERIODE:'}
                </span>
                <span>{monthlyComparison.noticeText}</span>
              </div>
              {growthMode === 'YOY_JAN_SEP' && (
                <button
                  onClick={() => setGrowthMode('YOY_JAN_AUG')}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-md text-[11px] shrink-0 cursor-pointer"
                >
                  Gunakan Jan-Agu
                </button>
              )}
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-slate-500 text-[11px] font-bold block">Periode Pembanding</span>
                <span className="font-black text-slate-900">
                  {monthlyComparison.currentMonthLabel} <span className="text-slate-400 font-normal">vs</span> {monthlyComparison.prevMonthLabel}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <span className="text-slate-500 text-[11px] font-bold block">Total Volume DO ALSUT</span>
                <span className="font-black text-[#003B73]">
                  {monthlyComparison.totalCurrent.toLocaleString()} DO{' '}
                  <span className="text-slate-500 font-medium text-[11px]">
                    (vs {monthlyComparison.totalPrev.toLocaleString()} DO)
                  </span>
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <span className="text-slate-500 text-[11px] font-bold block">Laju Pertumbuhan Total</span>
                <span className={`font-black inline-flex items-center gap-1 ${
                  monthlyComparison.totalGrowthPct >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {monthlyComparison.totalGrowthPct >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {monthlyComparison.totalGrowthPct >= 0 ? '+' : ''}{monthlyComparison.totalGrowthPct}%
                  <span className="text-slate-500 font-medium text-[11px]">
                    ({monthlyComparison.totalDiff >= 0 ? '+' : ''}{monthlyComparison.totalDiff} DO)
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search city filter inside growth stats */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama kota..."
                  value={growthSearchCity}
                  onChange={(e) => setGrowthSearchCity(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#003B73] w-36 sm:w-44"
                />
                {growthSearchCity && (
                  <button
                    onClick={() => setGrowthSearchCity('')}
                    className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{monthlyComparison.decliningAreas.length} Kota Perlu Di-Improve</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{monthlyComparison.growingAreas.length} Kota Bertumbuh</span>
              </span>
            </div>
          </div>

          {/* Collapsible Content: Detailed Area Breakdowns */}
          {isGrowthSectionExpanded && (
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Column 1: Kota Perlu Di-Improve (Minus Growth) */}
              <div className="border border-red-200/90 rounded-2xl bg-red-50/30 overflow-hidden flex flex-col">
                <div className="p-3 bg-red-100/60 border-b border-red-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                    <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">
                      Kota Perlu Di-Improve ({filteredDecliningAreas.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                    Minus Growth
                  </span>
                </div>

                <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto pr-1.5 flex-1">
                  {filteredDecliningAreas.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl">
                      {growthSearchCity
                        ? `Tidak ada kota minus growth dengan kata kunci "${growthSearchCity}".`
                        : 'Tidak ada kota dengan minus growth pada periode ini.'}
                    </div>
                  ) : (
                    filteredDecliningAreas.map((stat: AreaGrowthStat) => (
                      <div
                        key={stat.cityName}
                        className="bg-white p-3 rounded-xl border border-red-100 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-slate-900">
                                {stat.cityName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                                📉 {stat.growthPct}%
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <strong>{stat.currentCount.toLocaleString()} DO</strong> (2026) vs <strong>{stat.prevCount.toLocaleString()} DO</strong> (2025)
                              <span className="text-red-600 font-bold ml-1">({stat.diff} DO)</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleFocusAreaOnMap(stat.cityName)}
                            className="px-2.5 py-1 text-[11px] font-black text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Tampilkan wilayah ini pada peta growth"
                          >
                            🗺️ Peta Growth
                          </button>
                        </div>

                        <div className="bg-red-50/70 p-2 rounded-lg border-l-3 border-red-500 text-[11px] text-slate-700 leading-snug">
                          <strong className="text-red-700 block font-bold text-[10px] mb-0.5">
                            💡 REKOMENDASI SALES TOKO:
                          </strong>
                          {stat.recommendation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Kota Bertumbuh (Positive Growth) */}
              <div className="border border-emerald-200/90 rounded-2xl bg-emerald-50/30 overflow-hidden flex flex-col">
                <div className="p-3 bg-emerald-100/60 border-b border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Kota Bertumbuh ({filteredGrowingAreas.length})
                    </h4>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    Positive Growth
                  </span>
                </div>

                <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto pr-1.5 flex-1">
                  {filteredGrowingAreas.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl">
                      {growthSearchCity
                        ? `Tidak ada kota bertumbuh dengan kata kunci "${growthSearchCity}".`
                        : 'Tidak ada kota bertumbuh pada periode ini.'}
                    </div>
                  ) : (
                    filteredGrowingAreas.map((stat: AreaGrowthStat) => (
                      <div
                        key={stat.cityName}
                        className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-slate-900">
                                {stat.cityName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                📈 +{stat.growthPct}%
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <strong>{stat.currentCount.toLocaleString()} DO</strong> (2026) vs <strong>{stat.prevCount.toLocaleString()} DO</strong> (2025)
                              <span className="text-emerald-700 font-bold ml-1">(+{stat.diff} DO)</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleFocusAreaOnMap(stat.cityName)}
                            className="px-2.5 py-1 text-[11px] font-black text-emerald-800 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Tampilkan wilayah ini pada peta growth"
                          >
                            🗺️ Peta Growth
                          </button>
                        </div>

                        <div className="bg-emerald-50/70 p-2 rounded-lg border-l-3 border-emerald-500 text-[11px] text-slate-700 leading-snug">
                          <strong className="text-emerald-800 block font-bold text-[10px] mb-0.5">
                            ⭐ TREN POSITIF:
                          </strong>
                          {stat.recommendation}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 gopay-shadow overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          
          {/* Mode Switcher */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
            <button
              id="view-combined-toggle-btn"
              onClick={() => setViewMode('COMBINED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'COMBINED'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-sky-300" />
              <span>Peta & Tabel</span>
            </button>

            <button
              id="view-map-toggle-btn"
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-300" />
              <span>Hanya Peta</span>
            </button>

            <button
              id="view-list-toggle-btn"
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-sky-300" />
              <span>Hanya Tabel ({filteredItems.length})</span>
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#003B73] bg-white hover:bg-sky-50 rounded-2xl transition-all border border-slate-200 cursor-pointer shadow-2xs"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#003B73]" />
            <span>Export CSV {selectedMonthInfo ? `(${selectedMonthInfo.shortLabel}: ${filteredItems.length})` : `(${filteredItems.length})`}</span>
          </button>
        </div>

        {/* MAP SECTION: Visible in COMBINED and MAP modes */}
        {(viewMode === 'COMBINED' || viewMode === 'MAP') && (
          <div id="customer-map-section" className="p-3.5 sm:p-4 border-b border-slate-200">
            <CustomerMap
              items={mapItems}
              selectedItem={selectedMapItem}
              onSelectCustomer={onViewDetail}
              selectedCity={selectedCity}
              onCityChange={(city) => {
                setSelectedCity(city);
                setCurrentPage(1);
              }}
              cities={cities}
              monthlyComparison={monthlyComparison}
              initialMode={initialMapMode}
            />
          </div>
        )}

        {/* Search & Filter Bar (Active in COMBINED and LIST mode) */}
        {(viewMode === 'COMBINED' || viewMode === 'LIST') && (
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="database-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari Customer, No. Receipt, Alamat, No. HP..."
                className="w-full pl-9 pr-3 py-2 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 focus:border-[#003B73] focus:ring-2 focus:ring-sky-200 transition-all outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Month dropdown */}
              <select
                id="database-month-select"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter Bulan Transaksi"
                className="px-3 py-2 bg-white text-xs font-bold text-[#003B73] rounded-2xl border border-slate-200 focus:border-[#003B73] outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="ALL">🗓️ Semua Bulan ({items.length})</option>
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    🗓️ {m.label} ({m.count} data)
                  </option>
                ))}
              </select>

              {/* Status dropdown */}
              <select
                id="database-status-select"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                aria-label="Filter Status"
                className="px-3 py-2 bg-white text-xs font-bold text-slate-800 rounded-2xl border border-slate-200 focus:border-[#003B73] outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="ALL">📋 Semua Status</option>
                <option value="COMPLETED">✅ Selesai / Terinstalasi</option>
                <option value="IN_TRANSIT">🚚 Dalam Pengiriman</option>
                <option value="WAITING_SCHEDULE">⏳ Belum Dijadwalkan</option>
              </select>

              {/* City dropdown */}
              <select
                id="database-city-select"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter Wilayah Customer"
                className="px-3 py-2 bg-white text-xs font-bold text-slate-800 rounded-2xl border border-slate-200 focus:border-[#003B73] outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="ALL">📍 Semua Kota</option>
                {cities.map((city) => (
                  <option key={city} value={city}>📍 {city}</option>
                ))}
              </select>

              {/* Sort dropdown */}
              <select
                id="database-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan Database Customer"
                className="px-3 py-2 bg-white text-xs font-bold text-slate-800 rounded-2xl border border-slate-200 focus:border-[#003B73] outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="TRANS_DATE_DESC">Tgl Transaksi Terbaru</option>
                <option value="TRANS_DATE_ASC">Tgl Transaksi Terlama</option>
                <option value="DATE_DESC">Tgl Selesai Pasang Terbaru</option>
                <option value="DATE_ASC">Tgl Selesai Pasang Terlama</option>
                <option value="NAME_ASC">Nama Customer (A-Z)</option>
                <option value="RECEIPT">No. Receipt</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Indicators */}
        {(selectedMonth !== 'ALL' || selectedStatus !== 'ALL' || selectedCity !== 'ALL' || searchQuery.trim() !== '') && (
          <div className="px-4 py-2 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between text-xs text-[#003B73]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[11px] uppercase tracking-wider">Filter Aktif:</span>
              {selectedMonth !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#003B73] text-white font-bold flex items-center gap-1 text-[11px]">
                  <span>🗓️ {selectedMonthInfo?.label}</span>
                  <button 
                    onClick={() => { setSelectedMonth('ALL'); setCurrentPage(1); }}
                    className="hover:text-red-300 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedStatus !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-sky-200 font-bold text-[#003B73] flex items-center gap-1 text-[11px]">
                  <span>📋 {selectedStatus === 'COMPLETED' ? 'Selesai' : selectedStatus === 'IN_TRANSIT' ? 'Dalam Pengiriman' : 'Belum Dijadwalkan'}</span>
                  <button 
                    onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
                    className="hover:text-red-500 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCity !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-sky-200 font-bold text-[#003B73] flex items-center gap-1 text-[11px]">
                  <span>📍 {selectedCity}</span>
                  <button 
                    onClick={() => { setSelectedCity('ALL'); setCurrentPage(1); }}
                    className="hover:text-red-500 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery.trim() !== '' && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white border border-sky-200 font-bold text-[#003B73] flex items-center gap-1 text-[11px]">
                  <span>🔍 "{searchQuery}"</span>
                  <button 
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="hover:text-red-500 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              <span className="text-slate-500 text-[11px]">
                ({filteredItems.length} hasil ditemukan)
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedMonth('ALL');
                setSelectedStatus('ALL');
                setSelectedCity('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-[11px] font-extrabold text-red-600 hover:underline cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}

        {/* TABLE SECTION: Visible in COMBINED and LIST modes */}
        {(viewMode === 'COMBINED' || viewMode === 'LIST') && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-3.5">No. Receipt</th>
                    <th className="py-3 px-3.5">Nama Customer</th>
                    <th className="py-3 px-3.5">Alamat Lengkap</th>
                    <th className="py-3 px-3.5">Kota</th>
                    <th className="py-3 px-3.5">Tgl Transaksi</th>
                    <th className="py-3 px-3.5">Jadwal Instalasi</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5">No. HP</th>
                    <th className="py-3 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700">Tidak ada data customer yang cocok</p>
                          <p className="text-xs text-slate-400">
                            Coba pilih bulan transaksi lain atau reset kata kunci pencarian.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr 
                        key={item.id}
                        onClick={() => onViewDetail(item)}
                        className={`hover:bg-sky-50/50 transition-colors cursor-pointer group ${
                          selectedMapItem?.id === item.id ? 'bg-sky-50/80 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono font-extrabold text-[#003B73] whitespace-nowrap">
                          #{item.receiptNo}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{item.customerName}</span>
                            {item.memberNo && (
                              <span className="text-[9px] bg-sky-50 text-[#003B73] font-bold px-1.5 py-0.2 rounded-md font-mono border border-sky-100">
                                Member
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 max-w-xs">
                          <p className="line-clamp-1 text-slate-700 font-medium">{item.address}</p>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                            {item.cityName}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#003B73] bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                            <Calendar className="w-3 h-3 text-[#003B73]" />
                            {formatIndonesianDate(item.transactionDate, item.transactionDateRaw)}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-800">
                          {formatIndonesianDate(item.installScheduleDate, item.installScheduleRaw)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-[#00AA13] border border-emerald-200'
                              : item.status === 'IN_TRANSIT'
                              ? 'bg-sky-50 text-[#003B73] border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status === 'COMPLETED' ? 'Selesai' : item.status === 'IN_TRANSIT' ? 'Pengiriman' : 'Menunggu'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700 font-semibold">
                          {item.bestPhone}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.latitude && item.longitude && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectMapItem(item);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                title="Lihat Lokasi di Peta"
                                className="text-xs font-extrabold text-[#003B73] hover:text-white px-2.5 py-1 bg-sky-50 hover:bg-[#003B73] rounded-xl transition-all cursor-pointer border border-sky-100"
                              >
                                📍 Peta
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetail(item);
                              }}
                              className="text-xs font-extrabold text-[#003B73] group-hover:text-white px-2.5 py-1 bg-sky-50 group-hover:bg-[#003B73] rounded-xl transition-all cursor-pointer border border-sky-100"
                            >
                              Detail →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="text-[11px] text-slate-500 font-semibold">
                Menampilkan <strong>{paginatedItems.length > 0 ? (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> - <strong>{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> dari <strong>{filteredItems.length}</strong> data {selectedMonthInfo ? `(Bulan ${selectedMonthInfo.label})` : ''}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-extrabold text-xs bg-white border border-slate-200 rounded-xl text-[#003B73]">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

