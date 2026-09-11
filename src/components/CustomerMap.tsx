import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import { DeliveryItem } from '../types';
import { MonthlyComparison, AreaGrowthStat } from '../utils/growthUtils';
import { Layers, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles, Navigation } from 'lucide-react';

interface CustomerMapProps {
  items: DeliveryItem[];
  selectedItem: DeliveryItem | null;
  onSelectCustomer: (item: DeliveryItem) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
  monthlyComparison?: MonthlyComparison | null;
  initialMode?: 'DELIVERIES' | 'GROWTH';
}

const CITY_HEX_COLORS: Record<string, string> = {
  'Tangerang': '#f97316',
  'Tangerang Selatan': '#2563eb',
  'Jakarta Barat': '#059669',
  'Jakarta Selatan': '#9333ea',
  'Jakarta Pusat': '#e11d48',
  'Jakarta Utara': '#0891b2',
  'Jakarta Timur': '#4f46e5',
  'Kab. Tangerang': '#d97706',
  'Bekasi': '#0d9488',
  'Bogor': '#15803d',
  'Depok': '#db2777',
  'Serang': '#ca8a04',
};

function getCityColorHex(city: string): string {
  if (!city) return '#003B73';
  if (CITY_HEX_COLORS[city]) return CITY_HEX_COLORS[city];
  const keys = Object.keys(CITY_HEX_COLORS);
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = city.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % (keys.length || 1);
  return CITY_HEX_COLORS[keys[index]] || '#003B73';
}

const MAX_MAP_MARKERS = 2500;

