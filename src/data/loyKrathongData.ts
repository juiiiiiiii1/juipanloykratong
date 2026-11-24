export type KrathongCategory = 'all' | 'couple' | 'traditional' | 'eco';

export type KrathongVisualStyle =
  | 'coconut-lotus'
  | 'banana-marigold'
  | 'bread-turtle'
  | 'wafer-cone';

export interface KrathongItem {
  id: string;
  name: string;
  category: Exclude<KrathongCategory, 'all'>;
  categoryLabel: string;
  price: number;
  material: string;
  description: string;
  candleCount: 1 | 2;
  visualStyle: KrathongVisualStyle;
  imageUrl: string;
  highlightNote: string;
}

export interface KrathongAddon {
  id: string;
  name: string;
  description: string;
  price: number;
}

export type LocationId =
  | 'chao-phraya'
  | 'ratchaburi-river'
  | 'wat-huai-chinsi'
  | 'rama8-bridge';

export interface LoyKrathongLocation {
  id: LocationId;
  name: string;
  province: string;
  riverName: string;
  atmosphere: string;
  crowdLevel: string;
  highlight: string;
  description: string;
  imageUrl: string;
  skyTintTop: string;
  skyTintBottom: string;
  waterTintTop: string;
  waterTintBottom: string;
  hasMist: boolean;
}

export interface OrderReceipt {
  orderNumber: string;
  krathongId: string;
  krathongName: string;
  quantity: number;
  addonIds: string[];
  totalAmount: number;
  purchasedAt: string;
}

export interface FloatedKrathong {
  id: string;
  yourName: string;
  partnerName: string;
  wish: string;
  krathongId: string;
  krathongName: string;
  visualStyle: KrathongVisualStyle;
  candleCount: 1 | 2;
  locationId: LocationId;
  locationName: string;
  addonNames: string[];
  photoDataUrl?: string;
  floatedAt: string;
  isUserCreated: boolean;
  laneRatio: number;
  initialXRatio: number;
  speed: number;
}

export interface AmbientEmptyKrathong {
  id: string;
  visualStyle: KrathongVisualStyle;
  candleCount: 1 | 2;
  laneRatio: number;
  initialXRatio: number;
  speed: number;
}

export interface CoupleFortune {
  id: number;
  thaiNumber: string;
  title: string;
  prediction: string;
  coupleTip: string;
}

export interface RoomState {
  roomId: string;
  selectedLocationId: LocationId;
  floatedKrathongs: FloatedKrathong[];
  latestFortuneId: number | null;
  anniversaryDate: string | null;
  updatedAt: string;
}

