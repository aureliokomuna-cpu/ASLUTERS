import Papa from 'papaparse';
import { DeliveryItem, GroupedReceipt, RawCsvRow } from '../types';
import { calculateDeliveryStatus, calculateProgress, parseDate } from './dateUtils';
import { getWhatsAppUrl, cleanPhoneNumber } from './whatsappUtils';

export const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2H8qksXso8KEbbj8vwtkJ1KOx-5COj-zzbHFchxMB0KkpyO1-ltWonXhtBfm-QazoQ-sRA2Rym-y3/pub?gid=0&single=true&output=csv';

/**
 * Format Indonesian mobile phone to international WhatsApp standard (628...)
 */
export function formatPhoneNumberForWa(phoneStr?: string): { cleanPhone: string; waUrl: string } {
  if (!phoneStr) return { cleanPhone: '-', waUrl: '' };
  const cleaned = cleanPhoneNumber(phoneStr);
  if (!cleaned) return { cleanPhone: phoneStr, waUrl: '' };
  return { cleanPhone: phoneStr.trim(), waUrl: `https://wa.me/${cleaned}` };
}

/**
 * Fetch and parse live CSV data from Google Sheets
 */
export async function fetchAndParseDeliveryData(): Promise<{
  items: DeliveryItem[];
  groupedByReceipt: Map<string, GroupedReceipt>;
  cities: string[];
  lastUpdated: Date;
}> {
  const response = await fetch(CSV_URL, {
    cache: 'no-cache', // Always fetch fresh live data
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data dari Google Sheets (${response.status} ${response.statusText})`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const rawRows = results.data;
          const items: DeliveryItem[] = [];
          const citySet = new Set<string>();

          rawRows.forEach((row, index) => {
            const receiptNo = (row.receive_no || row['receive_no'] || '').trim();
            const customerName = (row['NAMA CUSTOMER'] || row.NAMA_CUSTOMER || row.nama_customer || '').trim();
            
            // Skip totally empty ghost rows
            if (!receiptNo && !customerName && !row.notrans) {
              return;
            }

            const rawLt = (row.lt || '').trim();
            const rawLg = (row.lg || '').trim();
            const lat = parseFloat(rawLt);
            const lng = parseFloat(rawLg);
            
            // Validate coords (Indonesia is roughly Lat -11 to 6, Lng 95 to 141; Tangerang / Jabodetabek ~ -6.2, 106.6)
            const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

            const isPickupAtStore = (row.CUSTOMER_PICKUPATSTORE || '').trim() === '1';
            const cityName = (row.city_name || 'Tangerang').trim();
            if (cityName) {
              citySet.add(cityName);
            }

            const phone = (row.cust_phone || '').trim();
            const mobilePhone = (row.cust_hp || '').trim();
            const bestPhone = mobilePhone || phone || '-';
            const { waUrl } = formatPhoneNumberForWa(bestPhone);

            const transDateRaw = (row['TANGGAL TRANSAKSI'] || '').trim();
            const transDate = parseDate(transDateRaw);

            const deliveryScheduleRaw = (row.JADWAL_PENGIRIMAN || '').trim();
            const deliveryScheduleDate = parseDate(deliveryScheduleRaw);

            const installScheduleRaw = (row.JADWAL_INSTALASI || '').trim();
            const installScheduleDate = parseDate(installScheduleRaw);

            const statusInfo = calculateDeliveryStatus(installScheduleDate, installScheduleRaw);
            const progress = calculateProgress(
              statusInfo.status,
              transDate,
              deliveryScheduleDate,
              installScheduleDate
            );

            // Important: cust_fax frequently contains delivery instruction notes
            const shippingNotes = (row.cust_fax || '').trim();
            const addressNotes = (row.ADDRESS_NOTE || '').trim();

            const item: DeliveryItem = {
              id: `${receiptNo || 'REC'}-${row.install_no || index}-${index}`,
              rowIndex: index + 1,
              latitude: hasValidCoords ? lat : null,
              longitude: hasValidCoords ? lng : null,
              hasValidCoords,
              companyCode: (row.company_code || 'ALSUT').trim(),
              transactionNo: (row.notrans || '').trim(),
              receiptNo: receiptNo || 'TANPA_NO_RECEIPT',
              transactionDateRaw: transDateRaw,
              transactionDate: transDate,
              memberNo: (row['NO MEMBER'] || '').trim(),
              customerName: customerName || 'Customer Informa',
              address: (row.cust_address || 'Alamat tidak tercatat').trim(),
              cityName: cityName || 'Tangerang',
              phone,
              mobilePhone,
              bestPhone,
              waLink: '',
              shippingNotes,
              addressNotes,
              deliveryScheduleRaw,
              deliveryScheduleDate,
              installScheduleRaw,
              installScheduleDate,
              installerPoolId: (row.installer_pool_id || '-').trim(),
              installNo: (row.install_no || '-').trim(),
              isPickupAtStore,
              typeOrder: (row.type_order || '').trim(),
              deliveryId: (row.delivery_id || '').trim(),

              status: statusInfo.status,
              statusLabel: statusInfo.statusLabel,
              isUrgentTomorrow: statusInfo.isUrgentTomorrow,
              isToday: statusInfo.isToday,
              daysUntilInstall: statusInfo.daysUntilInstall,
              progressStep: progress.step,
              progressPercent: progress.percent,
            };

            // Set personalized Informa ALSUT Gen-Z friendly WhatsApp link
            item.waLink = getWhatsAppUrl(
              bestPhone, 
              item, 
              item.isUrgentTomorrow ? 'reminder_h1' : (item.isPickupAtStore ? 'pickup_store' : 'genz')
            );

            items.push(item);
          });

          // Group by receipt_no
          const groupedByReceipt = new Map<string, GroupedReceipt>();
          
          items.forEach((item) => {
            const key = item.receiptNo;
            if (!groupedByReceipt.has(key)) {
              groupedByReceipt.set(key, {
                receiptNo: item.receiptNo,
                customerName: item.customerName,
                memberNo: item.memberNo,
                address: item.address,
                cityName: item.cityName,
                bestPhone: item.bestPhone,
                waLink: item.waLink,
                isPickupAtStore: item.isPickupAtStore,
                items: [],
                overallStatus: item.status,
                nearestInstallDate: item.installScheduleDate,
                earliestDeliveryDate: item.deliveryScheduleDate,
                hasUrgentH1: item.isUrgentTomorrow,
                latitude: item.latitude,
                longitude: item.longitude,
                hasValidCoords: item.hasValidCoords,
              });
            }

            const group = groupedByReceipt.get(key)!;
            group.items.push(item);

            if (item.isUrgentTomorrow) {
              group.hasUrgentH1 = true;
            }
            if (item.hasValidCoords && !group.hasValidCoords) {
              group.latitude = item.latitude;
              group.longitude = item.longitude;
              group.hasValidCoords = true;
            }
            // Priority for overall status: IN_TRANSIT > WAITING_SCHEDULE > COMPLETED
            if (item.status === 'IN_TRANSIT') {
              group.overallStatus = 'IN_TRANSIT';
            } else if (item.status === 'WAITING_SCHEDULE' && group.overallStatus === 'COMPLETED') {
              group.overallStatus = 'WAITING_SCHEDULE';
            }
          });

          const sortedCities = Array.from(citySet).sort();

          resolve({
            items,
            groupedByReceipt,
            cities: sortedCities,
            lastUpdated: new Date(),
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