export const CustomerMap: React.FC<CustomerMapProps> = ({
  items,
  selectedItem,
  onSelectCustomer,
  selectedCity,
  onCityChange,
  cities,
  monthlyComparison,
  initialMode = 'DELIVERIES',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const deliveryMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const growthMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onSelectCustomerRef = useRef(onSelectCustomer);

  const [mapMode, setMapMode] = useState<'DELIVERIES' | 'GROWTH'>(initialMode);
  const [growthFilter, setGrowthFilter] = useState<'ALL' | 'DECLINE' | 'GROWTH'>('ALL');

  useEffect(() => {
    onSelectCustomerRef.current = onSelectCustomer;
  }, [onSelectCustomer]);

  // Filter mappable items
  const mappableItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.latitude !== null &&
        item.longitude !== null &&
        !isNaN(item.latitude) &&
        !isNaN(item.longitude)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCity === 'ALL') {
      return mappableItems;
    }
    return mappableItems.filter((i) => i.cityName.toLowerCase() === selectedCity.toLowerCase());
  }, [mappableItems, selectedCity]);

  // Cap markers for performance
  const renderedItems = useMemo(() => {
    if (filteredItems.length <= MAX_MAP_MARKERS) {
      return filteredItems;
    }
    return filteredItems.slice(0, MAX_MAP_MARKERS);
  }, [filteredItems]);

  // Filter area stats for growth mode
  const filteredAreaStats = useMemo(() => {
    if (!monthlyComparison) return [];
    if (growthFilter === 'DECLINE') {
      return monthlyComparison.decliningAreas;
    }
    if (growthFilter === 'GROWTH') {
      return monthlyComparison.growingAreas;
    }
    return monthlyComparison.areaStats;
  }, [monthlyComparison, growthFilter]);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    try {
      const defaultCenter: [number, number] = [-6.2238, 106.6525];

      const map = L.map(container, {
        center: defaultCenter,
        zoom: 11,
        zoomControl: true,
        preferCanvas: true,
      });

      // Basemap OSM Standard
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const canvasRenderer = L.canvas({ padding: 0.5 });
      canvasRendererRef.current = canvasRenderer;

      // Hub ALSUT Store Pin
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="background-color: #003B73; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px; transform: translate(-50%, -50%);">
            🛋️
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([-6.2238, 106.6525], { icon: storeIcon, title: 'Informa Living World ALSUT' })
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 6px; color: #1e293b; font-size: 12px; min-width: 200px;">
            <span style="font-size: 10px; font-weight: 800; color: #003B73; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; display: inline-block;">Pusat Distribusi Toko</span>
            <strong style="font-size: 14px; color: #0f172a; display: block; margin-top: 4px;">Informa Living World Alam Sutera</strong>
            <span style="color: #64748b; display: block; font-size: 11px; margin-top: 2px;">Mall Living World Alam Sutera, Ground Floor</span>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #00AA13; font-weight: bold;">
              ✓ Hub Asal Seluruh Pengantaran DO ALSUT
            </div>
          </div>
        `)
        .addTo(map);

      const deliveryLayer = L.layerGroup().addTo(map);
      const growthLayer = L.layerGroup().addTo(map);

      deliveryMarkersLayerRef.current = deliveryLayer;
      growthMarkersLayerRef.current = growthLayer;
      mapRef.current = map;

      // Handle dynamic sizing on mobile and window resize
      const handleResize = () => {
        try {
          map.invalidateSize();
        } catch {}
      };

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(container);
      }

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      // Multiple staggered invalidations for mobile browser viewport hydration
      const t1 = setTimeout(handleResize, 100);
      const t2 = setTimeout(handleResize, 350);
      const t3 = setTimeout(handleResize, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        try {
          map.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
        deliveryMarkersLayerRef.current = null;
        growthMarkersLayerRef.current = null;
        canvasRendererRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }
  }, []);

  // Update Delivery Markers (When in DELIVERIES mode)
  useEffect(() => {
    const map = mapRef.current;
    const deliveryLayer = deliveryMarkersLayerRef.current;
    const canvasRenderer = canvasRendererRef.current;
    if (!map || !deliveryLayer || !canvasRenderer) return;

    deliveryLayer.clearLayers();
    selectedMarkerRef.current = null;

    if (mapMode !== 'DELIVERIES') {
      return;
    }

    try {
      const bounds: [number, number][] = [];

      renderedItems.forEach((item) => {
        if (item.latitude === null || item.longitude === null) return;

        const pos: [number, number] = [item.latitude, item.longitude];
        bounds.push(pos);

        const colorHex = getCityColorHex(item.cityName);
        const isSelected = selectedItem?.id === item.id;

        const circleMarker = L.circleMarker(pos, {
          renderer: canvasRenderer,
          radius: isSelected ? 9 : 5.5,
          fillColor: isSelected ? '#dc2626' : colorHex,
          fillOpacity: isSelected ? 1 : 0.85,
          color: '#ffffff',
          weight: isSelected ? 3 : 1.2,
        });

        circleMarker.bindPopup(() => {
          const wrapper = document.createElement('div');
          wrapper.style.fontFamily = 'sans-serif';
          wrapper.style.padding = '4px';
          wrapper.style.maxWidth = '260px';
          wrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #003B73; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">
                ${item.cityName || 'Informa'}
              </span>
              <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #64748b;">#${item.receiptNo}</span>
            </div>
            <div style="font-weight: bold; font-size: 13px; color: #0f172a; line-height: 1.3;">${item.customerName}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.address}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px;">📅 Transaksi: <strong>${item.transactionDateRaw || '-'}</strong></div>
            <div style="font-size: 10px; color: #64748b;">🛠️ Jadwal: <strong>${item.installScheduleRaw || item.deliveryScheduleRaw || '-'}</strong></div>
          `;

          const detailBtn = document.createElement('button');
          detailBtn.style.marginTop = '8px';
          detailBtn.style.width = '100%';
          detailBtn.style.padding = '6px 8px';
          detailBtn.style.backgroundColor = '#003B73';
          detailBtn.style.color = '#ffffff';
          detailBtn.style.fontWeight = 'bold';
          detailBtn.style.fontSize = '11px';
          detailBtn.style.borderRadius = '8px';
          detailBtn.style.border = 'none';
          detailBtn.style.cursor = 'pointer';
          detailBtn.innerText = 'Lihat Detail Lengkap';
          detailBtn.onclick = () => {
            onSelectCustomerRef.current(item);
          };

          wrapper.appendChild(detailBtn);
          return wrapper;
        });

        if (isSelected) {
          selectedMarkerRef.current = circleMarker;
        }

        deliveryLayer.addLayer(circleMarker);
      });

      if (selectedItem && selectedItem.latitude && selectedItem.longitude) {
        map.setView([selectedItem.latitude, selectedItem.longitude], 14, { animate: true });
      } else if (bounds.length > 0 && selectedCity !== 'ALL') {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    } catch (err) {
      console.error('Error updating delivery markers:', err);
    }
  }, [renderedItems, selectedItem, mapMode, selectedCity]);

  // Update Growth Markers (When in GROWTH mode)
  useEffect(() => {
    const map = mapRef.current;
    const growthLayer = growthMarkersLayerRef.current;
    if (!map || !growthLayer) return;

    growthLayer.clearLayers();

    if (mapMode !== 'GROWTH' || !monthlyComparison) {
      return;
    }

    try {
      const bounds: [number, number][] = [];

      filteredAreaStats.forEach((stat: AreaGrowthStat) => {
        if (!stat.lat || !stat.lng) return;

        const pos: [number, number] = [stat.lat, stat.lng];
        bounds.push(pos);

        const isDecline = stat.status === 'DECLINE';
        const isGrowth = stat.status === 'GROWTH';

        const mainColor = isDecline ? '#dc2626' : (isGrowth ? '#16a34a' : '#64748b');
        const bgColor = isDecline ? '#fef2f2' : (isGrowth ? '#f0fdf4' : '#f8fafc');
        const borderColor = isDecline ? '#ef4444' : (isGrowth ? '#22c55e' : '#cbd5e1');
        const iconSymbol = isDecline ? '📉' : (isGrowth ? '📈' : '📊');
        const sign = stat.growthPct > 0 ? '+' : '';

        // Dynamic Rich HTML Pin for Area Growth
        const icon = L.divIcon({
          className: 'growth-area-pin',
          html: `
            <div style="transform: translate(-50%, -50%); cursor: pointer; text-align: center; position: relative;">
              <!-- Outer pulse ring for declining areas needing improvement -->
              ${isDecline ? `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 56px; height: 56px; border-radius: 9999px; background: rgba(220, 38, 38, 0.2); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              ` : ''}
              
              <!-- Main Badge Box -->
              <div style="background: white; border: 2.5px solid ${borderColor}; border-radius: 12px; padding: 4px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: inline-flex; flex-direction: column; align-items: center; min-width: 90px; backdrop-filter: blur(4px);">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-size: 13px;">${iconSymbol}</span>
                  <span style="font-size: 11px; font-weight: 900; color: ${mainColor};">
                    ${sign}${stat.growthPct}%
                  </span>
                </div>
                <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 1px; white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">
                  ${stat.cityName}
                </div>
                <div style="font-size: 9px; font-weight: 700; color: ${mainColor}; background: ${bgColor}; padding: 1px 5px; border-radius: 4px; margin-top: 2px;">
                  ${isDecline ? 'PERLU IMPROVE' : (isGrowth ? 'TUMBUH' : 'STABIL')}
                </div>
              </div>
            </div>
          `,
          iconSize: [110, 50],
          iconAnchor: [55, 25],
        });

        const marker = L.marker(pos, { icon });

        // Growth Popup Content
        marker.bindPopup(() => {
          const wrapper = document.createElement('div');
          wrapper.style.fontFamily = 'sans-serif';
          wrapper.style.padding = '6px';
          wrapper.style.maxWidth = '280px';
          wrapper.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 900; font-size: 11px; text-transform: uppercase; color: ${mainColor}; background: ${bgColor}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${borderColor};">
                ${isDecline ? '🚨 Area Perlu Di-Improve' : (isGrowth ? '⭐ Area Bertumbuh' : '📊 Area Stabil')}
              </span>
              <span style="font-weight: 900; font-size: 13px; color: ${mainColor};">
                ${sign}${stat.growthPct}%
              </span>
            </div>

            <h4 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0;">
              Wilayah ${stat.cityName}
            </h4>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              Perbandingan: <strong>${monthlyComparison.currentMonthLabel}</strong> vs <strong>${monthlyComparison.prevMonthLabel}</strong>
            </div>

            <div style="background: #f8fafc; border-radius: 8px; padding: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;">
              <div>
                <span style="font-size: 10px; color: #64748b; display: block;">Volume Bulan Ini</span>
                <strong style="font-size: 13px; color: #003B73;">${stat.currentCount.toLocaleString()} DO</strong>
              </div>
              <div>
                <span style="font-size: 10px; color: #64748b; display: block;">Bulan Sebelumnya</span>
                <strong style="font-size: 13px; color: #475569;">${stat.prevCount.toLocaleString()} DO</strong>
              </div>
              <div style="grid-column: span 2; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
                <span style="font-size: 10px; color: #64748b;">Selisih Pertumbuhan: </span>
                <strong style="font-size: 11px; color: ${mainColor};">${stat.diff >= 0 ? '+' : ''}${stat.diff} Order Transaksi</strong>
              </div>
            </div>

            <div style="background: ${isDecline ? '#fff1f2' : '#f0fdf4'}; border-left: 3px solid ${mainColor}; padding: 6px 8px; border-radius: 4px; font-size: 11px; color: #1e293b; line-height: 1.4; margin-bottom: 10px;">
              <strong style="display: block; font-size: 10px; color: ${mainColor}; margin-bottom: 2px;">💡 REKOMENDASI SALES ADVISOR:</strong>
              ${stat.recommendation}
            </div>
          `;

          const filterBtn = document.createElement('button');
          filterBtn.style.width = '100%';
          filterBtn.style.padding = '7px 10px';
          filterBtn.style.backgroundColor = '#003B73';
          filterBtn.style.color = '#ffffff';
          filterBtn.style.fontWeight = 'bold';
          filterBtn.style.fontSize = '11px';
          filterBtn.style.borderRadius = '8px';
          filterBtn.style.border = 'none';
          filterBtn.style.cursor = 'pointer';
          filterBtn.innerText = `🔍 Tampilkan Customer di ${stat.cityName}`;
          filterBtn.onclick = () => {
            onCityChange(stat.cityName);
            setMapMode('DELIVERIES');
          };

          wrapper.appendChild(filterBtn);
          return wrapper;
        });

        growthLayer.addLayer(marker);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    } catch (err) {
      console.error('Error updating growth markers:', err);
    }
  }, [filteredAreaStats, mapMode, monthlyComparison, onCityChange]);

  const handleCenterHub = () => {
    if (mapRef.current) {
      try {
        mapRef.current.setView([-6.2238, 106.6525], 13, { animate: true });
      } catch {
        // ignore
      }
    }
  };

  const handleFitAll = () => {
    if (!mapRef.current) return;
    try {
      if (mapMode === 'GROWTH' && filteredAreaStats.length > 0) {
        const bounds: [number, number][] = filteredAreaStats
          .filter((s) => s.lat && s.lng)
          .map((s) => [s.lat, s.lng]);
        bounds.push([-6.2238, 106.6525]);
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      } else {
        const bounds: [number, number][] = renderedItems
          .filter((i) => i.latitude && i.longitude)
          .map((i) => [i.latitude as number, i.longitude as number]);
        bounds.push([-6.2238, 106.6525]);
        if (bounds.length > 0) {
          mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Top Toolbar: Mode Switcher & Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 gopay-shadow flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Map Mode Selector (Titik Customer vs Peta Growth Wilayah) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setMapMode('DELIVERIES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              mapMode === 'DELIVERIES'
                ? 'bg-[#003B73] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Titik Kirim DO</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {renderedItems.length}
            </span>
          </button>

          <button
            onClick={() => {
              setMapMode('GROWTH');
              setTimeout(() => {
                try {
                  mapRef.current?.invalidateSize();
                } catch {}
              }, 100);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              mapMode === 'GROWTH'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-slate-700 hover:text-red-700 hover:bg-white/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Analisis Growth Wilayah</span>
            <span className="sm:hidden">Peta Growth</span>
            {monthlyComparison && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-extrabold">
                {monthlyComparison.decliningAreas.length} Perlu Improv
              </span>
            )}
          </button>
        </div>

        {/* Secondary Filters Based on Mode */}
        {mapMode === 'DELIVERIES' ? (
          /* City Filter Pills */
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-none text-xs">
            <span className="font-extrabold text-[#003B73] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#003B73]" /> Kota:
            </span>

            <button
              onClick={() => onCityChange('ALL')}
              className={`px-3 py-1 font-extrabold rounded-xl transition-all shrink-0 cursor-pointer ${
                selectedCity === 'ALL'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({mappableItems.length})
            </button>

            {cities.slice(0, 10).map((city) => {
              const count = mappableItems.filter((i) => i.cityName.toLowerCase() === city.toLowerCase()).length;
              if (count === 0) return null;
              const colorHex = getCityColorHex(city);

              return (
                <button
                  key={city}
                  onClick={() => onCityChange(city)}
                  className={`px-3 py-1 font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedCity.toLowerCase() === city.toLowerCase()
                      ? 'bg-[#003B73] text-white shadow-xs font-extrabold ring-2 ring-sky-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorHex }}></span>
                  <span>{city} ({count})</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Growth Mode Filter Chips */
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              onClick={() => setGrowthFilter('ALL')}
              className={`px-3 py-1 font-extrabold rounded-xl transition-all cursor-pointer ${
                growthFilter === 'ALL'
                  ? 'bg-[#003B73] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Wilayah ({monthlyComparison?.areaStats.length || 0})
            </button>

            <button
              onClick={() => setGrowthFilter('DECLINE')}
              className={`px-3 py-1 font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                growthFilter === 'DECLINE'
                  ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-200'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hanya Perlu Improve ({monthlyComparison?.decliningAreas.length || 0})</span>
            </button>

            <button
              onClick={() => setGrowthFilter('GROWTH')}
              className={`px-3 py-1 font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                growthFilter === 'GROWTH'
                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Area Bertumbuh ({monthlyComparison?.growingAreas.length || 0})</span>
            </button>
          </div>
        )}

        {/* Map Actions */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <button
            onClick={handleCenterHub}
            className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-[#003B73] text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="Pusatkan ke Hub Informa ALSUT"
          >
            🛋️ Hub ALSUT
          </button>
          <button
            onClick={handleFitAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-[#003B73] text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="Tampilkan Seluruh Area"
          >
            🔍 Reset Zoom
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[520px] min-h-[350px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />

        {/* Growth Mode Floating Overlay Banner */}
        {mapMode === 'GROWTH' && monthlyComparison && (
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg max-w-xs sm:max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-black text-[#003B73] uppercase tracking-wider">
                Analisis Pertumbuhan DO Wilayah
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-700">
              Periode: <strong>{monthlyComparison.currentMonthLabel}</strong> vs <strong>{monthlyComparison.prevMonthLabel}</strong>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-[11px] text-slate-600">Minus Growth (Perlu Improv):</span>
              </div>
              <span className="font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                {monthlyComparison.decliningAreas.length} Wilayah
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-slate-600">Area Tumbuh Positif:</span>
              </div>
              <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {monthlyComparison.growingAreas.length} Wilayah
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic">
              💡 Klik marker wilayah pada peta untuk melihat detail DO & saran sales tim toko.
            </div>
          </div>
        )}

        {/* Deliveries Mode Legend */}
        {mapMode === 'DELIVERIES' && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-[#003B73] border border-white"></span>
              <span>Hub Toko Informa ALSUT</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>Lokasi Customer DO</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
