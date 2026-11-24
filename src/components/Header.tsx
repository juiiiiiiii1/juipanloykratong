interface HeaderProps {
  hasPurchasedOrder: boolean;
  floatedCount: number;
  onNavigate: (sectionId: string) => void;
}

export function Header({
  hasPurchasedOrder,
  floatedCount,
  onNavigate,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#F5EFE6]/10 bg-[#08111E]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        <a
          href="#river-stage"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('river-stage');
          }}
          className="font-display text-lg font-semibold tracking-tight text-[#F5EFE6] whitespace-nowrap shrink-0 sm:text-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
        >
          ลอยกระทงของจุ้ยกับแพน
        </a>

        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A8B7CC]"
        >
          <a
            href="#locations"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('locations');
            }}
            className="hover:text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
          >
            สถานที่ลอย
          </a>
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('shop');
            }}
            className="hover:text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
          >
            ร้านกระทง
          </a>
          <a
            href="#float"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('float');
            }}
            className="hover:text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
          >
            ลอยกระทงคู่
          </a>
          <a
            href="#fortune"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('fortune');
            }}
            className="hover:text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
          >
            เซียมซี
          </a>
          <a
            href="#memories"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('memories');
            }}
            className="hover:text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8A838]"
          >
            ความทรงจำ ({floatedCount})
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(hasPurchasedOrder ? 'float' : 'shop')}
            className="rounded-lg bg-[#E8A838] px-4 py-2 text-sm font-semibold text-[#08111E] hover:bg-[#F2BA54] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
          >
            {hasPurchasedOrder ? 'จุดเทียนลอยกระทง' : 'เลือกซื้อกระทง'}
          </button>
        </div>
      </div>
    </header>
  );
}
