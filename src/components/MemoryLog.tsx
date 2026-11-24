import { useMemo, useState } from 'react';
import { CalendarHeart, Download, Eye, Trash2 } from 'lucide-react';
import type { FloatedKrathong } from '../data/loyKrathongData';
import {
  calculateDaysTogether,
  formatThaiDate,
  formatThaiTime,
  getMemoryArchiveStats,
} from '../utils/loyKrathongLogic';

interface MemoryLogProps {
  krathongs: FloatedKrathong[];
  activeKrathongId: string | null;
  anniversaryDate: string | null;
  onChangeAnniversaryDate: (nextDate: string | null) => void;
  onFocusOnRiver: (id: string) => void;
  onDownloadCard: (item: FloatedKrathong) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoryLog({
  krathongs,
  activeKrathongId,
  anniversaryDate,
  onChangeAnniversaryDate,
  onFocusOnRiver,
  onDownloadCard,
  onDeleteMemory,
}: MemoryLogProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const stats = useMemo(() => getMemoryArchiveStats(krathongs), [krathongs]);
  const daysTogether = useMemo(
    () => calculateDaysTogether(anniversaryDate),
    [anniversaryDate]
  );

  const visibleKrathongs = useMemo(() => {
    if (selectedYear === 'all') return krathongs;
    return krathongs.filter(
      (k) => new Date(k.floatedAt).getFullYear() + 543 === selectedYear
    );
  }, [krathongs, selectedYear]);

  const handleDownload = (item: FloatedKrathong) => {
    onDownloadCard(item);
    setDownloadedId(item.id);
    window.setTimeout(() => {
      setDownloadedId((curr) => (curr === item.id ? null : curr));
    }, 2500);
  };

  return (
    <section
      id="memories"
      className="mx-auto max-w-6xl border-t border-[#F5EFE6]/10 px-4 py-14 sm:px-6"
    >
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#E8A838]">
            05. สมุดภาพและวันครบรอบคืนวันเพ็ญ
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5EFE6] sm:text-3xl [text-wrap:balance]">
            ความทรงจำและสถิติการลอยกระทงคู่กัน
          </h2>
        </div>

        {/* Yearly Archive Filter */}
        {stats.years.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#F5EFE6]/10 bg-[#101D30] p-1">
            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-[#E8A838] text-[#08111E]'
                  : 'text-[#A8B7CC] hover:text-[#F5EFE6]'
              }`}
            >
              ทุกปี
            </button>
            {stats.years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                  selectedYear === year
                    ? 'bg-[#E8A838] text-[#08111E]'
                    : 'text-[#A8B7CC] hover:text-[#F5EFE6]'
                }`}
              >
                พ.ศ. {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Anniversary Counter & Milestone Bar */}
      <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] p-5 md:grid-cols-3">
        <div className="flex flex-col justify-between gap-2">
          <label
            htmlFor="anniversary-date"
            className="flex items-center gap-2 text-xs font-medium text-[#A8B7CC]"
          >
            <CalendarHeart className="h-4 w-4 text-[#E8A838]" aria-hidden="true" />
            <span>วันครบรอบของเรา</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="anniversary-date"
              type="date"
              value={anniversaryDate ?? ''}
              onChange={(e) =>
                onChangeAnniversaryDate(e.target.value ? e.target.value : null)
              }
              className="rounded-lg border border-[#F5EFE6]/15 bg-[#08111E] px-3 py-1.5 font-mono text-xs text-[#F5EFE6] focus:border-[#E8A838] focus:outline-none"
            />
            {anniversaryDate && (
              <button
                type="button"
                onClick={() => onChangeAnniversaryDate(null)}
                className="text-xs text-[#A8B7CC] hover:text-[#F5EFE6] cursor-pointer"
              >
                ล้าง
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[#F5EFE6]/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5">
          <p className="text-xs text-[#A8B7CC]">ระยะเวลาที่อยู่เคียงข้างกัน</p>
          <p
            data-testid="days-together"
            className="mt-1 font-display text-2xl font-semibold text-[#E8A838] tabular-nums"
          >
            {daysTogether !== null
              ? `${daysTogether.toLocaleString('th-TH')} วัน`
              : 'ยังไม่ได้ตั้งวันครบรอบ'}
          </p>
        </div>

        <div className="border-t border-[#F5EFE6]/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-5">
          <p className="text-xs text-[#A8B7CC]">บันทึกการลอยกระทงร่วมกัน</p>
          <p className="mt-1 font-display text-2xl font-semibold text-[#F5EFE6] tabular-nums">
            {stats.totalKrathongs} ครั้ง{' '}
            <span className="text-sm font-normal text-[#A8B7CC]">
              · {stats.uniqueLocations} สถานที่
            </span>
          </p>
        </div>
      </div>

      {visibleKrathongs.length === 0 ? (
        <div className="rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] p-8 text-center text-sm text-[#A8B7CC]">
          ยังไม่มีกระทงบนสายน้ำในขณะนี้ ลองเลือกสถานที่และกระทงเพื่อลอยใบแรกด้วยกัน
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleKrathongs.map((item) => {
            const isActive = item.id === activeKrathongId;

            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden rounded-xl border transition-colors ${
                  isActive
                    ? 'border-[#E8A838] bg-[#132238]'
                    : 'border-[#F5EFE6]/10 bg-[#101D30]'
                }`}
              >
                {item.photoDataUrl && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[#08111E]">
                    <img
                      src={item.photoDataUrl}
                      alt={`ภาพคู่ ${item.yourName} และ ${item.partnerName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#A8B7CC]">
                      <span className="truncate">{item.locationName}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatThaiDate(item.floatedAt)} · {formatThaiTime(item.floatedAt)} น.
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-base font-semibold text-[#F5EFE6]">
                      {item.yourName} &amp; {item.partnerName}
                    </h3>

                    <p className="mt-1 text-xs text-[#E8A838]">
                      {item.krathongName}
                      {item.addonNames.length > 0
                        ? ` · ${item.addonNames.join(' · ')}`
                        : ''}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-[#F5EFE6]/90">
                      “{item.wish}”
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F5EFE6]/10 pt-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onFocusOnRiver(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#182B47] px-3 py-1.5 text-xs font-medium text-[#F5EFE6] hover:bg-[#223B5E] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
                        <span>ดูบนสายน้ำ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#F5EFE6]/15 bg-[#0D1829] px-3 py-1.5 text-xs font-medium text-[#F5EFE6] hover:border-[#E8A838]/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
                      >
                        <Download className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
                        <span>
                          {downloadedId === item.id
                            ? 'บันทึกภาพแล้ว'
                            : 'บันทึกการ์ดภาพ'}
                        </span>
                      </button>
                    </div>

                    {item.isUserCreated && (
                      <button
                        type="button"
                        aria-label={`ลบความทรงจำของ ${item.yourName} และ ${item.partnerName}`}
                        onClick={() => onDeleteMemory(item.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-[#A8B7CC] hover:bg-[#182B47] hover:text-[#F28B99] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
