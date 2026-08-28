import { DeliveryItem } from '../types';
import { formatIndonesianDate } from './dateUtils';

/**
 * Format phone string to valid 628... WhatsApp format
 */
export function cleanPhoneNumber(phoneStr?: string): string {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/[^0-9+]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export type WaGreetingStyle = 'genz' | 'formal' | 'reminder_h1' | 'pickup_store';

/**
 * Generate friendly, professional, Gen-Z / modern WhatsApp message
 */
export function generateWhatsAppMessage(
  item: Partial<DeliveryItem>,
  style: WaGreetingStyle = 'genz'
): string {
  const rawName = (item.customerName || '').trim();
  // Capitalize nicely
  const customerName = rawName
    ? rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Kakak';

  const receiptNo = item.receiptNo || '-';
  const deliveryDate = item.deliveryScheduleRaw || (item.deliveryScheduleDate ? formatIndonesianDate(item.deliveryScheduleDate) : '-');
  const installDate = item.installScheduleRaw || (item.installScheduleDate ? formatIndonesianDate(item.installScheduleDate) : '-');
  const address = item.address || '-';
  const addressNotes = item.addressNotes ? ` (Patokan: ${item.addressNotes})` : '';

  if (style === 'reminder_h1' || item.isUrgentTomorrow) {
    return `Halo Kak ${customerName}! 👋✨

Salam hangat dari Tim Delivery & Instalasi *Informa Living World Alam Sutera* 🛋️🚚

Mau menginfokan nih Kak, pesanan furnitur Informa Kakak dijadwalkan untuk dikirim/dipasang *BESOK* ya:
🧾 *No. Receipt:* #${receiptNo}
📅 *Jadwal Pengiriman:* ${deliveryDate}
🛠️ *Jadwal Instalasi:* ${installDate}
📍 *Alamat:* ${address}${addressNotes}

Mohon pastikan ada yang standby di lokasi ya Kak. Kalau ada request jam pengiriman atau patokan lokasi tambahan, feel free untuk kabari kami di sini ya. 

Terima kasih banyak Kak ${customerName}, have a wonderful day! 😊🙏`;
  }

  if (style === 'formal') {
    return `Selamat pagi/siang Bapak/Ibu ${customerName},

Perkenalkan kami dari Tim Logistik & Pengiriman *Informa Living World Alam Sutera*.

Sehubungan dengan pesanan Bapak/Ibu dengan nomor transaksi *#${receiptNo}*, kami ingin mengonfirmasi jadwal pengiriman dan instalasi:
- *Jadwal Kirim:* ${deliveryDate}
- *Jadwal Pasang:* ${installDate}
- *Alamat Tujuan:* ${address}${addressNotes}

Apakah jadwal serta alamat pengiriman tersebut sudah sesuai? Mohon konfirmasinya agar tim armada kami dapat mempersiapkan pengiriman dengan lancar.

Terima kasih atas kepercayaan Bapak/Ibu berbelanja di Informa Living World Alam Sutera. 🙏`;
  }

  if (style === 'pickup_store' || item.isPickupAtStore) {
    return `Halo Kak ${customerName}! 👋✨

Salam hangat dari Tim Customer Care & Logistik *Informa Living World Alam Sutera* 🛋️

Pesanan Kakak dengan No. Receipt *#${receiptNo}* tercatat untuk *Ambil Sendiri di Toko (Pickup Store)* di Informa Living World Alam Sutera.

Apakah Kakak berencana mengambil pesanan hari ini? Tim kami siap membantu menyiapkan barang Kakak di Pick-up Point Toko. 

Kalau butuh info lebih lanjut, langsung balas chat ini ya Kak. Thank you and stay fabulous! ✨😊`;
  }

  // Default: Friendly Gen-Z & Professional Informa Living World ALSUT
  return `Halo Kak ${customerName}! 👋✨

Salam hangat dari Tim Delivery & Instalasi *Informa Living World Alam Sutera* 🛋️

Kami mau konfirmasi terkait pengiriman produk Informa pilihan Kakak nih:
🧾 *No. Receipt:* #${receiptNo}
📅 *Jadwal Pengiriman:* ${deliveryDate}
🛠️ *Jadwal Instalasi:* ${installDate}
📍 *Alamat Pengantaran:* ${address}${addressNotes}

Apakah jadwal dan alamat di atas sudah aman dan cocok untuk Kakak? 

Kalau ada catatan khusus atau patokan jalan tambahan, boleh banget di-reply ya Kak. Thank you so much and have an amazing day! 😊🙏✨`;
}

/**
 * Generate direct WhatsApp URL with custom message
 */
export function getWhatsAppUrl(
  phoneStr?: string,
  item?: Partial<DeliveryItem>,
  style: WaGreetingStyle = 'genz'
): string {
  const cleaned = cleanPhoneNumber(phoneStr);
  if (!cleaned) return '';

  const message = item ? generateWhatsAppMessage(item, style) : 'Halo Kak, salam dari Tim Informa Living World Alam Sutera.';
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
