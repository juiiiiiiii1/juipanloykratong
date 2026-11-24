import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { CoupleFortune as CoupleFortuneType } from '../data/loyKrathongData';

interface CoupleFortuneProps {
  currentFortune: CoupleFortuneType | null;
  onDrawFortune: () => void;
}

export function CoupleFortune({
  currentFortune,
  onDrawFortune,
}: CoupleFortuneProps) {
  const [isShaking, setIsShaking] = useState(false);

  const handleDraw = () => {
    setIsShaking(true);
    window.setTimeout(() => {
      setIsShaking(false);
      onDrawFortune();
    }, 220);
  };

  return (
    <section
      id="fortune"
      className="mx-auto max-w-6xl border-t border-[#F5EFE6]/10 px-4 py-14 sm:px-6"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="text-xs font-medium text-[#E8A838]">
            04. กิจกรรมเสริมคืนวันเพ็ญ
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5EFE6] sm:text-3xl [text-wrap:balance]">
            เซียมซีคู่รักคืนวันเพ็ญ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#A8B7CC]">
            เสี่ยงเซียมซีทำนายดวงความรักและคำแนะนำน่ารักๆ ประจำคืนนี้ หากเปิดห้องร่วมกัน แฟนจะเห็นใบเซียมซีเดียวกันทันที
          </p>

          <button
            type="button"
            onClick={handleDraw}
            disabled={isShaking}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E8A838] px-5 py-3 text-sm font-semibold text-[#08111E] hover:bg-[#F2BA54] disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isShaking
                ? 'กำลังเขย่ากระบอกเซียมซี...'
                : currentFortune
                ? 'เขย่าเซียมซีใหม่อีกครั้ง'
                : 'เขย่าเซียมซีคู่กัน'}
            </span>
          </button>
        </div>

        <div className="lg:col-span-7">
          {currentFortune ? (
            <article
              data-testid="fortune-result"
              className={`rounded-xl border border-[#E8A838]/40 bg-[#101D30] p-6 transition-transform duration-150 ${
                isShaking ? 'translate-y-0.5' : ''
              }`}
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-[#F5EFE6]/10 pb-4">
                <h3 className="font-display text-lg font-semibold text-[#E8A838]">
                  {currentFortune.title}
                </h3>
                <span className="font-display text-2xl font-semibold text-[#F5EFE6]/80 shrink-0">
                  {currentFortune.thaiNumber}
                </span>
              </div>

              <p className="mt-4 text-base leading-relaxed text-[#F5EFE6]">
                {currentFortune.prediction}
              </p>

              <p className="mt-4 border-t border-[#F5EFE6]/10 pt-4 text-sm text-[#A8B7CC]">
                คำแนะนำคืนนี้: <span className="text-[#F5EFE6]">{currentFortune.coupleTip}</span>
              </p>
            </article>
          ) : (
            <div className="rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] p-8 text-center">
              <p className="font-display text-lg text-[#F5EFE6]">
                ยังไม่ได้เขย่าเซียมซีในคืนนี้
              </p>
              <p className="mt-2 text-sm text-[#A8B7CC]">
                กดปุ่ม “เขย่าเซียมซีคู่กัน” เพื่อสุ่มคำทำนายความรักประจำวันเพ็ญ
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
