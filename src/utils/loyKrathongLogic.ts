import {
  COUPLE_FORTUNES,
  KRATHONG_ADDONS,
  KRATHONG_ITEMS,
  LOY_KRATHONG_LOCATIONS,
  type CoupleFortune,
  type FloatedKrathong,
  type KrathongAddon,
  type KrathongCategory,
  type KrathongItem,
  type LocationId,
  type LoyKrathongLocation,
  type OrderReceipt,
} from '../data/loyKrathongData';

export interface CoupleWishInput {
  yourName: string;
  partnerName: string;
  wish: string;
  photoDataUrl?: string;
}

export interface CoupleWishValidationErrors {
  yourName?: string;
  partnerName?: string;
  wish?: string;
  photoDataUrl?: string;
}

export interface OrderSummary {
  unitPrice: number;
  quantity: number;
  krathongSubtotal: number;
  addonsSubtotal: number;
  totalAmount: number;
  selectedAddons: KrathongAddon[];
}

export const DEFAULT_ROOM_ID = 'jui-pan';
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{2,32}$/;
const PHOTO_DATA_URL_PATTERN =
  /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO_DATA_URL_LENGTH = 360_000;

export function sanitizeRoomId(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_ROOM_ID;
  const trimmed = raw.trim();
  if (!ROOM_ID_PATTERN.test(trimmed)) {
    return DEFAULT_ROOM_ID;
  }
  return trimmed;
}

export function generateNewRoomId(): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `juipan-${rand}`;
}

