import { useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import type { LocationId, LoyKrathongLocation } from '../data/loyKrathongData';

interface LocationSelectorProps {
  locations: LoyKrathongLocation[];
  selectedLocationId: LocationId;
  onSelectLocation: (locationId: LocationId) => void;
}

export function LocationSelector({
  locations,
  selectedLocationId,
  onSelectLocation,
}: LocationSelectorProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <section
      id="locations"
      className="mx-auto max-w-6xl border-t border-[#F5EFE6]/10 px-4 py-14 sm:px-6"
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-medium text-[#E8A838]">
          01. สถานที่ริมน้ำคืนวันเพ็ญ
        </p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5EFE6] sm:text-3xl [text-wrap:balance]">
          เลือกสถานที่ที่จะไปลอยกระทงกับแฟน
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
          เมื่อเลือกสถานที่ ฉากสายน้ำ แสงไฟ และบรรยากาศด้านบนจะเปลี่ยนตามสถานที่นั้นทันที
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {locations.map((loc) => {
          const isSelected = loc.id === selectedLocationId;
          const hasFailed = Boolean(failedImages[loc.id]);

          return (
            <article
              key={loc.id}
              className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                isSelected
                  ? 'border-[#E8A838] bg-[#132238]'
                  : 'border-[#F5EFE6]/10 bg-[#101D30] hover:border-[#F5EFE6]/25'
              }`}
            >
              <div className="aspect-video w-full overflow-hidden bg-[#0A1423]">
                {hasFailed ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0F2038] to-[#08111E] p-6 text-center">
                    <MapPin className="h-7 w-7 text-[#E8A838]" aria-hidden="true" />
                    <span className="font-display text-base font-medium text-[#F5EFE6]">
                      {loc.name}
                    </span>
                  </div>
                ) : (
                  <img
                    src={loc.imageUrl}
                    alt={`${loc.name} ${loc.province}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [loc.id]: true }))
                    }
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8B7CC]">
                    <span>{loc.province}</span>
                    <span aria-hidden="true">·</span>
                    <span>{loc.atmosphere}</span>
                    <span aria-hidden="true">·</span>
                    <span>{loc.crowdLevel}</span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-semibold text-[#F5EFE6]">
                    {loc.name}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
                    {loc.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#F5EFE6]/10 pt-4">
                  <span className="text-xs text-[#E8A838] truncate">
                    {loc.highlight}
                  </span>

                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectLocation(loc.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838] ${
                      isSelected
                        ? 'bg-[#E8A838] text-[#08111E]'
                        : 'bg-[#182B47] text-[#F5EFE6] hover:bg-[#223B5E]'
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {isSelected ? 'กำลังเลือกสถานที่นี้' : 'เลือกสถานที่นี้'}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
