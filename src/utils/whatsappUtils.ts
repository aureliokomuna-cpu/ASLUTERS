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

export type WaGreetingStyle = 'genz' | 'after_sales' | 'reminder_h1' | 'formal' | 'pickup_store';

/**
 * Generate friendly, professional, Gen-Z / modern WhatsApp message from Informa Living World ALSUT Sales Team
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

  if (style === 'after_sales') {
    return `Halo Kak ${customerName}! 👋✨

Salam hangat dari saya, Tim Sales di *Informa Living World Alam Sutera* 🛋️

Mau menanyakan terkait pesanan furnitur Kakak dengan No. Receipt *#${receiptNo}*, apakah barangnya sudah sampai dengan aman dan dapat digunakan dengan nyaman di rumah? 

Kepuasan Kakak adalah prioritas kami. Jika ada hal yang ingin ditanyakan, butuh panduan penggunaan, atau ada kendala apapun, silakan kabari saya langsung di sini ya Kak, saya siap bantu. 🥰

Terima kasih banyak sudah mempercayakan kebutuhan rumah Kakak di Informa Living World Alam Sutera. Have a wonderful day! ✨😊🙏`;
  }

  if (style === 'reminder_h1' || item.isUrgentTomorrow) {
    return `Halo Kak ${customerName}! 👋✨

Salam hangat dari saya, Tim Sales Kakak di *Informa Living World Alam Sutera* 🛋️

Saya mau menginfokan dan memastikan pesanan Kakak yang dijadwalkan untuk dikirim/dipasang *BESOK* ya:
🧾 *No. Receipt:* #${receiptNo}
📅 *Rencana Pengiriman:* ${deliveryDate}
🛠️ *Rencana Perakitan:* ${installDate}
📍 *Alamat:* ${address}${addressNotes}

Saya ingin memastikan proses pengantaran berjalan lancar dan produk diterima dengan aman dalam kondisi terbaik. Mohon pastikan ada yang standby di lokasi ya Kak. 

Jika ada catatan rute atau hal yang perlu saya bantu koordinasikan, feel free untuk kabari saya di chat ini ya Kak. Terima kasih banyak Kak ${customerName}! 😊🙏`;
  }

  if (style === 'formal') {
    return `Selamat pagi/siang Bapak/Ibu ${customerName},

Salam hormat dari kami, Tim Sales *Informa Living World Alam Sutera*.

Kami ingin mengonfirmasi dan memastikan kelancaran pesanan furnitur Bapak/Ibu dengan nomor transaksi *#${receiptNo}*:
- *Jadwal Pengiriman:* ${deliveryDate}
- *Jadwal Perakitan:* ${installDate}
- *Alamat Tujuan:* ${address}${addressNotes}

Kami ingin memastikan seluruh pesanan Bapak/Ibu tiba dengan aman, dalam kondisi terbaik, dan dapat digunakan dengan maksimal. Jika ada informasi atau bantuan tambahan yang dibutuhkan, mohon tidak ragu untuk menghubungi kami kembali.

Terima kasih banyak atas kepercayaan Bapak/Ibu berbelanja di Informa Living World Alam Sutera. 🙏`;
  }

  if (style === 'pickup_store' || item.isPickupAtStore) {
    return `Halo Kak ${customerName}! 👋✨

Salam hangat dari saya, Tim Sales Kakak di *Informa Living World Alam Sutera* 🛋️

Pesanan Kakak dengan No. Receipt *#${receiptNo}* sudah tercatat untuk *Ambil Sendiri di Toko (Pickup Point)* Living World Alam Sutera.

Kira-kira Kakak berencana mengambil pesanannya hari apa/jam berapa ya? Nanti saya bantu siapkan dan koordinasikan di toko agar proses pengambilan barang Kakak lebih cepat dan praktis. 

Jika ada yang perlu dibantu, langsung balas pesan ini ya Kak. Ditunggu kedatangannya di toko! ✨😊`;
  }

  // Default: Friendly Gen-Z & Attentive Sales Store Advisor
  return `Halo Kak ${customerName}! 👋✨

Salam hangat dari saya, Tim Sales Kakak di *Informa Living World Alam Sutera* 🛋️

Saya mau bantu follow up dan memastikan pesanan produk Informa pilihan Kakak berjalan lancar nih:
🧾 *No. Receipt:* #${receiptNo}
📅 *Rencana Kirim:* ${deliveryDate}
🛠️ *Rencana Pasang:* ${installDate}
📍 *Alamat Pengantaran:* ${address}${addressNotes}

Saya ingin memastikan seluruh barang Kakak sampai dengan aman, dalam kondisi prima, dan dapat digunakan sebaik mungkin di rumah. 🥰

Kalau Kakak ada titip catatan khusus, mau tanya seputar produk, atau butuh bantuan apapun, boleh banget kabari saya langsung ya Kak. 

Thank you so much sudah belanja di Informa Living World Alam Sutera, have an amazing day! ✨😊🙏`;
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