export function validatePhotoDataUrl(
  url: string | undefined
): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_PHOTO_DATA_URL_LENGTH) {
    return undefined;
  }
  if (!PHOTO_DATA_URL_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function filterKrathongsByCategory(
  items: KrathongItem[],
  category: KrathongCategory
): KrathongItem[] {
  if (category === 'all') {
    return items;
  }
  return items.filter((item) => item.category === category);
}

export function calculateOrderSummary(
  krathong: KrathongItem | undefined,
  quantity: number,
  selectedAddonIds: string[],
  addonsCatalog: KrathongAddon[] = KRATHONG_ADDONS
): OrderSummary {
  const safeQty = Math.max(1, Math.min(10, Math.floor(quantity || 1)));
  const unitPrice = krathong ? krathong.price : 0;
  const krathongSubtotal = unitPrice * safeQty;
  const selectedAddons = addonsCatalog.filter((addon) =>
    selectedAddonIds.includes(addon.id)
  );
  const addonsSubtotal = selectedAddons.reduce(
    (sum, addon) => sum + addon.price,
    0
  );

  return {
    unitPrice,
    quantity: safeQty,
    krathongSubtotal,
    addonsSubtotal,
    totalAmount: krathongSubtotal + addonsSubtotal,
    selectedAddons,
  };
}

export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`;
}

export function generateOrderNumber(now: Date = new Date()): string {
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `LK-2569-${mins}${secs}-${suffix}`;
}

export function createOrderReceipt(
  krathong: KrathongItem,
  quantity: number,
  selectedAddonIds: string[],
  now: Date = new Date()
): OrderReceipt {
  const summary = calculateOrderSummary(krathong, quantity, selectedAddonIds);
  return {
    orderNumber: generateOrderNumber(now),
    krathongId: krathong.id,
    krathongName: krathong.name,
    quantity: summary.quantity,
    addonIds: summary.selectedAddons.map((a) => a.id),
    totalAmount: summary.totalAmount,
    purchasedAt: now.toISOString(),
  };
}

export function validateCoupleWishForm(
  input: CoupleWishInput
): CoupleWishValidationErrors {
  const errors: CoupleWishValidationErrors = {};

  if (!input.yourName.trim()) {
    errors.yourName = 'กรุณากรอกชื่อของคุณ';
  } else if (input.yourName.trim().length > 40) {
    errors.yourName = 'ชื่อยาวเกิน 40 ตัวอักษร';
  }

  if (!input.partnerName.trim()) {
    errors.partnerName = 'กรุณากรอกชื่อคนข้างๆ (แฟน)';
  } else if (input.partnerName.trim().length > 40) {
    errors.partnerName = 'ชื่อยาวเกิน 40 ตัวอักษร';
  }

  if (!input.wish.trim()) {
    errors.wish = 'กรุณาเขียนคำอธิษฐานก่อนจุดเทียนลอยกระทง';
  } else if (input.wish.trim().length < 4) {
    errors.wish = 'กรุณาเขียนคำอธิษฐานอย่างน้อย 4 ตัวอักษร';
  } else if (input.wish.trim().length > 300) {
    errors.wish = 'คำอธิษฐานยาวเกิน 300 ตัวอักษร';
  }

  if (input.photoDataUrl && !validatePhotoDataUrl(input.photoDataUrl)) {
    errors.photoDataUrl = 'ไฟล์รูปภาพไม่ถูกต้องหรือมีขนาดใหญ่เกินไป';
  }

  return errors;
}

export function hasValidationErrors(
  errors: CoupleWishValidationErrors
): boolean {
  return Boolean(
    errors.yourName || errors.partnerName || errors.wish || errors.photoDataUrl
  );
}

export function createFloatedKrathong(params: {
  input: CoupleWishInput;
  krathong: KrathongItem;
  location: LoyKrathongLocation;
  addonIds: string[];
  existingCount: number;
  now?: Date;
}): FloatedKrathong {
  const now = params.now ?? new Date();
  const addonNames = KRATHONG_ADDONS.filter((a) =>
    params.addonIds.includes(a.id)
  ).map((a) => a.name);

  const laneSlot = (params.existingCount % 5) * 0.095;
  const laneRatio = Number((0.36 + laneSlot).toFixed(3));
  const safePhoto = validatePhotoDataUrl(params.input.photoDataUrl);

  return {
    id: `user-${now.getTime()}-${Math.floor(Math.random() * 1000)}`,
    yourName: params.input.yourName.trim().slice(0, 40),
    partnerName: params.input.partnerName.trim().slice(0, 40),
    wish: params.input.wish.trim().slice(0, 300),
    krathongId: params.krathong.id,
    krathongName: params.krathong.name,
    visualStyle: params.krathong.visualStyle,
    candleCount: params.krathong.candleCount,
    locationId: params.location.id,
    locationName: params.location.name,
    addonNames,
    ...(safePhoto ? { photoDataUrl: safePhoto } : {}),
    floatedAt: now.toISOString(),
    isUserCreated: true,
    laneRatio,
    initialXRatio: 0.22 + ((params.existingCount * 0.19) % 0.55),
    speed: 12 + (params.existingCount % 3) * 2.5,
  };
}

export function drawCoupleFortune(
  previousId: number | null,
  fortunes: CoupleFortune[] = COUPLE_FORTUNES
): CoupleFortune {
  const pool =
    fortunes.length > 1 && previousId !== null
      ? fortunes.filter((f) => f.id !== previousId)
      : fortunes;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? fortunes[0];
}

export function calculateDaysTogether(
  anniversaryDate: string | null,
  referenceDate: Date = new Date()
): number | null {
  if (!anniversaryDate || !/^\d{4}-\d{2}-\d{2}$/.test(anniversaryDate)) {
    return null;
  }
  const [y, m, d] = anniversaryDate.split('-').map(Number);
  const startUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  if (Number.isNaN(startUtc) || todayUtc < startUtc) {
    return null;
  }
  return Math.floor((todayUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
}

export function getMemoryArchiveStats(krathongs: FloatedKrathong[]) {
  const uniqueLocations = new Set(krathongs.map((k) => k.locationId)).size;
  const years = Array.from(
    new Set(
      krathongs.map((k) => {
        const year = new Date(k.floatedAt).getFullYear();
        return Number.isNaN(year) ? 2569 : year + 543;
      })
    )
  ).sort((a, b) => b - a);

  return {
    totalKrathongs: krathongs.length,
    uniqueLocations,
    years,
  };
}

export interface PersistedLoyKrathongState {
  selectedLocationId: LocationId;
  selectedKrathongId: string;
  purchasedOrder: OrderReceipt | null;
  floatedKrathongs: FloatedKrathong[];
}

export const STORAGE_KEY = 'juipan_loy_krathong_v3';

export function getDefaultPersistedState(): PersistedLoyKrathongState {
  return {
    selectedLocationId: LOY_KRATHONG_LOCATIONS[0].id,
    selectedKrathongId: KRATHONG_ITEMS[0].id,
    purchasedOrder: null,
    floatedKrathongs: [],
  };
}

export function parsePersistedState(
  raw: string | null
): PersistedLoyKrathongState {
  const fallback = getDefaultPersistedState();
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedLoyKrathongState>;
    const validLocation = LOY_KRATHONG_LOCATIONS.some(
      (loc) => loc.id === parsed.selectedLocationId
    );
    const validKrathong = KRATHONG_ITEMS.some(
      (item) => item.id === parsed.selectedKrathongId
    );
    const floated = Array.isArray(parsed.floatedKrathongs)
      ? parsed.floatedKrathongs.filter(
          (k) =>
            k &&
            k.isUserCreated === true &&
            typeof k.id === 'string' &&
            typeof k.yourName === 'string' &&
            typeof k.partnerName === 'string' &&
            typeof k.wish === 'string'
        )
      : [];

    return {
      selectedLocationId: validLocation
        ? (parsed.selectedLocationId as LocationId)
        : fallback.selectedLocationId,
      selectedKrathongId: validKrathong
        ? (parsed.selectedKrathongId as string)
        : fallback.selectedKrathongId,
      purchasedOrder: parsed.purchasedOrder ?? null,
      floatedKrathongs: floated,
    };
  } catch {
    return fallback;
  }
}

export function formatThaiTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    });
  } catch {
    return '--:--';
  }
}

export function formatThaiDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Bangkok',
    });
  } catch {
    return '';
  }
}