export const KRATHONG_ITEMS: KrathongItem[] = [
  {
    id: 'krathong-coconut-lotus',
    name: 'กระทงกะลามะพร้าวดอกบัวสด',
    category: 'couple',
    categoryLabel: 'คู่รักพิเศษ',
    price: 89,
    material: 'กะลามะพร้าวขัด · ใบเตยพับ · กลีบบัวชมพู · มะลิสด · เทียนคู่',
    description:
      'กระทงกะลามะพร้าวจริงที่นิยมใช้ลอยในงานวัดและริมน้ำ ประดับกลีบบัวสดและมะลิหอม เหมาะสำหรับจุดเทียนอธิษฐานคู่กัน',
    candleCount: 2,
    visualStyle: 'coconut-lotus',
    imageUrl: '/src/assets/images/real_krathong_coconut_shell_1795523251118.jpg',
    highlightNote: 'นิยมสำหรับคู่รักและงานริมน้ำ',
  },
  {
    id: 'krathong-banana-marigold',
    name: 'กระทงใบตองดอกดาวเรืองกล้วยไม้',
    category: 'traditional',
    categoryLabel: 'ใบตองดอกไม้สด',
    price: 69,
    material: 'หยวกกล้วย · ใบตองพับกลัดไม้ไผ่ · ดาวเรือง · กล้วยไม้ · ธูป 3 ดอก',
    description:
      'กระทงใบตองแบบไทยแท้ที่วางขายตามท่าน้ำทั่วไป กลัดด้วยไม้ไผ่ไร้ตะปู ประดับดอกดาวเรืองสีเหลืองสดและกล้วยไม้ไทย',
    candleCount: 1,
    visualStyle: 'banana-marigold',
    imageUrl: '/src/assets/images/real_krathong_banana_marigold_1795523249411.jpg',
    highlightNote: 'กระทงใบตองดั้งเดิม',
  },
  {
    id: 'krathong-bread-turtle',
    name: 'กระทงขนมปังรูปเต่า',
    category: 'eco',
    categoryLabel: 'รักษ์โลก',
    price: 59,
    material: 'ขนมปังอบรูปเต่า · ดอกดาวเรือง · กล้วยไม้ · ธูปเทียน',
    description:
      'กระทงขนมปังรูปเต่าสุดคลาสสิกที่วางขายตามตลาดงานลอยกระทง ย่อยสลายเป็นอาหารปลาในแม่น้ำได้ทั้งหมด',
    candleCount: 1,
    visualStyle: 'bread-turtle',
    imageUrl: '/src/assets/images/real_krathong_bread_turtle_1795523250295.jpg',
    highlightNote: 'เป็นอาหารปลาได้ 100%',
  },
  {
    id: 'krathong-wafer-cone',
    name: 'กระทงโคนไอศกรีมสีพาสเทล',
    category: 'eco',
    categoryLabel: 'รักษ์โลก',
    price: 49,
    material: 'โคนไอศกรีมเวเฟอร์หลากสี · ฐานใบตอง · เทียนและธูป 3 ดอก',
    description:
      'กระทงกรวยไอศกรีมเรียงกลีบบัวสีหวานที่คุ้นตาในงานลอยกระทง น้ำหนักเบา ลอยน้ำสวย และละลายเป็นอาหารปลาได้',
    candleCount: 1,
    visualStyle: 'wafer-cone',
    imageUrl: '/src/assets/images/real_krathong_wafer_cone_1795523250891.jpg',
    highlightNote: 'ย่อยสลายง่าย ไร้โฟม',
  },
];

export const KRATHONG_ADDONS: KrathongAddon[] = [
  {
    id: 'addon-twin-candle',
    name: 'เทียนคู่ขี้ผึ้งแท้สลักชื่อ',
    description: 'เพิ่มเทียนคู่หอมกลิ่นดอกไม้ไทยสำหรับจุดพร้อมกัน',
    price: 29,
  },
  {
    id: 'addon-rose-petals',
    name: 'กลีบกุหลาบมอญโปรยน้ำ',
    description: 'ถุงกลีบกุหลาบสดสำหรับโปรยรอบกระทงก่อนปล่อยลงน้ำ',
    price: 35,
  },
  {
    id: 'addon-lucky-coin',
    name: 'เหรียญนำโชคคู่รัก 9 บาท',
    description: 'เหรียญมงคลวางในกระทงตามความเชื่อเรื่องความมั่งคั่ง',
    price: 19,
  },
  {
    id: 'addon-jasmine-garland',
    name: 'มาลัยข้อพระกรคล้องคู่',
    description: 'พวงมาลัยมะลิสดหอมอ่อนๆ ประดับขอบกระทงเพิ่มสิริมงคล',
    price: 49,
  },
];

