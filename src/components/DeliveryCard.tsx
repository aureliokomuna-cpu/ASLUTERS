import React from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText, 
  ExternalLink, 
  Package, 
  Store,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import { DeliveryItem } from '../types';
import { formatIndonesianDate } from '../utils/dateUtils';

interface DeliveryCardProps {
  item: DeliveryItem;
  onViewDetail: (item: DeliveryItem) => void;
  onFocusMap?: (item: DeliveryItem) => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  item,
  onViewDetail,
  onFocusMap
}) => {
  // Determine badge colors based on urgency
  let urgencyBadge = null;
  if (item.isUrgentTomorrow) {
    urgencyBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500 text-white shadow-sm animate-pulse-soft">
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-200" />
        H-1 BESOK
      </span>
    );
  } else if (item.isToday) {
    urgencyBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm">
        <Calendar className="w-3.5 h-3.5 text-yellow-100" />
        HARI INI
      </span>
    );
  } else if (item.daysUntilInstall !== null && item.daysUntilInstall > 1) {
    urgencyBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-[#003B73] border border-sky-200">
        H-{item.daysUntilInstall} (Tepat Waktu)
      </span>
    );
  }

  // Steps for the visual tracker
  const steps = [
    { label: 'Order', sub: formatIndonesianDate(item.transactionDate), activePercent: 15 },
    { label: 'Gudang', sub: 'Hub ALSUT', activePercent: 35 },
    { label: 'Kirim', sub: formatIndonesianDate(item.deliveryScheduleDate), activePercent: 60 },
    { label: 'Tiba', sub: 'Tujuan', activePercent: 85 },
    { label: 'Instalasi', sub: formatIndonesianDate(item.installScheduleDate), activePercent: 100 },
  ];

  // Calculate truck offset
  const truckOffset = Math.min(Math.max(item.progressPercent, 10), 92);

  return (
    <div 
      id={`delivery-card-${item.id}`}
      className={`bg-white rounded-3xl transition-all duration-200 hover:-translate-y-0.5 gopay-shadow border ${
        item.isUrgentTomorrow 
          ? 'border-red-400 ring-2 ring-red-400/20' 
          : 'border-slate-200/80 hover:border-sky-300'
      }`}
    >
      {/* Top Card Header: Receipt Number, Urgency Badge, & Expedition Badge */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-50/80 to-sky-50/30 rounded-t-3xl">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#003B73] text-white text-xs font-black px-3 py-1 rounded-xl shadow-xs">
            <Package className="w-3.5 h-3.5 text-sky-300" />
            <span className="font-mono tracking-tight">{item.receiptNo}</span>
          </div>

          {item.isPickupAtStore ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Store className="w-3 h-3" /> Ambil di Toko
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
              <Truck className="w-3 h-3 text-slate-500" /> Delivery
            </span>
          )}

          {/* Expedition info */}
          {(item.typeOrder || item.deliveryId) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {item.typeOrder || item.deliveryId}
            </span>
          )}
        </div>

        <div>
          {urgencyBadge}
        </div>
      </div>

      {/* Main Card Body: Customer Details & Addresses */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Customer & Destination */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-sky-50 text-[#003B73] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </span>
              {item.customerName}
            </h3>
            {item.memberNo && (
              <p className="text-xs text-slate-400 mt-0.5 pl-9">
                Member: <span className="font-mono font-bold text-[#003B73]">{item.memberNo}</span>
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block bg-sky-50 text-[#003B73] border border-sky-200/80 font-bold text-xs px-3 py-1 rounded-xl">
              📍 {item.cityName}
            </span>
          </div>
        </div>

        {/* Address Card (GoPay style) */}
        <div className="flex items-start gap-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700">
          <MapPin className="w-4 h-4 text-[#003B73] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="leading-relaxed font-semibold text-slate-800 line-clamp-2">
              {item.address}
            </p>
            {item.addressNotes && (
              <p className="mt-1 text-slate-500 italic text-[11px]">
                Patokan: {item.addressNotes}
              </p>
            )}
          </div>
        </div>

        {/* Important Delivery Notes */}
        {item.shippingNotes && (
          <div className="flex items-start gap-2.5 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 text-xs text-amber-950">
            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-amber-800">Catatan Khusus: </span>
              <span className="font-medium">{item.shippingNotes}</span>
            </div>
          </div>
        )}

        {/* Dates Breakdown */}
        <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] font-semibold">Jadwal Pengiriman</span>
            <span className="font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#003B73]" />
              {formatIndonesianDate(item.deliveryScheduleDate, item.deliveryScheduleRaw)}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${
            item.isUrgentTomorrow 
              ? 'bg-red-50 border-red-200 text-red-950' 
              : 'bg-sky-50/70 border-sky-200 text-[#003B73]'
          }`}>
            <span className="text-slate-500 block text-[11px] font-semibold">Target Instalasi</span>
            <span className="font-black mt-1 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#003B73]" />
              {formatIndonesianDate(item.installScheduleDate, item.installScheduleRaw)}
            </span>
          </div>
        </div>

        {/* Visual Progress Tracker (GoPay Delivery Stepper) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#003B73]" />
              <span>Status Operasional:</span>
            </span>
            <span className="text-[#003B73] font-extrabold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
              {item.statusLabel}
            </span>
          </div>

          {/* Progress Bar with Stepper and Animated Truck */}
          <div className="relative pt-6 pb-2 px-1">
            {/* Background Line */}
            <div className="absolute top-8 left-4 right-4 h-1.5 bg-slate-100 rounded-full z-0">
              {/* Active filled line (Informa Blue gradient) */}
              <div 
                className="h-full bg-gradient-to-r from-[#003B73] via-[#0284C7] to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>

            {/* Animated Truck Icon on the line */}
            <div 
              className="absolute top-1.5 -translate-x-1/2 z-20 transition-all duration-500 animate-truck"
              style={{ left: `${truckOffset}%` }}
            >
              <div className="bg-[#003B73] text-white p-1.5 rounded-full shadow-md border-2 border-white ring-2 ring-sky-300">
                <Truck className="w-3.5 h-3.5 text-sky-300" />
              </div>
            </div>

            {/* Stepper Dots & Labels */}
            <div className="relative z-10 flex items-center justify-between">
              {steps.map((step, idx) => {
                const isPassed = item.progressPercent >= step.activePercent;
                return (
                  <div key={idx} className="flex flex-col items-center text-center max-w-[60px]">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isPassed 
                          ? 'bg-[#003B73] border-white ring-2 ring-sky-400' 
                          : 'bg-white border-slate-300 ring-2 ring-transparent'
                      }`}
                    />
                    <span className={`text-[10px] mt-2 font-bold leading-tight ${
                      isPassed ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                      {step.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Card Footer: GoPay-Styled Quick Actions */}
      <div className="p-3.5 sm:p-4 bg-slate-50/70 rounded-b-3xl border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        
        {/* WhatsApp & Call Contact */}
        <div className="flex items-center gap-1.5">
          {item.waLink ? (
            <a
              id={`wa-btn-${item.id}`}
              href={item.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold bg-[#00AA13] hover:bg-[#009110] active:scale-95 text-white rounded-2xl transition-all shadow-xs"
              title="Chat WhatsApp Customer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <span className="text-xs text-slate-400">No HP -</span>
          )}

          {item.bestPhone && item.bestPhone !== '-' && (
            <a
              href={`tel:${item.bestPhone}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-2xs"
              title="Telepon Customer"
            >
              <Phone className="w-3.5 h-3.5 text-[#003B73]" />
            </a>
          )}
        </div>

        {/* View Details & Focus Map */}
        <div className="flex items-center gap-2 ml-auto">
          {item.hasValidCoords && onFocusMap && (
            <button
              onClick={() => onFocusMap(item)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#003B73] bg-sky-50 hover:bg-sky-100 rounded-2xl border border-sky-200 transition-colors cursor-pointer"
              title="Lihat Titik Lokasi di Peta"
            >
              <MapPin className="w-3.5 h-3.5 text-[#003B73]" />
              <span className="hidden sm:inline">Peta</span>
            </button>
          )}

          <button
            id={`detail-btn-${item.id}`}
            onClick={() => onViewDetail(item)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold bg-[#003B73] hover:bg-[#002D5A] active:scale-95 text-white rounded-2xl transition-all shadow-xs cursor-pointer"
          >
            <span>Detail</span>
            <ChevronRight className="w-3.5 h-3.5 text-sky-300" />
          </button>
        </div>

      </div>
    </div>
  );
};

