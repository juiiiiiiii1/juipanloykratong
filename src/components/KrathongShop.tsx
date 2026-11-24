import { useMemo, useState } from 'react';
import { Check, Flame, Minus, Plus, ShoppingBag } from 'lucide-react';
import type {
  KrathongAddon,
  KrathongCategory,
  KrathongItem,
  OrderReceipt,
} from '../data/loyKrathongData';
import {
  calculateOrderSummary,
  filterKrathongsByCategory,
  formatBaht,
} from '../utils/loyKrathongLogic';

interface KrathongShopProps {
  items: KrathongItem[];
  addons: KrathongAddon[];
  selectedKrathongId: string;
  quantity: number;
  selectedAddonIds: string[];
  purchasedOrder: OrderReceipt | null;
  onSelectKrathong: (id: string) => void;
  onChangeQuantity: (nextQty: number) => void;
  onToggleAddon: (addonId: string) => void;
  onConfirmPurchase: () => void;
  onProceedToFloat: () => void;
}

const CATEGORY_TABS: Array<{ id: KrathongCategory; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'couple', label: 'คู่รักพิเศษ' },
  { id: 'traditional', label: 'ใบตองดอกไม้สด' },
  { id: 'eco', label: 'รักษ์โลก' },
];

export function KrathongShop({
  items,
  addons,
  selectedKrathongId,
  quantity,
  selectedAddonIds,
  purchasedOrder,
  onSelectKrathong,
  onChangeQuantity,
  onToggleAddon,
  onConfirmPurchase,
  onProceedToFloat,
}: KrathongShopProps) {
  const [activeCategory, setActiveCategory] = useState<KrathongCategory>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(
    () => filterKrathongsByCategory(items, activeCategory),
    [items, activeCategory]
  );

  const selectedKrathong = useMemo(
    () => items.find((item) => item.id === selectedKrathongId) ?? items[0],
    [items, selectedKrathongId]
  );

  const summary = useMemo(
    () =>
      calculateOrderSummary(
        selectedKrathong,
        quantity,
        selectedAddonIds,
        addons
      ),
    [selectedKrathong, quantity, selectedAddonIds, addons]
  );

  const isCurrentSelectionPurchased = Boolean(
    purchasedOrder &&
      purchasedOrder.krathongId === selectedKrathong.id &&
      purchasedOrder.quantity === summary.quantity &&
      purchasedOrder.totalAmount === summary.totalAmount
  );

  return (
    <section
      id="shop"
      className="mx-auto max-w-6xl border-t border-[#F5EFE6]/10 px-4 py-14 sm:px-6"
    >
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-medium text-[#E8A838]">
            02. ร้านกระทงแฮนด์เมดคืนวันเพ็ญ
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5EFE6] sm:text-3xl [text-wrap:balance]">
            เลือกซื้อกระทงและเครื่องเคียงคู่รัก
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
            เลือกแบบกระทงที่ถูกใจ เพิ่มเครื่องเคียงมงคล แล้วกดยืนยันคำสั่งซื้อเพื่อนำกระทงไปจุดเทียนลอยด้วยกัน
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="หมวดหมู่กระทง"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#F5EFE6]/10 bg-[#101D30] p-1"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838] ${
                  isActive
                    ? 'bg-[#E8A838] text-[#08111E]'
                    : 'text-[#A8B7CC] hover:text-[#F5EFE6]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-8">
          {filteredItems.map((item) => {
            const isSelected = item.id === selectedKrathong.id;
            const hasFailed = Boolean(failedImages[item.id]);

            return (
              <article
                key={item.id}
                className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                  isSelected
                    ? 'border-[#E8A838] bg-[#132238]'
                    : 'border-[#F5EFE6]/10 bg-[#101D30] hover:border-[#F5EFE6]/25'
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#0A1423]">
                  {hasFailed ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#162742] to-[#08111E] p-6 text-center">
                      <Flame className="h-7 w-7 text-[#E8A838]" aria-hidden="true" />
                      <span className="font-display text-base font-medium text-[#F5EFE6]">
                        {item.name}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [item.id]: true,
                        }))
                      }
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#A8B7CC]">
                      <span>
                        {item.categoryLabel} · เทียน {item.candleCount} เล่ม
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-[#F5EFE6]">
                        {formatBaht(item.price)}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-base font-semibold text-[#F5EFE6]">
                      {item.name}
                    </h3>

                    <p className="mt-1.5 text-xs text-[#E8A838]">
                      {item.material}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[#F5EFE6]/10 pt-4">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectKrathong(item.id)}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838] ${
                        isSelected
                          ? 'bg-[#E8A838] text-[#08111E]'
                          : 'bg-[#182B47] text-[#F5EFE6] hover:bg-[#223B5E]'
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isSelected ? 'เลือกกระทงนี้แล้ว' : 'เลือกซื้อกระทงนี้'}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Contiguous Purchase & Checkout Module */}
        <aside
          aria-label="สรุปคำสั่งซื้อกระทง"
          className="rounded-xl border border-[#F5EFE6]/12 bg-[#101D30] p-5 lg:col-span-4 lg:sticky lg:top-24"
        >
          <div className="flex items-center justify-between border-b border-[#F5EFE6]/10 pb-4">
            <h3 className="font-display text-lg font-semibold text-[#F5EFE6]">
              ตะกร้าเตรียมลอย
            </h3>
            <ShoppingBag className="h-4 w-4 text-[#E8A838]" aria-hidden="true" />
          </div>

          {/* Selected Item & Quantity Stepper */}
          <div className="mt-4 flex items-start justify-between gap-3 border-b border-[#F5EFE6]/10 pb-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F5EFE6]">
                {selectedKrathong.name}
              </p>
              <p className="mt-0.5 text-xs text-[#A8B7CC] tabular-nums">
                {formatBaht(selectedKrathong.price)} ต่อใบ
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="ลดจำนวนกระทง"
                onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#F5EFE6]/15 bg-[#15253C] text-[#F5EFE6] hover:bg-[#1E3352] disabled:opacity-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span
                data-testid="krathong-quantity"
                className="w-6 text-center font-mono text-sm font-medium tabular-nums text-[#F5EFE6]"
              >
                {summary.quantity}
              </span>
              <button
                type="button"
                aria-label="เพิ่มจำนวนกระทง"
                onClick={() => onChangeQuantity(Math.min(10, quantity + 1))}
                disabled={quantity >= 10}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#F5EFE6]/15 bg-[#15253C] text-[#F5EFE6] hover:bg-[#1E3352] disabled:opacity-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Add-ons Checklist */}
          <div className="mt-4 border-b border-[#F5EFE6]/10 pb-4">
            <p className="mb-3 text-xs font-medium text-[#A8B7CC]">
              เพิ่มเครื่องเคียงคู่รัก (เลือกได้มากกว่า 1)
            </p>
            <div className="space-y-2.5">
              {addons.map((addon) => {
                const checked = selectedAddonIds.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-[#F5EFE6]/8 bg-[#0C1727] p-3 hover:border-[#F5EFE6]/20"
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleAddon(addon.id)}
                        className="mt-0.5 h-4 w-4 accent-[#E8A838] cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-medium text-[#F5EFE6]">
                          {addon.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#A8B7CC]">
                          {addon.description}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-medium tabular-nums text-[#E8A838] shrink-0">
                      +{formatBaht(addon.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Itemized Totals */}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-[#A8B7CC]">
              <dt>ค่ากระทง ({summary.quantity} ใบ)</dt>
              <dd className="font-mono tabular-nums text-[#F5EFE6]">
                {formatBaht(summary.krathongSubtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between text-[#A8B7CC]">
              <dt>เครื่องเคียงเสริม ({summary.selectedAddons.length} รายการ)</dt>
              <dd className="font-mono tabular-nums text-[#F5EFE6]">
                {formatBaht(summary.addonsSubtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-[#F5EFE6]/10 pt-3 text-base font-semibold text-[#F5EFE6]">
              <dt>ยอดรวมสุทธิ</dt>
              <dd
                data-testid="order-total"
                className="font-mono tabular-nums text-[#E8A838]"
              >
                {formatBaht(summary.totalAmount)}
              </dd>
            </div>
          </dl>

          {/* Checkout Action & Receipt Confirmation */}
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={onConfirmPurchase}
              className="w-full rounded-lg bg-[#E8A838] px-4 py-3 text-sm font-semibold text-[#08111E] hover:bg-[#F2BA54] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
            >
              {isCurrentSelectionPurchased
                ? 'อัปเดตคำสั่งซื้อสำเร็จแล้ว'
                : 'ยืนยันสั่งซื้อกระทง'}
            </button>

            {purchasedOrder && (
              <div
                data-testid="order-receipt"
                className="rounded-lg border border-[#E8A838]/35 bg-[#0C1727] p-3.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 text-[#E8A838]">
                  <span className="font-semibold">
                    สั่งซื้อสำเร็จ · พร้อมนำไปลอย
                  </span>
                  <span className="font-mono tabular-nums">
                    {purchasedOrder.orderNumber}
                  </span>
                </div>
                <p className="mt-1 text-[#A8B7CC]">
                  {purchasedOrder.krathongName} ({purchasedOrder.quantity} ใบ) ·{' '}
                  <span className="font-mono tabular-nums text-[#F5EFE6]">
                    {formatBaht(purchasedOrder.totalAmount)}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={onProceedToFloat}
                  className="mt-3 w-full rounded-md border border-[#E8A838]/50 bg-[#15253C] px-3 py-2 text-xs font-semibold text-[#F5EFE6] hover:bg-[#1E3352] transition-colors cursor-pointer"
                >
                  ไปจุดเทียนอธิษฐานกับแฟน
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