export const LOY_KRATHONG_LOCATIONS: LoyKrathongLocation[] = [
  {
    id: 'chao-phraya',
    name: 'ท่ามหาราช ริมแม่น้ำเจ้าพระยา',
    province: 'กรุงเทพมหานคร',
    riverName: 'แม่น้ำเจ้าพระยา',
    atmosphere: 'โรแมนติกคลาสสิก',
    crowdLevel: 'คนปานกลาง',
    highlight: 'วิวพระปรางค์วัดอรุณฯ ยามค่ำ',
    description:
      'ท่าน้ำไม้ริมเจ้าพระยาที่มองเห็นแสงไฟสีทองของวัดอรุณราชวรารามสะท้อนผิวน้ำใต้แสงจันทร์วันเพ็ญ',
    imageUrl: '/src/assets/images/location_chao_phraya_1795519895105.jpg',
    skyTintTop: '#060D1A',
    skyTintBottom: '#13243D',
    waterTintTop: '#0A1628',
    waterTintBottom: '#050B14',
    hasMist: false,
  },
  {
    id: 'ratchaburi-river',
    name: 'ริมน้ำจังหวัดราชบุรี',
    province: 'ราชบุรี',
    riverName: 'แม่น้ำแม่กลอง',
    atmosphere: 'อบอุ่นสบายริมน้ำ',
    crowdLevel: 'คนกำลังดี',
    highlight: 'โคมไฟริมเขื่อนแม่กลองและวิวทิวเขา',
    description:
      'ทางเดินริมเขื่อนแม่น้ำแม่กลองกลางเมืองราชบุรี ประดับโคมไฟสีนวลตลอดแนวฝั่ง ลมพัดเย็นสบายเหมาะกับการเดินจูงมือลอยกระทง',
    imageUrl: '/src/assets/images/location_ratchaburi_river_1795522785056.jpg',
    skyTintTop: '#070F1C',
    skyTintBottom: '#16273E',
    waterTintTop: '#0A1829',
    waterTintBottom: '#050C15',
    hasMist: true,
  },
  {
    id: 'wat-huai-chinsi',
    name: 'วัดห้วยชินสีห์ จังหวัดราชบุรี',
    province: 'ราชบุรี',
    riverName: 'ท่าน้ำวัดห้วยชินสีห์',
    atmosphere: 'สงบงามเป็นสิริมงคล',
    crowdLevel: 'อบอุ่นเป็นกันเอง',
    highlight: 'แสงอุโบสถและเจดีย์สะท้อนผิวน้ำ',
    description:
      'บรรยากาศงานลอยกระทงริมน้ำหน้าวัดห้วยชินสีห์ แสงไฟจากอุโบสถและโคมแขวนส่องสว่างอย่างสงบเงียบ ชวนให้อธิษฐานร่วมกันอย่างตั้งใจ',
    imageUrl: '/src/assets/images/location_wat_huai_chinsi_1795522784890.jpg',
    skyTintTop: '#070D19',
    skyTintBottom: '#182436',
    waterTintTop: '#0C1826',
    waterTintBottom: '#060C14',
    hasMist: false,
  },
  {
    id: 'rama8-bridge',
    name: 'สะพานพระราม 8',
    province: 'กรุงเทพมหานคร',
    riverName: 'แม่น้ำเจ้าพระยา',
    atmosphere: 'โรแมนติกวิวเมือง',
    crowdLevel: 'คึกคักริมสวนสาธารณะ',
    highlight: 'สายเคเบิลสีทองของสะพานพระราม 8 ยามค่ำ',
    description:
      'สวนหลวงพระราม 8 ริมแม่น้ำเจ้าพระยา มองเห็นยอดเสาและสายเคเบิลสีทองของสะพานพระราม 8 ทอดข้ามสายน้ำใต้แสงจันทร์เต็มดวง',
    imageUrl: '/src/assets/images/location_rama8_bridge_1795522786980.jpg',
    skyTintTop: '#060E1B',
    skyTintBottom: '#15253E',
    waterTintTop: '#0A1629',
    waterTintBottom: '#050B14',
    hasMist: false,
  },
];

export const WISH_PRESETS: string[] = [
  'ขอให้เราสองคนจับมือกันผ่านทุกฤดูอย่างอบอุ่นและเข้าใจกันเสมอ',
  'ขอให้ทุกความฝันที่เราตั้งใจร่วมกันค่อยๆ เติบโตและเป็นจริง',
  'ขอให้สายน้ำพัดพาความเหนื่อยล้าออกไป และเหลือไว้เพียงรอยยิ้มข้างกัน',
];

export const AMBIENT_EMPTY_KRATHONGS: AmbientEmptyKrathong[] = [
  {
    id: 'ambient-1',
    visualStyle: 'banana-marigold',
    candleCount: 1,
    laneRatio: 0.36,
    initialXRatio: 0.16,
    speed: 10,
  },
  {
    id: 'ambient-2',
    visualStyle: 'bread-turtle',
    candleCount: 1,
    laneRatio: 0.52,
    initialXRatio: 0.41,
    speed: 12,
  },
  {
    id: 'ambient-3',
    visualStyle: 'wafer-cone',
    candleCount: 1,
    laneRatio: 0.68,
    initialXRatio: 0.64,
    speed: 9,
  },
  {
    id: 'ambient-4',
    visualStyle: 'coconut-lotus',
    candleCount: 2,
    laneRatio: 0.44,
    initialXRatio: 0.85,
    speed: 11,
  },
];

