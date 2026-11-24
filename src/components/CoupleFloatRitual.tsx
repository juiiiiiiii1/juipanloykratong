import { useRef, useState } from 'react';
import { Flame, ImagePlus, MapPin, ShoppingBag, X } from 'lucide-react';
import {
  WISH_PRESETS,
  type KrathongItem,
  type LoyKrathongLocation,
  type OrderReceipt,
} from '../data/loyKrathongData';
import {
  formatBaht,
  hasValidationErrors,
  validateCoupleWishForm,
  type CoupleWishValidationErrors,
} from '../utils/loyKrathongLogic';
import { compressCouplePhoto } from '../utils/memoryCardRenderer';

interface CoupleFloatRitualProps {
  location: LoyKrathongLocation;
  krathong: KrathongItem;
  purchasedOrder: OrderReceipt | null;
  totalEstimate: number;
  onQuickBuyAndEquip: () => void;
  onGoToShop: () => void;
  onFloatKrathong: (payload: {
    yourName: string;
    partnerName: string;
    wish: string;
    photoDataUrl?: string;
  }) => void;
}

export function CoupleFloatRitual({
  location,
  krathong,
  purchasedOrder,
  totalEstimate,
  onQuickBuyAndEquip,
  onGoToShop,
  onFloatKrathong,
}: CoupleFloatRitualProps) {
  const [yourName, setYourName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [wish, setWish] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined
  );
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [errors, setErrors] = useState<CoupleWishValidationErrors>({});
  const [justFloatedNotice, setJustFloatedNotice] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoProcessing(true);
    setErrors((prev) => ({ ...prev, photoDataUrl: undefined }));
    try {
      const compressed = await compressCouplePhoto(file);
      setPhotoDataUrl(compressed);
    } catch {
      setErrors((prev) => ({
        ...prev,
        photoDataUrl: 'ไม่สามารถใช้รูปภาพนี้ได้ กรุณาเลือกไฟล์ JPG หรือ PNG',
      }));
      setPhotoDataUrl(undefined);
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleClearPhoto = () => {
    setPhotoDataUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setJustFloatedNotice(null);

    const validation = validateCoupleWishForm({
      yourName,
      partnerName,
      wish,
      photoDataUrl,
    });
    setErrors(validation);

    if (hasValidationErrors(validation)) {
      return;
    }

    onFloatKrathong({
      yourName: yourName.trim(),
      partnerName: partnerName.trim(),
      wish: wish.trim(),
      photoDataUrl,
    });

    setJustFloatedNotice(
      `จุดเทียนและลอยกระทงของ ${yourName.trim()} & ${partnerName.trim()} ที่${location.name}แล้ว`
    );
    setWish('');
    handleClearPhoto();
    setErrors({});
  };

  return (
    <section
      id="float"
      className="mx-auto max-w-6xl border-t border-[#F5EFE6]/10 px-4 py-14 sm:px-6"
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-medium text-[#E8A838]">
          03. ศาลาอธิษฐานคืนวันเพ็ญ
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5EFE6] sm:text-3xl [text-wrap:balance]">
          เขียนคำอธิษฐานและปล่อยกระทงลงสายน้ำด้วยกัน
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
          ใส่ชื่อของคุณกับแฟน คำอวยพร และแนบรูปคู่เก็บไว้ในการ์ดความทรงจำคืนวันเพ็ญ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Current Preparation Summary */}
        <div className="space-y-4 rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] p-6 lg:col-span-5">
          <h3 className="font-display text-lg font-semibold text-[#F5EFE6]">
            สรุปรายการเตรียมลอยของคุณสองคน
          </h3>

          <div className="space-y-3 border-t border-[#F5EFE6]/10 pt-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 h-4 w-4 text-[#E8A838] shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-[#A8B7CC]">สถานที่ลอยกระทง</p>
                <p className="font-medium text-[#F5EFE6]">
                  {location.name} ({location.province})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShoppingBag
                className="mt-0.5 h-4 w-4 text-[#E8A838] shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs text-[#A8B7CC]">กระทงที่เลือก</p>
                <p className="font-medium text-[#F5EFE6]">{krathong.name}</p>
                {purchasedOrder ? (
                  <p className="mt-1 text-xs text-[#E8A838] font-mono tabular-nums">
                    ชำระแล้ว · เลขที่ {purchasedOrder.orderNumber}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[#D97B8A]">
                    ยังไม่ได้ยืนยันสั่งซื้อกระทง
                  </p>
                )}
              </div>
            </div>
          </div>

          {!purchasedOrder && (
            <div className="rounded-lg border border-[#E8A838]/30 bg-[#0C1727] p-4">
              <p className="text-xs leading-relaxed text-[#F5EFE6]">
                กรุณายืนยันสั่งซื้อกระทงก่อนจุดเทียนลอย หรือกดสั่งซื้อกระทงที่เลือกอยู่ตอนนี้ได้ทันที
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onQuickBuyAndEquip}
                  className="rounded-lg bg-[#E8A838] px-3.5 py-2 text-xs font-semibold text-[#08111E] hover:bg-[#F2BA54] transition-colors cursor-pointer"
                >
                  สั่งซื้อกระทงนี้เลย ({formatBaht(totalEstimate)})
                </button>
                <button
                  type="button"
                  onClick={onGoToShop}
                  className="rounded-lg border border-[#F5EFE6]/15 bg-[#15253C] px-3.5 py-2 text-xs font-medium text-[#F5EFE6] hover:bg-[#1E3352] transition-colors cursor-pointer"
                >
                  กลับไปเลือกแบบอื่น
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Couple Wish Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] p-6 lg:col-span-7"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="your-name"
                className="block text-sm font-medium text-[#F5EFE6]"
              >
                ชื่อของคุณ
              </label>
              <input
                id="your-name"
                name="yourName"
                type="text"
                value={yourName}
                onChange={(e) => {
                  setYourName(e.target.value);
                  if (errors.yourName) {
                    setErrors((prev) => ({ ...prev, yourName: undefined }));
                  }
                }}
                placeholder="เช่น จุ้ย"
                aria-invalid={Boolean(errors.yourName)}
                className="mt-2 w-full rounded-lg border border-[#F5EFE6]/15 bg-[#08111E] px-3.5 py-2.5 text-sm text-[#F5EFE6] placeholder:text-[#6C7F99] focus:border-[#E8A838] focus:outline-none"
              />
              {errors.yourName && (
                <p role="alert" className="mt-1.5 text-xs text-[#F28B99]">
                  {errors.yourName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="partner-name"
                className="block text-sm font-medium text-[#F5EFE6]"
              >
                ชื่อคนข้างๆ (แฟน)
              </label>
              <input
                id="partner-name"
                name="partnerName"
                type="text"
                value={partnerName}
                onChange={(e) => {
                  setPartnerName(e.target.value);
                  if (errors.partnerName) {
                    setErrors((prev) => ({ ...prev, partnerName: undefined }));
                  }
                }}
                placeholder="เช่น แพน"
                aria-invalid={Boolean(errors.partnerName)}
                className="mt-2 w-full rounded-lg border border-[#F5EFE6]/15 bg-[#08111E] px-3.5 py-2.5 text-sm text-[#F5EFE6] placeholder:text-[#6C7F99] focus:border-[#E8A838] focus:outline-none"
              />
              {errors.partnerName && (
                <p role="alert" className="mt-1.5 text-xs text-[#F28B99]">
                  {errors.partnerName}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="couple-wish"
                className="block text-sm font-medium text-[#F5EFE6]"
              >
                คำอธิษฐานคู่ในคืนวันเพ็ญ
              </label>
              <span className="text-xs text-[#A8B7CC]">
                เลือกข้อความแนะนำด้านล่างได้
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {WISH_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setWish(preset);
                    if (errors.wish) {
                      setErrors((prev) => ({ ...prev, wish: undefined }));
                    }
                  }}
                  className="rounded-md border border-[#F5EFE6]/12 bg-[#15253C] px-2.5 py-1.5 text-left text-xs text-[#A8B7CC] hover:border-[#E8A838]/50 hover:text-[#F5EFE6] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              id="couple-wish"
              name="wish"
              rows={3}
              value={wish}
              onChange={(e) => {
                setWish(e.target.value);
                if (errors.wish) {
                  setErrors((prev) => ({ ...prev, wish: undefined }));
                }
              }}
              placeholder="เขียนคำอธิษฐานสำหรับความรักและความสุขของเราสองคน..."
              aria-invalid={Boolean(errors.wish)}
              className="mt-3 w-full rounded-lg border border-[#F5EFE6]/15 bg-[#08111E] px-3.5 py-2.5 text-sm leading-relaxed text-[#F5EFE6] placeholder:text-[#6C7F99] focus:border-[#E8A838] focus:outline-none"
            />
            {errors.wish && (
              <p role="alert" className="mt-1.5 text-xs text-[#F28B99]">
                {errors.wish}
              </p>
            )}
          </div>

          {/* Optional Couple Photo Upload */}
          <div className="mt-5 border-t border-[#F5EFE6]/10 pt-5">
            <label
              htmlFor="couple-photo-input"
              className="block text-sm font-medium text-[#F5EFE6]"
            >
              แนบรูปคู่ของเราไว้ในการ์ดความทรงจำ (ไม่บังคับ)
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                id="couple-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoProcessing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#F5EFE6]/15 bg-[#15253C] px-3.5 py-2 text-xs font-medium text-[#F5EFE6] hover:bg-[#1E3352] transition-colors cursor-pointer"
              >
                <ImagePlus className="h-4 w-4 text-[#E8A838]" aria-hidden="true" />
                <span>
                  {photoProcessing
                    ? 'กำลังย่อขนาดรูป...'
                    : photoDataUrl
                    ? 'เปลี่ยนรูปคู่'
                    : 'เลือกรูปคู่จากเครื่อง'}
                </span>
              </button>

              {photoDataUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={photoDataUrl}
                    alt="ตัวอย่างรูปคู่ที่แนบ"
                    className="h-11 w-11 rounded-lg border border-[#E8A838]/40 object-cover"
                  />
                  <button
                    type="button"
                    aria-label="ลบรูปคู่ที่แนบ"
                    onClick={handleClearPhoto}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#A8B7CC] hover:text-[#F28B99] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>นำรูปออก</span>
                  </button>
                </div>
              )}
            </div>
            {errors.photoDataUrl && (
              <p role="alert" className="mt-1.5 text-xs text-[#F28B99]">
                {errors.photoDataUrl}
              </p>
            )}
          </div>

          {justFloatedNotice && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-[#E8A838]/40 bg-[#0C1727] px-4 py-3 text-sm text-[#F5EFE6]"
            >
              {justFloatedNotice}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#A8B7CC]">
              {purchasedOrder
                ? `พร้อมลอยด้วย ${purchasedOrder.krathongName}`
                : 'หากยังไม่ได้สั่งซื้อ ระบบจะขอให้สั่งซื้อกระทงก่อนปล่อยลงน้ำ'}
            </p>

            <button
              type="submit"
              disabled={!purchasedOrder}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8A838] px-5 py-3 text-sm font-semibold text-[#08111E] hover:bg-[#F2BA54] disabled:cursor-not-allowed disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
            >
              <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>จุดเทียนและลอยกระทงคู่กัน</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
