import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUPLE_FORTUNES,
  KRATHONG_ITEMS,
  LOY_KRATHONG_LOCATIONS,
} from '../data/loyKrathongData';
import {
  calculateDaysTogether,
  calculateOrderSummary,
  createFloatedKrathong,
  createOrderReceipt,
  drawCoupleFortune,
  filterKrathongsByCategory,
  formatBaht,
  formatThaiTime,
  generateNewRoomId,
  getMemoryArchiveStats,
  hasValidationErrors,
  parsePersistedState,
  sanitizeRoomId,
  validateCoupleWishForm,
  validatePhotoDataUrl,
} from './loyKrathongLogic';

test('LOY_KRATHONG_LOCATIONS includes Tha Maharaj, Ratchaburi River, Wat Huai Chinsi, and Rama VIII Bridge', () => {
  const ids = LOY_KRATHONG_LOCATIONS.map((loc) => loc.id);
  assert.deepEqual(ids, [
    'chao-phraya',
    'ratchaburi-river',
    'wat-huai-chinsi',
    'rama8-bridge',
  ]);
});

test('filterKrathongsByCategory returns all items or filtered category', () => {
  const all = filterKrathongsByCategory(KRATHONG_ITEMS, 'all');
  assert.equal(all.length, KRATHONG_ITEMS.length);

  const eco = filterKrathongsByCategory(KRATHONG_ITEMS, 'eco');
  assert.equal(eco.length, 2);
  assert.ok(eco.every((item) => item.category === 'eco'));

  const couple = filterKrathongsByCategory(KRATHONG_ITEMS, 'couple');
  assert.equal(couple.length, 1);
  assert.equal(couple[0].id, 'krathong-coconut-lotus');
});

test('calculateOrderSummary computes krathong subtotal, addons, and total accurately', () => {
  const coconutKrathong = KRATHONG_ITEMS[0]; // 89 THB
  const summary = calculateOrderSummary(coconutKrathong, 2, [
    'addon-twin-candle', // 29 THB
    'addon-rose-petals', // 35 THB
  ]);

  assert.equal(summary.quantity, 2);
  assert.equal(summary.krathongSubtotal, 178);
  assert.equal(summary.addonsSubtotal, 64);
  assert.equal(summary.totalAmount, 242);
  assert.equal(formatBaht(summary.totalAmount), '฿242');
});

test('calculateOrderSummary clamps quantity between 1 and 10', () => {
  const krathong = KRATHONG_ITEMS[1];
  const minQty = calculateOrderSummary(krathong, 0, []);
  assert.equal(minQty.quantity, 1);

  const maxQty = calculateOrderSummary(krathong, 99, []);
  assert.equal(maxQty.quantity, 10);
});

test('createOrderReceipt builds receipt with valid order number prefix and amount', () => {
  const krathong = KRATHONG_ITEMS[2]; // 59 THB
  const receipt = createOrderReceipt(krathong, 1, ['addon-lucky-coin']); // +19 THB
  assert.match(receipt.orderNumber, /^LK-2569-\d{4}-\d{3}$/);
  assert.equal(receipt.totalAmount, 78);
  assert.equal(receipt.krathongId, krathong.id);
});

test('validateCoupleWishForm catches empty inputs, short wishes, and invalid photo URLs', () => {
  const emptyErrors = validateCoupleWishForm({
    yourName: '   ',
    partnerName: '',
    wish: '',
  });
  assert.equal(hasValidationErrors(emptyErrors), true);
  assert.ok(emptyErrors.yourName);
  assert.ok(emptyErrors.partnerName);
  assert.ok(emptyErrors.wish);

  const badPhoto = validateCoupleWishForm({
    yourName: 'จุ้ย',
    partnerName: 'แพน',
    wish: 'ขอให้รักกันนานๆ',
    photoDataUrl: 'javascript:alert(1)',
  });
  assert.equal(hasValidationErrors(badPhoto), true);
  assert.ok(badPhoto.photoDataUrl);

  const valid = validateCoupleWishForm({
    yourName: 'จุ้ย',
    partnerName: 'แพน',
    wish: 'ขอให้รักกันนานๆ และมีความสุขทุกวัน',
    photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
  });
  assert.equal(hasValidationErrors(valid), false);
});

test('sanitizeRoomId blocks traversal and invalid characters', () => {
  assert.equal(sanitizeRoomId('jui-pan-2026'), 'jui-pan-2026');
  assert.equal(sanitizeRoomId('../etc/passwd'), 'jui-pan');
  assert.equal(sanitizeRoomId('a'), 'jui-pan');
  assert.equal(sanitizeRoomId(null), 'jui-pan');
  assert.match(generateNewRoomId(), /^juipan-[a-z0-9]{4}$/);
});

test('validatePhotoDataUrl accepts valid base64 image URLs and rejects SVG/script schemes', () => {
  assert.equal(
    validatePhotoDataUrl('data:image/png;base64,iVBORw0KGgo='),
    'data:image/png;base64,iVBORw0KGgo='
  );
  assert.equal(
    validatePhotoDataUrl('data:image/svg+xml;base64,PHN2Zz4='),
    undefined
  );
  assert.equal(validatePhotoDataUrl('https://evil.example/a.jpg'), undefined);
});

test('drawCoupleFortune avoids immediate repeat and returns valid fortune', () => {
  const picked = drawCoupleFortune(1, COUPLE_FORTUNES);
  assert.notEqual(picked.id, 1);
  assert.ok(picked.prediction.length > 0);
});

test('calculateDaysTogether computes inclusive days from anniversary date', () => {
  const ref = new Date(2026, 10, 24); // Nov 24, 2026
  assert.equal(calculateDaysTogether('2026-11-24', ref), 1);
  assert.equal(calculateDaysTogether('2025-11-24', ref), 366);
  assert.equal(calculateDaysTogether('2027-01-01', ref), null);
  assert.equal(calculateDaysTogether('invalid', ref), null);
});

test('getMemoryArchiveStats summarizes krathong count, locations, and Buddhist years', () => {
  const k1 = createFloatedKrathong({
    input: { yourName: 'จุ้ย', partnerName: 'แพน', wish: 'ขอให้มีความสุข' },
    krathong: KRATHONG_ITEMS[0],
    location: LOY_KRATHONG_LOCATIONS[0],
    addonIds: [],
    existingCount: 0,
    now: new Date('2026-11-24T19:00:00+07:00'),
  });
  const k2 = createFloatedKrathong({
    input: { yourName: 'จุ้ย', partnerName: 'แพน', wish: 'รักกันนานๆ นะ' },
    krathong: KRATHONG_ITEMS[1],
    location: LOY_KRATHONG_LOCATIONS[2],
    addonIds: [],
    existingCount: 1,
    now: new Date('2025-11-05T20:00:00+07:00'),
  });

  const stats = getMemoryArchiveStats([k1, k2]);
  assert.equal(stats.totalKrathongs, 2);
  assert.equal(stats.uniqueLocations, 2);
  assert.deepEqual(stats.years, [2569, 2568]);
});

test('parsePersistedState defaults to empty floatedKrathongs (no strangers names) and falls back safely', () => {
  const fallback = parsePersistedState('{broken-json');
  assert.equal(fallback.selectedLocationId, 'chao-phraya');
  assert.equal(fallback.floatedKrathongs.length, 0);
});

test('formatThaiTime renders Asia/Bangkok evening time regardless of host timezone', () => {
  assert.equal(formatThaiTime('2026-11-24T19:15:00+07:00'), '19:15');
});