export const COUPLE_FORTUNES: CoupleFortune[] = [
  {
    id: 1,
    thaiNumber: '๐๑',
    title: 'ใบที่ ๑ · ดวงจันทร์เต็มดวงเคียงคู่',
    prediction:
      'ความรักช่วงนี้ราบรื่นเหมือนสายน้ำสงบยามค่ำ ต่างฝ่ายต่างเป็นพื้นที่ปลอดภัยให้กันได้ดีเป็นพิเศษ',
    coupleTip: 'คืนนี้ลองบอกสิ่งที่ประทับใจในตัวอีกฝ่ายคนละหนึ่งเรื่องก่อนนอน',
  },
  {
    id: 2,
    thaiNumber: '๐๒',
    title: 'ใบที่ ๒ · แสงเทียนอุ่นไม่ดับกลางลม',
    prediction:
      'แม้จะมีเรื่องเหนื่อยจากงานหรือระยะทางบ้าง แต่ความเข้าใจและความใส่ใจเล็กๆ จะทำให้ผ่านไปได้อย่างงดงาม',
    coupleTip: 'ชวนกันไปกินของอร่อยร้านโปรดภายในสัปดาห์นี้เพื่อเติมพลังใจ',
  },
  {
    id: 3,
    thaiNumber: '๐๓',
    title: 'ใบที่ ๓ · สายลมเย็นพัดข่าวดี',
    prediction:
      'มีเกณฑ์ได้รับข่าวดีเรื่องการเงิน การงาน หรือทริปท่องเที่ยวที่วางแผนไว้ด้วยกันเร็วๆ นี้',
    coupleTip: 'ลองปักหมุดสถานที่อยากไปเที่ยวด้วยกันในเดือนหน้าอีกสักหนึ่งที่',
  },
  {
    id: 4,
    thaiNumber: '๐๔',
    title: 'ใบที่ ๔ · ดอกบัวคู่พ้นผิวน้ำ',
    prediction:
      'ความตั้งใจที่ทำร่วมกันจะค่อยๆ ออกดอกออกผล ความสัมพันธ์เติบโตอย่างมั่นคงและอบอุ่นขึ้นทุกวัน',
    coupleTip: 'เก็บภาพคู่คืนวันเพ็ญไว้เป็นที่ระลึกในสมุดความทรงจำของปีนี้',
  },
  {
    id: 5,
    thaiNumber: '๐๕',
    title: 'ใบที่ ๕ · สะพานไม้เชื่อมใจ',
    prediction:
      'การเปิดใจคุยกันตรงๆ ด้วยน้ำเสียงอ่อนโยนจะช่วยคลี่คลายเรื่องคาใจและทำให้ยิ่งรักกันมากขึ้น',
    coupleTip: 'ส่งข้อความสั้นๆ บอกคิดถึงหรือขอบคุณอีกฝ่ายให้ยิ้มได้ในวันพรุ่งนี้',
  },
  {
    id: 6,
    thaiNumber: '๐๖',
    title: 'ใบที่ ๖ · โคมทองส่องทางรัก',
    prediction:
      'เป็นจังหวะที่ดีในการเริ่มต้นเป้าหมายใหม่ร่วมกัน ทั้งเรื่องการออม การดูแลสุขภาพ หรือแผนอนาคต',
    coupleTip: 'ตั้งเป้าหมายน่ารักๆ ที่อยากทำให้สำเร็จด้วยกัน 1 อย่างภายในปีนี้',
  },
  {
    id: 7,
    thaiNumber: '๐๗',
    title: 'ใบที่ ๗ · น้ำใสไหลรินไม่ขาดสาย',
    prediction:
      'ความสม่ำเสมอคือเสน่ห์ของคู่คุณ แม้จะเป็นเรื่องธรรมดาในทุกวัน แต่สร้างความผูกพันได้ลึกซึ้งที่สุด',
    coupleTip: 'จับมือกันเดินเล่นรับลมเย็นๆ สักสิบนาทีโดยไม่ต้องรีบร้อน',
  },
  {
    id: 8,
    thaiNumber: '๐๘',
    title: 'ใบที่ ๘ · กลิ่นมะลิหอมจรุงใจ',
    prediction:
      'เสน่ห์และความน่ารักที่มีต่อกันยังคงสดใส คำพูดดีๆ และอารมณ์ขันจะทำให้ช่วงนี้เต็มไปด้วยเสียงหัวเราะ',
    coupleTip: 'เลือกเพลงที่ชอบทั้งคู่มาฟังพร้อมกันคืนนี้',
  },
];
