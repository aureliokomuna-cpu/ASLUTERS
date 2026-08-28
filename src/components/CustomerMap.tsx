import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { DeliveryItem } from '../types';
import { Layers } from 'lucide-react';

interface CustomerMapProps {
  items: DeliveryItem[];
  selectedItem: DeliveryItem | null;
  onSelectCustomer: (item: DeliveryItem) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  cities: string[];
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

const MAX_MAP_MARKERS = 2000;

export const CustomerMap: React.FC<CustomerMapProps> = ({
  items,
  selectedItem,
  onSelectCustomer,
  selectedCity,
  onCityChange,
  cities,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.CircleMarker | null>(null);
  const onSelectCustomerRef = useRef(onSelectCustomer);

  useEffect(() => {
    onSelectCustomerRef.current = onSelectCustomer;
  }, [onSelectCustomer]);

  // Filter items: must have valid coords AND not be store pickup
  const mappableItems = useMemo(() => {
    return items.filter(
      (item) => item.hasValidCoords && !item.isPickupAtStore && item.latitude !== null && item.longitude !== null
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCity === 'ALL') {
      return mappableItems;
    }
    return mappableItems.filter((item) => item.cityName.toLowerCase() === selectedCity.toLowerCase());
  }, [mappableItems, selectedCity]);

  // Items actually rendered on map (capped for buttery-smooth performance)
  const renderedItems = useMemo(() => {
    if (filteredItems.length <= MAX_MAP_MARKERS) {
      return filteredItems;
    }
    return filteredItems.slice(0, MAX_MAP_MARKERS);
  }, [filteredItems]);

  // Initialize Map with lightweight canvas
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Cleanup existing leaflet instance if attached to DOM element
    if ((container as any)._leaflet_id && !mapRef.current) {
      delete (container as any)._leaflet_id;
    }

    if (mapRef.current) {
      mapRef.current.invalidateSize();
      return;
    }

    try {
      const defaultCenter: [number, number] = [-6.2238, 106.6525];

      const map = L.map(container, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        preferCanvas: true, // Ultra-fast canvas rendering
      });

      // Basemap OSM Standard
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Canvas Renderer for vector circle markers
      const canvasRenderer = L.canvas({ padding: 0.5 });
      canvasRendererRef.current = canvasRenderer;

      // Hub ALSUT Store Pin
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="background-color: #dc2626; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); font-size: 14px; transform: translate(-50%, -50%);">
            🏠
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([-6.2238, 106.6525], { icon: storeIcon, title: 'Informa Living World ALSUT' })
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; color: #1e293b; font-size: 12px;">
            <span style="font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase; display: block;">Hub Utama</span>
            <strong style="font-size: 13px; color: #0f172a; display: block; margin-top: 2px;">Informa Living World Alam Sutera</strong>
            <span style="color: #64748b; display: block; font-size: 11px; margin-top: 4px;">Pusat distribusi logistik toko</span>
          </div>
        `)
        .addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapRef.current = map;

      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        try {
          map.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
        markersLayerRef.current = null;
        canvasRendererRef.current = null;
      };
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }
  }, []);

  // Update Markers using high-performance Canvas circle markers
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const canvasRenderer = canvasRendererRef.current;
    if (!map || !markersLayer || !canvasRenderer) return;

    try {
      markersLayer.clearLayers();
      selectedMarkerRef.current = null;

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

        // Fast HTML string for popup (constructed only on demand)
        circleMarker.bindPopup(() => {
          const wrapper = document.createElement('div');
          wrapper.style.fontFamily = 'sans-serif';
          wrapper.style.padding = '4px';
          wrapper.style.maxWidth = '250px';
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
            <div style="font-size: 10px; color: #64748b;">🛠️ Jadwal: <strong>${item.installScheduleRaw || '-'}</strong></div>
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

        markersLayer.addLayer(circleMarker);
      });

      // Zoom to selection or fit bounds
      if (selectedItem && selectedItem.latitude && selectedItem.longitude) {
        map.setView([selectedItem.latitude, selectedItem.longitude], 14, { animate: true });
      } else if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    } catch (err) {
      console.error('Error updating markers:', err);
    }
  }, [renderedItems, selectedItem]);

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
      const bounds: [number, number][] = renderedItems
        .filter((i) => i.latitude && i.longitude)
        .map((i) => [i.latitude as number, i.longitude as number]);

      bounds.push([-6.2238, 106.6525]);

      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Simple Top Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 gopay-shadow flex flex-wrap items-center justify-between gap-2.5">
        {/* City Filter Pills */}
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

          {cities.map((city) => {
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

        {/* Map Quick Controls */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <span className="text-[11px] font-extrabold text-[#003B73] bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200/60 hidden sm:inline-block">
            ⚡ {renderedItems.length} Titik {filteredItems.length > MAX_MAP_MARKERS ? `(dari ${filteredItems.length})` : ''}
          </span>
          <button
            onClick={handleCenterHub}
            className="px-3 py-1 bg-slate-100 hover:bg-sky-50 hover:text-[#003B73] text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="Pusatkan ke Hub Informa ALSUT"
          >
            🏠 Hub ALSUT
          </button>
          <button
            onClick={handleFitAll}
            className="px-3 py-1 bg-slate-100 hover:bg-sky-50 hover:text-[#003B73] text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="Tampilkan Semua Lokasi"
          >
            🔍 Reset Zoom
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

