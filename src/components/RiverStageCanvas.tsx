import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Flower2,
  MapPin,
  PlusCircle,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AMBIENT_EMPTY_KRATHONGS,
  KRATHONG_ITEMS,
  type FloatedKrathong,
  type KrathongVisualStyle,
  type LoyKrathongLocation,
} from '../data/loyKrathongData';
import { formatThaiTime } from '../utils/loyKrathongLogic';

export interface FireworkTrigger {
  xRatio: number;
  yRatio: number;
  burstId: string;
}

export interface PetalsTrigger {
  burstId: string;
}

interface RiverStageCanvasProps {
  location: LoyKrathongLocation;
  krathongs: FloatedKrathong[];
  activeKrathongId: string | null;
  roomId: string;
  onlineCount: number;
  wsConnected: boolean;
  soundEnabled: boolean;
  fireworkSignal: FireworkTrigger | null;
  petalsSignal: PetalsTrigger | null;
  onSelectKrathong: (id: string) => void;
  onStartJourney: () => void;
  onGoToFloat: () => void;
  onCopyRoomLink: () => void;
  onCreateNewRoom: () => void;
  onToggleSound: () => void;
  onTriggerFirework: (xRatio: number, yRatio: number) => void;
  onTriggerPetals: () => void;
  onDownloadCard: (item: FloatedKrathong) => void;
}

interface StarPoint {
  xRatio: number;
  yRatio: number;
  radius: number;
  phase: number;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface RosePetal {
  xRatio: number;
  yRatio: number;
  speedX: number;
  swayPhase: number;
  life: number;
  color: string;
}

interface WaterRipple {
  xRatio: number;
  yRatio: number;
  life: number;
  maxLife: number;
}

interface SkyLantern {
  baseX: number;
  baseY: number;
  riseSpeed: number;
  driftSpeed: number;
  scale: number;
  phase: number;
}

interface FireflyPoint {
  xRatio: number;
  yRatio: number;
  phase: number;
  speed: number;
}

const STARS: StarPoint[] = Array.from({ length: 48 }, (_, i) => ({
  xRatio: ((i * 73 + 19) % 97) / 100,
  yRatio: ((i * 41 + 7) % 38) / 100,
  radius: (i % 3) * 0.45 + 0.55,
  phase: i * 0.7,
}));

const SKY_LANTERNS: SkyLantern[] = [
  { baseX: 0.14, baseY: 0.34, riseSpeed: 0.008, driftSpeed: 0.004, scale: 0.85, phase: 0.4 },
  { baseX: 0.31, baseY: 0.28, riseSpeed: 0.006, driftSpeed: 0.003, scale: 0.65, phase: 1.7 },
  { baseX: 0.47, baseY: 0.36, riseSpeed: 0.009, driftSpeed: 0.005, scale: 0.95, phase: 2.9 },
  { baseX: 0.63, baseY: 0.24, riseSpeed: 0.007, driftSpeed: 0.0035, scale: 0.7, phase: 4.1 },
  { baseX: 0.74, baseY: 0.33, riseSpeed: 0.0085, driftSpeed: 0.0042, scale: 0.8, phase: 5.3 },
];

const FIREFLIES: FireflyPoint[] = [
  { xRatio: 0.06, yRatio: 0.78, phase: 0.2, speed: 1.9 },
  { xRatio: 0.11, yRatio: 0.86, phase: 1.5, speed: 2.3 },
  { xRatio: 0.16, yRatio: 0.91, phase: 3.1, speed: 1.6 },
  { xRatio: 0.85, yRatio: 0.89, phase: 2.4, speed: 2.1 },
  { xRatio: 0.91, yRatio: 0.81, phase: 4.2, speed: 1.8 },
  { xRatio: 0.95, yRatio: 0.93, phase: 0.9, speed: 2.5 },
];

function buildFeatheredKrathongSprite(
  img: HTMLImageElement
): HTMLCanvasElement | null {
  if (typeof document === 'undefined' || !img.naturalWidth || !img.naturalHeight) {
    return null;
  }
  const w = 180;
  const h = 136;
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const octx = offscreen.getContext('2d');
  if (!octx) return null;

  // Focus tightly on the center krathong body in the photo
  const sx = img.naturalWidth * 0.16;
  const sy = img.naturalHeight * 0.16;
  const sw = img.naturalWidth * 0.68;
  const sh = img.naturalHeight * 0.66;

  octx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

  // Tighter elliptical alpha feather so background dissolves cleanly into water
  octx.globalCompositeOperation = 'destination-in';
  octx.save();
  octx.translate(w / 2, h / 2 + 2);
  octx.scale(1, 0.74);
  const maskGrad = octx.createRadialGradient(0, 0, w * 0.16, 0, 0, w * 0.44);
  maskGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
  maskGrad.addColorStop(0.54, 'rgba(0, 0, 0, 0.94)');
  maskGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.36)');
  maskGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  octx.fillStyle = maskGrad;
  octx.beginPath();
  octx.arc(0, 0, w * 0.46, 0, Math.PI * 2);
  octx.fill();
  octx.restore();

  return offscreen;
}

function getKrathongPalette(style: KrathongVisualStyle) {
  switch (style) {
    case 'coconut-lotus':
      return {
        base: '#5C3A21',
        rim: '#D97B8A',
        petal: '#F4ACB7',
        inner: '#FFF0F3',
      };
    case 'banana-marigold':
      return {
        base: '#2B5B3F',
        rim: '#E8A838',
        petal: '#F4B942',
        inner: '#B565A7',
      };
    case 'bread-turtle':
      return {
        base: '#8D5524',
        rim: '#C68642',
        petal: '#E0AC69',
        inner: '#F1C27D',
      };
    case 'wafer-cone':
      return {
        base: '#2D6A4F',
        rim: '#F4ACB7',
        petal: '#BDE0FE',
        inner: '#FFF3B0',
      };
  }
}

export function RiverStageCanvas({
  location,
  krathongs,
  activeKrathongId,
  roomId,
  onlineCount,
  wsConnected,
  soundEnabled,
  fireworkSignal,
  petalsSignal,
  onSelectKrathong,
  onStartJourney,
  onGoToFloat,
  onCopyRoomLink,
  onCreateNewRoom,
  onToggleSound,
  onTriggerFirework,
  onTriggerPetals,
  onDownloadCard,
}: RiverStageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const krathongsRef = useRef<FloatedKrathong[]>(krathongs);
  const activeIdRef = useRef<string | null>(activeKrathongId);
  const locationRef = useRef<LoyKrathongLocation>(location);
  const positionsRef = useRef<Array<{ id: string; x: number; y: number }>>([]);
  const krathongSpritesRef = useRef<
    Partial<Record<KrathongVisualStyle, HTMLCanvasElement>>
  >({});
  const fireworksRef = useRef<FireworkParticle[]>([]);
  const petalsRef = useRef<RosePetal[]>([]);
  const waterRipplesRef = useRef<WaterRipple[]>([]);

  const [imageFailed, setImageFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    krathongsRef.current = krathongs;
  }, [krathongs]);

  useEffect(() => {
    activeIdRef.current = activeKrathongId;
  }, [activeKrathongId]);

  useEffect(() => {
    locationRef.current = location;
    setImageFailed(false);
  }, [location]);

  // Spawn firework particles when room receives firework event
  useEffect(() => {
    if (!fireworkSignal) return;
    const colors = ['#FFCF5C', '#E8A838', '#F4ACB7', '#FFF5D6'];
    for (let i = 0; i < 32; i++) {
      const angle = (Math.PI * 2 * i) / 32 + Math.random() * 0.2;
      const speed = 0.05 + Math.random() * 0.14;
      fireworksRef.current.push({
        x: fireworkSignal.xRatio,
        y: fireworkSignal.yRatio,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1.45 + Math.random() * 0.65,
        color: colors[i % colors.length],
      });
    }
  }, [fireworkSignal]);

  // Spawn rose petals when room receives petals event
  useEffect(() => {
    if (!petalsSignal) return;
    const petalColors = ['#F4ACB7', '#D97B8A', '#FAD2E1', '#E8A838'];
    for (let i = 0; i < 28; i++) {
      petalsRef.current.push({
        xRatio: 0.08 + Math.random() * 0.84,
        yRatio: 0.46 + Math.random() * 0.45,
        speedX: 0.009 + Math.random() * 0.015,
        swayPhase: Math.random() * Math.PI * 2,
        life: 0,
        color: petalColors[i % petalColors.length],
      });
    }
    if (petalsRef.current.length > 84) {
      petalsRef.current = petalsRef.current.slice(-84);
    }
  }, [petalsSignal]);

  // Preload and build feathered offscreen sprites for realistic water blending
  useEffect(() => {
    for (const item of KRATHONG_ITEMS) {
      if (!krathongSpritesRef.current[item.visualStyle]) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          const feathered = buildFeatheredKrathongSprite(img);
          if (feathered) {
            krathongSpritesRef.current[item.visualStyle] = feathered;
          }
        };
        img.src = item.imageUrl;
      }
    }
  }, []);

  const activeKrathong = useMemo(() => {
    if (krathongs.length === 0) return null;
    return (
      krathongs.find((k) => k.id === activeKrathongId) ??
      krathongs[0] ??
      null
    );
  }, [krathongs, activeKrathongId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let isVisible = true;
    const startTime = performance.now();
    let prevTime = startTime;
    let lastRenderTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const targetW = Math.max(320, Math.floor(rect.width * dpr));
      const targetH = Math.max(240, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const drawWaterLightPillar = (
      px: number,
      horizonY: number,
      h: number,
      dpr: number,
      elapsedSec: number,
      widthBase: number,
      lengthRatio: number,
      rgbaColor: string,
      phaseOffset: number
    ) => {
      const maxDist = (h - horizonY) * lengthRatio;
      // Soft 2D radial elliptical glow on water surface (zero hard edge)
      const rx = Math.max(1, widthBase * 1.65 * dpr);
      const ry = Math.max(1, maxDist * 0.48);
      const cy = horizonY + ry;
      ctx.save();
      ctx.translate(px, cy);
      ctx.scale(rx, ry);
      const glowGrad = ctx.createRadialGradient(0, 0, 0.04, 0, 0, 1);
      glowGrad.addColorStop(0, rgbaColor.replace('ALPHA', '0.16'));
      glowGrad.addColorStop(0.45, rgbaColor.replace('ALPHA', '0.07'));
      glowGrad.addColorStop(0.8, rgbaColor.replace('ALPHA', '0.02'));
      glowGrad.addColorStop(1, rgbaColor.replace('ALPHA', '0'));
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Thin fragmented horizontal wave glints instead of solid ovals
      const bands = 14;
      ctx.lineCap = 'round';
      for (let b = 0; b < bands; b++) {
        const t = b / bands;
        const y = horizonY + 5 * dpr + t * maxDist;
        const count = b % 2 === 0 ? 2 : 1;
        for (let seg = 0; seg < count; seg++) {
          const offsetDir = seg === 0 ? -1 : 1;
          const sway =
            Math.sin(elapsedSec * 2.2 + b * 1.15 + phaseOffset + seg * 2) *
            (3 + t * 7) *
            dpr;
          const segW =
            (widthBase * (0.45 + (1 - t) * 0.45) +
              Math.cos(elapsedSec * 1.8 + b + seg) * 3) *
            dpr;
          const cx = px + sway + (count === 2 ? offsetDir * widthBase * 0.36 * dpr : 0);
          ctx.strokeStyle = rgbaColor.replace(
            'ALPHA',
            (0.28 * (1 - t * 0.72)).toFixed(3)
          );
          ctx.lineWidth = (1.1 + t * 0.8) * dpr;
          ctx.beginPath();
          ctx.moveTo(cx - segW * 0.5, y);
          ctx.lineTo(cx + segW * 0.5, y);
          ctx.stroke();
        }
      }
    };

    const drawSingleKrathong = (params: {
      x: number;
      y: number;
      scale: number;
      dpr: number;
      elapsedSec: number;
      seedOffset: number;
      visualStyle: KrathongVisualStyle;
      candleCount: 1 | 2;
      isSelected: boolean;
      label: string | null;
    }) => {
      const {
        x,
        y,
        scale,
        dpr,
        elapsedSec,
        seedOffset,
        visualStyle,
        candleCount,
        isSelected,
        label,
      } = params;
      const palette = getKrathongPalette(visualStyle);
      const sprite = krathongSpritesRef.current[visualStyle];
      const tiltAngle = prefersReducedMotion
        ? 0
        : Math.sin(elapsedSec * 1.55 + seedOffset * 14) * 0.042;
      const drawW = 68 * scale;
      const drawH = 50 * scale;

      // 1. Expanding concentric water ripples radiating from the krathong hull
      for (let r = 0; r < 3; r++) {
        const cycle = prefersReducedMotion
          ? r * 0.33
          : (elapsedSec * 0.38 + seedOffset + r * 0.33) % 1;
        const rx = (22 + cycle * 26) * scale;
        const ry = (6 + cycle * 7) * scale;
        const alpha = (1 - cycle) * (isSelected ? 0.38 : 0.22);
        ctx.strokeStyle = isSelected
          ? `rgba(245, 199, 107, ${alpha.toFixed(3)})`
          : `rgba(215, 232, 248, ${alpha.toFixed(3)})`;
        ctx.lineWidth = (isSelected ? 1.4 : 1) * dpr;
        ctx.beginPath();
        ctx.ellipse(x, y + 8 * scale, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Inverted, softly rippling water reflection of krathong + candlelight
      if (sprite) {
        ctx.save();
        ctx.translate(x, y + 12 * scale);
        ctx.scale(1, -0.44);
        ctx.globalAlpha = 0.26;
        const waveShear = Math.sin(elapsedSec * 2.4 + seedOffset * 12) * 2.5 * scale;
        ctx.drawImage(
          sprite,
          -drawW / 2 + waveShear,
          -drawH * 0.56,
          drawW,
          drawH
        );
        ctx.restore();
      }

      // Warm golden shimmer streaks below the krathong from its candles
      for (let s = 0; s < 5; s++) {
        const sy = y + (11 + s * 4.8) * scale;
        const sw =
          (16 - s * 2.1 + Math.sin(elapsedSec * 3.1 + s + seedOffset * 8) * 3) *
          scale;
        const shimmerAlpha = 0.26 - s * 0.042;
        if (sw > 2 && shimmerAlpha > 0) {
          ctx.fillStyle = `rgba(255, 198, 92, ${shimmerAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(
            x + Math.sin(elapsedSec * 2.2 + s) * 2 * scale,
            sy,
            sw,
            1.45 * scale,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Broad warm glow pool on water surface
      const reflectGrad = ctx.createRadialGradient(
        x,
        y + 10 * scale,
        2 * scale,
        x,
        y + 12 * scale,
        46 * scale
      );
      reflectGrad.addColorStop(0, 'rgba(245, 176, 65, 0.26)');
      reflectGrad.addColorStop(0.55, 'rgba(232, 168, 56, 0.09)');
      reflectGrad.addColorStop(1, 'rgba(245, 176, 65, 0)');
      ctx.fillStyle = reflectGrad;
      ctx.beginPath();
      ctx.ellipse(x, y + 12 * scale, 46 * scale, 16 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Waterline meniscus contact shadow directly under hull
      ctx.fillStyle = 'rgba(4, 10, 18, 0.58)';
      ctx.beginPath();
      ctx.ellipse(x, y + 7 * scale, 24 * scale, 6.2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Krathong body with subtle gentle wave rocking
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tiltAngle);

      if (sprite) {
        ctx.drawImage(sprite, -drawW / 2, -drawH * 0.58, drawW, drawH);
      } else {
        ctx.fillStyle = palette.base;
        ctx.beginPath();
        ctx.ellipse(0, 2 * scale, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let p = -2; p <= 2; p++) {
          ctx.fillStyle = p % 2 === 0 ? palette.petal : palette.rim;
          ctx.beginPath();
          ctx.ellipse(
            p * 6.5 * scale,
            -2 * scale,
            5.2 * scale,
            7.5 * scale,
            p * 0.18,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        ctx.fillStyle = palette.inner;
        ctx.beginPath();
        ctx.ellipse(0, -2 * scale, 10 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isSelected) {
        ctx.strokeStyle = 'rgba(245, 199, 107, 0.85)';
        ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath();
        ctx.ellipse(0, 5 * scale, 31 * scale, 8.5 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Realistic candles, glowing incense embers, and delicate smoke curl
      const candleOffsets =
        candleCount === 2 ? [-5.5 * scale, 5.5 * scale] : [0];

      // Subtle incense sticks with warm ember dots
      for (const ix of [-3.5, 0, 3.5]) {
        ctx.strokeStyle = 'rgba(190, 155, 110, 0.48)';
        ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(ix * 0.5 * scale, -8 * scale);
        ctx.lineTo(ix * 1.15 * scale, -22 * scale);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 130, 60, 0.9)';
        ctx.beginPath();
        ctx.arc(ix * 1.15 * scale, -22 * scale, 1.1 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Faint rising incense smoke curve
      ctx.strokeStyle = 'rgba(235, 240, 248, 0.16)';
      ctx.lineWidth = 1.1 * dpr;
      ctx.beginPath();
      const smokeDrift = Math.sin(elapsedSec * 1.6 + seedOffset * 10) * 4 * scale;
      ctx.moveTo(0, -23 * scale);
      ctx.quadraticCurveTo(
        smokeDrift,
        -33 * scale,
        smokeDrift * 1.4 + 2 * scale,
        -42 * scale
      );
      ctx.stroke();

      for (const cxOff of candleOffsets) {
        const cx = cxOff;
        const flicker =
          Math.sin(elapsedSec * 9.5 + seedOffset * 20 + cxOff) * 0.85 * scale;

        // Beeswax candle stem
        ctx.fillStyle = '#F6D983';
        ctx.fillRect(cx - 1.2 * scale, -18 * scale, 2.4 * scale, 8 * scale);

        const halo = ctx.createRadialGradient(
          cx + flicker * 0.25,
          -21 * scale,
          1 * scale,
          cx,
          -21 * scale,
          19 * scale
        );
        halo.addColorStop(0, 'rgba(255, 232, 155, 0.62)');
        halo.addColorStop(0.45, 'rgba(240, 175, 65, 0.18)');
        halo.addColorStop(1, 'rgba(232, 168, 56, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, -21 * scale, 19 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Outer amber flame
        ctx.fillStyle = '#FFBE42';
        ctx.beginPath();
        ctx.ellipse(
          cx + flicker * 0.4,
          -21 * scale,
          2 * scale,
          4.2 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Bright white-gold flame core
        ctx.fillStyle = '#FFF9DF';
        ctx.beginPath();
        ctx.ellipse(
          cx + flicker * 0.3,
          -20.2 * scale,
          0.95 * scale,
          2.1 * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();

      // 6. Clean floating nameplate for couple's floated krathong
      if (label) {
        ctx.font = `500 ${Math.round(11.5 * dpr)}px "IBM Plex Sans Thai", sans-serif`;
        ctx.textAlign = 'center';
        const metrics = ctx.measureText(label);
        const pillW = metrics.width + 16 * dpr;
        const pillH = 20 * dpr;
        const pillY = y + 23 * scale;

        ctx.fillStyle = isSelected
          ? 'rgba(13, 24, 41, 0.88)'
          : 'rgba(8, 17, 30, 0.72)';
        ctx.beginPath();
        ctx.roundRect(x - pillW / 2, pillY - pillH / 2, pillW, pillH, 6 * dpr);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = 'rgba(232, 168, 56, 0.65)';
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();
        }

        ctx.fillStyle = isSelected
          ? 'rgba(245, 199, 107, 0.98)'
          : 'rgba(245, 239, 230, 0.94)';
        ctx.fillText(label, x, pillY + 4 * dpr);
      }
    };

    const drawScene = (nowMs: number) => {
      if (lastRenderTime !== 0 && nowMs - lastRenderTime < 45 && !prefersReducedMotion) {
        if (isVisible && !document.hidden) {
          animId = requestAnimationFrame(drawScene);
        } else {
          animId = 0;
        }
        return;
      }
      lastRenderTime = nowMs;

      const dt = Math.min(0.08, Math.max(0.001, (nowMs - prevTime) / 1000));
      prevTime = nowMs;

      const elapsedSec = prefersReducedMotion ? 0 : (nowMs - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const loc = locationRef.current;
      const horizonY = h * 0.41;

      ctx.clearRect(0, 0, w, h);

      // 1. Moonlit night sky scrim
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, 'rgba(5, 11, 22, 0.72)');
      skyGrad.addColorStop(0.65, 'rgba(11, 22, 39, 0.38)');
      skyGrad.addColorStop(1, 'rgba(8, 17, 30, 0.62)');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 2);

      // Stars
      for (const star of STARS) {
        const twinkle =
          0.42 + 0.48 * Math.sin(elapsedSec * 1.4 + star.phase);
        ctx.fillStyle = `rgba(245, 239, 230, ${twinkle.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(
          star.xRatio * w,
          star.yRatio * h,
          star.radius * dpr,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Full Moon + soft atmospheric halo
      const moonX = w * 0.82;
      const moonY = h * 0.16;
      const moonR = Math.min(w, h) * 0.055;
      const moonGlow = ctx.createRadialGradient(
        moonX,
        moonY,
        moonR * 0.35,
        moonX,
        moonY,
        moonR * 3.8
      );
      moonGlow.addColorStop(0, 'rgba(255, 241, 208, 0.45)');
      moonGlow.addColorStop(0.45, 'rgba(232, 168, 56, 0.14)');
      moonGlow.addColorStop(1, 'rgba(232, 168, 56, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF6DA';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // 2. Drifting distant sky lanterns (โคมลอย)
      const lanternWaterReflections: Array<{ x: number; alpha: number }> = [];
      for (const l of SKY_LANTERNS) {
        const lx =
          ((l.baseX + elapsedSec * l.driftSpeed + Math.sin(elapsedSec * 0.5 + l.phase) * 0.015) %
            1.05) *
          w;
        const cycleY = (elapsedSec * l.riseSpeed + (1 - l.baseY / 0.4)) % 1;
        const ly = horizonY - (0.08 + cycleY * 0.78) * horizonY;
        const ls = l.scale * dpr;
        const fadeAlpha = Math.sin(cycleY * Math.PI) * 0.85;

        if (fadeAlpha > 0.05) {
          ctx.fillStyle = `rgba(255, 198, 92, ${(fadeAlpha * 0.16).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(lx, ly, 10 * ls, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 206, 108, ${fadeAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(lx, ly, 2.8 * ls, 3.8 * ls, 0, 0, Math.PI * 2);
          ctx.fill();

          lanternWaterReflections.push({ x: lx, alpha: fadeAlpha * 0.14 });
        }
      }

      // Interactive fireworks in the night sky
      const survivingFireworks: FireworkParticle[] = [];
      for (const p of fireworksRef.current) {
        p.life += dt;
        if (p.life < p.maxLife) {
          p.x += p.vx * dt;
          p.y += p.vy * dt + 0.03 * dt * p.life;
          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, 2.3 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          survivingFireworks.push(p);
        }
      }
      fireworksRef.current = survivingFireworks;

      // 3. Distant riverbank silhouette tailored to each location
      ctx.fillStyle = '#070F1C';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      if (loc.id === 'chao-phraya') {
        ctx.lineTo(w * 0.16, horizonY);
        ctx.lineTo(w * 0.19, horizonY - 26 * dpr);
        ctx.lineTo(w * 0.21, horizonY - 62 * dpr);
        ctx.lineTo(w * 0.23, horizonY - 26 * dpr);
        ctx.lineTo(w * 0.26, horizonY);
        ctx.lineTo(w * 0.55, horizonY - 8 * dpr);
        ctx.lineTo(w * 0.72, horizonY - 12 * dpr);
      } else if (loc.id === 'ratchaburi-river') {
        ctx.lineTo(w * 0.14, horizonY - 18 * dpr);
        ctx.lineTo(w * 0.28, horizonY - 38 * dpr);
        ctx.lineTo(w * 0.42, horizonY - 22 * dpr);
        ctx.lineTo(w * 0.56, horizonY - 44 * dpr);
        ctx.lineTo(w * 0.72, horizonY - 16 * dpr);
      } else if (loc.id === 'wat-huai-chinsi') {
        ctx.lineTo(w * 0.18, horizonY);
        ctx.lineTo(w * 0.21, horizonY - 38 * dpr);
        ctx.lineTo(w * 0.23, horizonY - 64 * dpr);
        ctx.lineTo(w * 0.25, horizonY - 38 * dpr);
        ctx.lineTo(w * 0.29, horizonY - 18 * dpr);
        ctx.lineTo(w * 0.36, horizonY - 36 * dpr);
        ctx.lineTo(w * 0.43, horizonY - 18 * dpr);
        ctx.lineTo(w * 0.46, horizonY);
      } else {
        ctx.lineTo(w * 0.12, horizonY - 16 * dpr);
        ctx.lineTo(w * 0.24, horizonY - 24 * dpr);
        ctx.lineTo(w * 0.65, horizonY - 10 * dpr);
      }
      ctx.lineTo(w, horizonY - 6 * dpr);
      ctx.lineTo(w, horizonY + 4);
      ctx.closePath();
      ctx.fill();

      // Warm riverside lantern dots along the far shore
      const shoreLights =
        loc.id === 'rama8-bridge'
          ? [0.18, 0.26, 0.38, 0.49, 0.58, 0.68, 0.79]
          : [0.15, 0.21, 0.28, 0.36, 0.48, 0.59, 0.7, 0.82];
      for (let i = 0; i < shoreLights.length; i++) {
        const lx = shoreLights[i] * w;
        const ly = horizonY - 4 * dpr;
        ctx.fillStyle = 'rgba(255, 206, 108, 0.78)';
        ctx.beginPath();
        ctx.arc(lx, ly, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (loc.id === 'rama8-bridge') {
        const pylonX = w * 0.38;
        const pylonTopY = horizonY - 82 * dpr;
        ctx.strokeStyle = 'rgba(232, 168, 56, 0.42)';
        ctx.lineWidth = 1.1 * dpr;
        for (let c = 1; c <= 7; c++) {
          ctx.beginPath();
          ctx.moveTo(pylonX, pylonTopY + c * 4 * dpr);
          ctx.lineTo(pylonX + c * 28 * dpr, horizonY - 4 * dpr);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(pylonX, pylonTopY + c * 4 * dpr);
          ctx.lineTo(pylonX - c * 14 * dpr, horizonY - 4 * dpr);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(245, 199, 107, 0.8)';
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath();
        ctx.moveTo(pylonX, horizonY);
        ctx.lineTo(pylonX, pylonTopY);
        ctx.stroke();
      }

      // Distant moving riverboat with warm cabin lights along the far bank
      const boatCycle = (elapsedSec * 0.014 + 0.18) % 1.25 - 0.12;
      const boatX = boatCycle * w;
      const boatY = horizonY - 1.5 * dpr;
      ctx.fillStyle = '#050B14';
      ctx.beginPath();
      ctx.moveTo(boatX - 24 * dpr, boatY);
      ctx.lineTo(boatX + 26 * dpr, boatY);
      ctx.lineTo(boatX + 20 * dpr, boatY - 6 * dpr);
      ctx.lineTo(boatX - 18 * dpr, boatY - 6 * dpr);
      ctx.closePath();
      ctx.fill();
      for (const bx of [-12, -4, 4, 12]) {
        ctx.fillStyle = 'rgba(255, 212, 125, 0.9)';
        ctx.fillRect(boatX + bx * dpr, boatY - 4.5 * dpr, 2.5 * dpr, 2 * dpr);
      }

      // 4. Rich Water Surface & Atmospheric Shoreline Reflections
      const waterGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      waterGrad.addColorStop(0, loc.waterTintTop);
      waterGrad.addColorStop(0.35, loc.waterTintTop);
      waterGrad.addColorStop(1, loc.waterTintBottom);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Subtle horizon shoreline shadow & soft water transition
      const shoreReflectGrad = ctx.createLinearGradient(
        0,
        horizonY,
        0,
        horizonY + 38 * dpr
      );
      shoreReflectGrad.addColorStop(0, 'rgba(4, 9, 17, 0.72)');
      shoreReflectGrad.addColorStop(1, 'rgba(4, 9, 17, 0)');
      ctx.fillStyle = shoreReflectGrad;
      ctx.fillRect(0, horizonY, w, 38 * dpr);

      // Location-specific landmark reflections on water
      if (loc.id === 'chao-phraya') {
        drawWaterLightPillar(w * 0.21, horizonY, h, dpr, elapsedSec, 16, 0.42, 'rgba(245, 195, 95, ALPHA)', 0.5);
        drawWaterLightPillar(w * 0.62, horizonY, h, dpr, elapsedSec, 10, 0.24, 'rgba(232, 168, 56, ALPHA)', 2.1);
      } else if (loc.id === 'ratchaburi-river') {
        for (const rx of [0.16, 0.34, 0.52, 0.7]) {
          drawWaterLightPillar(w * rx, horizonY, h, dpr, elapsedSec, 9, 0.28, 'rgba(245, 190, 90, ALPHA)', rx * 10);
        }
      } else if (loc.id === 'wat-huai-chinsi') {
        drawWaterLightPillar(w * 0.23, horizonY, h, dpr, elapsedSec, 18, 0.45, 'rgba(248, 200, 95, ALPHA)', 0.8);
        drawWaterLightPillar(w * 0.36, horizonY, h, dpr, elapsedSec, 12, 0.34, 'rgba(232, 168, 56, ALPHA)', 1.9);
      } else if (loc.id === 'rama8-bridge') {
        drawWaterLightPillar(w * 0.38, horizonY, h, dpr, elapsedSec, 22, 0.52, 'rgba(245, 199, 107, ALPHA)', 0.3);
        drawWaterLightPillar(w * 0.49, horizonY, h, dpr, elapsedSec, 12, 0.3, 'rgba(232, 168, 56, ALPHA)', 1.4);
      }

      // Moving riverboat golden wake reflection
      drawWaterLightPillar(boatX, horizonY, h, dpr, elapsedSec, 12, 0.18, 'rgba(255, 205, 110, ALPHA)', 3.1);

      // Sky lantern shimmer points on water
      for (const ref of lanternWaterReflections) {
        ctx.fillStyle = `rgba(255, 198, 92, ${ref.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(
          ref.x + Math.sin(elapsedSec * 2 + ref.x) * 3 * dpr,
          horizonY + 18 * dpr,
          8 * dpr,
          1.6 * dpr,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Diffused moon reflection corridor + broken silver wave glints
      const moonReflectRy = Math.max(1, (h - horizonY) * 0.44);
      const moonReflectRx = Math.max(1, 34 * dpr);
      ctx.save();
      ctx.translate(moonX, horizonY + moonReflectRy);
      ctx.scale(moonReflectRx, moonReflectRy);
      const moonWaterGrad = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
      moonWaterGrad.addColorStop(0, 'rgba(255, 240, 200, 0.14)');
      moonWaterGrad.addColorStop(0.45, 'rgba(255, 232, 178, 0.06)');
      moonWaterGrad.addColorStop(0.8, 'rgba(255, 232, 178, 0.015)');
      moonWaterGrad.addColorStop(1, 'rgba(255, 232, 178, 0)');
      ctx.fillStyle = moonWaterGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.lineCap = 'round';
      for (let i = 0; i < 24; i++) {
        const progress = i / 24;
        const ry = horizonY + 7 * dpr + progress * (h - horizonY) * 0.85;
        const waveShift =
          Math.sin(elapsedSec * 2.1 + i * 1.4) * (4 + progress * 12) * dpr;
        const glintW =
          (7 + progress * 16 + Math.cos(elapsedSec * 2.5 + i * 0.8) * 4) * dpr;
        const alpha = (0.3 - progress * 0.21).toFixed(3);
        ctx.strokeStyle = `rgba(255, 242, 204, ${alpha})`;
        ctx.lineWidth = (1.1 + progress * 1.2) * dpr;
        ctx.beginPath();
        ctx.moveTo(moonX + waveShift - glintW * 0.5, ry);
        ctx.lineTo(moonX + waveShift + glintW * 0.5, ry);
        ctx.stroke();

        if (i % 2 === 1) {
          const subX = moonX - waveShift * 0.7 + (i % 4 === 1 ? 14 : -14) * dpr;
          const subW = glintW * 0.45;
          ctx.beginPath();
          ctx.moveTo(subX - subW * 0.5, ry + 2 * dpr);
          ctx.lineTo(subX + subW * 0.5, ry + 2 * dpr);
          ctx.stroke();
        }
      }

      // Distant far-bank glowing krathongs drifting gently along the horizon
      const farKrathongs = [0.09, 0.27, 0.46, 0.66, 0.88];
      for (let fk = 0; fk < farKrathongs.length; fk++) {
        const fx =
          ((farKrathongs[fk] + elapsedSec * (0.004 + (fk % 2) * 0.002)) % 1.04 - 0.02) *
          w;
        const fy = horizonY + (11 + (fk % 3) * 8) * dpr;
        ctx.fillStyle = 'rgba(245, 190, 90, 0.18)';
        ctx.beginPath();
        ctx.arc(fx, fy, 5.5 * dpr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFE49E';
        ctx.beginPath();
        ctx.arc(fx, fy - 1 * dpr, 1.4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (loc.hasMist) {
        const mistGrad = ctx.createLinearGradient(
          0,
          horizonY - 12 * dpr,
          0,
          horizonY + 46 * dpr
        );
        mistGrad.addColorStop(0, 'rgba(200, 220, 235, 0)');
        mistGrad.addColorStop(0.5, 'rgba(200, 220, 235, 0.1)');
        mistGrad.addColorStop(1, 'rgba(200, 220, 235, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, horizonY - 12 * dpr, w, 58 * dpr);
      }

      // Flowing sinusoidal wave crests & currents across depth lanes
      for (let lane = 0; lane < 14; lane++) {
        const depth = (lane + 1) / 15;
        const baseY = horizonY + depth * (h - horizonY) * 0.94;
        const waveAmp = (0.8 + depth * 2.1) * dpr;
        const speed = 16 + depth * 22;
        const segStart = ((lane * 0.27 + elapsedSec * (speed / w)) % 1.2) - 0.15;
        const segLen = 0.16 + depth * 0.18;

        ctx.strokeStyle =
          lane % 3 === 0
            ? `rgba(186, 214, 242, ${(0.045 + depth * 0.045).toFixed(3)})`
            : `rgba(255, 220, 155, ${(0.03 + depth * 0.03).toFixed(3)})`;
        ctx.lineWidth = (0.8 + depth * 0.9) * dpr;
        ctx.beginPath();
        const steps = 10;
        for (let s = 0; s <= steps; s++) {
          const sx = (segStart + (s / steps) * segLen) * w;
          const sy =
            baseY + Math.sin(elapsedSec * 1.8 + lane * 1.7 + s * 0.7) * waveAmp;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Interactive water ripples from user taps
      const survivingRipples: WaterRipple[] = [];
      for (const rip of waterRipplesRef.current) {
        rip.life += dt;
        if (rip.life < rip.maxLife) {
          const p = rip.life / rip.maxLife;
          const rx = (12 + p * 54) * dpr;
          const ry = (4 + p * 16) * dpr;
          const alpha = (1 - p) * 0.55;
          ctx.strokeStyle = `rgba(245, 224, 178, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.4 * dpr;
          ctx.beginPath();
          ctx.ellipse(rip.xRatio * w, rip.yRatio * h, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          survivingRipples.push(rip);
        }
      }
      waterRipplesRef.current = survivingRipples;

      // Drifting rose petals scattered on water + faint water reflections
      const survivingPetals: RosePetal[] = [];
      for (const petal of petalsRef.current) {
        petal.life += dt;
        if (petal.life < 14) {
          petal.xRatio = (petal.xRatio + petal.speedX * dt) % 1.05;
          const px = petal.xRatio * w;
          const py =
            petal.yRatio * h +
            Math.sin(elapsedSec * 1.6 + petal.swayPhase) * 2.5 * dpr;
          const alpha = Math.min(0.88, Math.max(0, 1 - petal.life / 14));

          ctx.save();
          ctx.globalAlpha = alpha * 0.28;
          ctx.fillStyle = petal.color;
          ctx.beginPath();
          ctx.ellipse(px, py + 4 * dpr, 4.4 * dpr, 1.5 * dpr, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = alpha;
          ctx.fillStyle = petal.color;
          ctx.beginPath();
          ctx.ellipse(px, py, 4.5 * dpr, 2.5 * dpr, petal.swayPhase, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          survivingPetals.push(petal);
        }
      }
      petalsRef.current = survivingPetals;

      // 5. Floating krathongs (ambient + user couple krathongs)
      type RenderKrathong =
        | {
            kind: 'ambient';
            id: string;
            laneRatio: number;
            initialXRatio: number;
            speed: number;
            visualStyle: KrathongVisualStyle;
            candleCount: 1 | 2;
          }
        | {
            kind: 'user';
            item: FloatedKrathong;
          };

      const combined: RenderKrathong[] = [
        ...AMBIENT_EMPTY_KRATHONGS.map((amb) => ({
          kind: 'ambient' as const,
          ...amb,
        })),
        ...krathongsRef.current.map((item) => ({
          kind: 'user' as const,
          item,
        })),
      ].sort((a, b) => {
        const laneA = a.kind === 'ambient' ? a.laneRatio : a.item.laneRatio;
        const laneB = b.kind === 'ambient' ? b.laneRatio : b.item.laneRatio;
        return laneA - laneB;
      });

      const nextPositions: Array<{ id: string; x: number; y: number }> = [];

      for (const entry of combined) {
        const isUser = entry.kind === 'user';
        const laneRatio = isUser ? entry.item.laneRatio : entry.laneRatio;
        const initialXRatio = isUser
          ? entry.item.initialXRatio
          : entry.initialXRatio;
        const speed = isUser ? entry.item.speed : entry.speed;
        const visualStyle = isUser
          ? entry.item.visualStyle
          : entry.visualStyle;
        const candleCount = isUser
          ? entry.item.candleCount
          : entry.candleCount;

        const scale = (0.72 + laneRatio * 0.56) * dpr;
        const driftPx = elapsedSec * speed * dpr;
        const pad = 76 * dpr;
        const usableW = w + pad * 2;
        const x = ((initialXRatio * w + driftPx) % usableW) - pad;
        const bob = Math.sin(elapsedSec * 1.85 + initialXRatio * 10) * 2.8 * dpr;
        const y = horizonY + laneRatio * (h - horizonY) * 0.85 + bob;

        if (isUser) {
          nextPositions.push({ id: entry.item.id, x: x / dpr, y: y / dpr });
        }

        drawSingleKrathong({
          x,
          y,
          scale,
          dpr,
          elapsedSec,
          seedOffset: initialXRatio,
          visualStyle,
          candleCount,
          isSelected: isUser && activeIdRef.current === entry.item.id,
          label: isUser
            ? `${entry.item.yourName} & ${entry.item.partnerName}`
            : null,
        });
      }

      positionsRef.current = nextPositions;

      // 6. Foreground riverside lotus leaves, timber pier edge & fireflies
      // Subtle lotus pads framing bottom-left & bottom-right edge
      ctx.fillStyle = '#06121C';
      const lotusPads = [
        { cx: 0.05 * w, cy: 0.94 * h, rx: 28 * dpr, ry: 9 * dpr },
        { cx: 0.1 * w, cy: 0.96 * h, rx: 20 * dpr, ry: 7 * dpr },
        { cx: 0.94 * w, cy: 0.95 * h, rx: 26 * dpr, ry: 8.5 * dpr },
        { cx: 0.89 * w, cy: 0.97 * h, rx: 18 * dpr, ry: 6 * dpr },
      ];
      for (const pad of lotusPads) {
        ctx.beginPath();
        ctx.ellipse(pad.cx, pad.cy, pad.rx, pad.ry, 0, 0.25, Math.PI * 2);
        ctx.lineTo(pad.cx, pad.cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(130, 175, 175, 0.16)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
      }

      // Gentle blinking warm fireflies near river edge plants
      for (const ff of FIREFLIES) {
        const blink = Math.max(
          0,
          Math.sin(elapsedSec * ff.speed + ff.phase)
        );
        if (blink > 0.15) {
          const fx =
            (ff.xRatio + Math.sin(elapsedSec * 0.7 + ff.phase) * 0.012) * w;
          const fy =
            (ff.yRatio + Math.cos(elapsedSec * 0.9 + ff.phase) * 0.01) * h;
          ctx.fillStyle = `rgba(232, 168, 56, ${(blink * 0.2).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 6.5 * dpr, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 232, 145, ${(blink * 0.85).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 1.6 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReducedMotion && isVisible && !document.hidden) {
        animId = requestAnimationFrame(drawScene);
      } else {
        animId = 0;
      }
    };

    const resumeIfReady = () => {
      if (isVisible && !document.hidden && !prefersReducedMotion && animId === 0) {
        animId = requestAnimationFrame(drawScene);
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isVisible = Boolean(entry?.isIntersecting);
              resumeIfReady();
            },
            { threshold: 0.05 }
          )
        : null;

    if (observer) {
      observer.observe(canvas);
    }
    document.addEventListener('visibilitychange', resumeIfReady);

    animId = requestAnimationFrame(drawScene);

    return () => {
      cancelAnimationFrame(animId);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', resumeIfReady);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Click in sky launches firework right there
    if (clickY < rect.height * 0.41) {
      onTriggerFirework(
        Number((clickX / rect.width).toFixed(3)),
        Number((clickY / rect.height).toFixed(3))
      );
      return;
    }

    // Spawn expanding ripple on water surface wherever user taps
    waterRipplesRef.current.push({
      xRatio: clickX / rect.width,
      yRatio: clickY / rect.height,
      life: 0,
      maxLife: 1.5,
    });
    if (waterRipplesRef.current.length > 12) {
      waterRipplesRef.current = waterRipplesRef.current.slice(-12);
    }

    // Click on water selects nearby user krathong
    let closestId: string | null = null;
    let minDist = 48;

    for (const pos of positionsRef.current) {
      const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (dist < minDist) {
        minDist = dist;
        closestId = pos.id;
      }
    }

    if (closestId) {
      onSelectKrathong(closestId);
    }
  };

  const handleCopy = () => {
    onCopyRoomLink();
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <section
      id="river-stage"
      data-location={location.id}
      data-krathong-count={krathongs.length}
      data-room-id={roomId}
      className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-12"
    >
      {/* Hero Headline & Direct Action */}
      <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium text-[#E8A838]">
            คืนวันเพ็ญเดือนสิบสอง · ลอยกระทงร่วมกันแม้อยู่ไกลหรือใกล้
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#F5EFE6] sm:text-5xl [text-wrap:balance]">
            เลือกกระทงที่ชอบ เลือกสายน้ำที่ใช่ แล้วอธิษฐานไปด้วยกัน
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#A8B7CC]">
            ส่งลิงก์ห้องให้แฟนเข้ามาลอยพร้อมกันแบบเรียลไทม์ เลือกสถานที่โรแมนติก ช็อปกระทงจริง
            และบันทึกการ์ดความทรงจำคืนวันเพ็ญเก็บไว้ด้วยกัน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onStartJourney}
            className="rounded-lg bg-[#E8A838] px-5 py-3 text-sm font-semibold text-[#08111E] hover:bg-[#F2BA54] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
          >
            เริ่มเลือกสถานที่และซื้อกระทง
          </button>
        </div>
      </div>

      {/* Shared Couple Room & Live Effects Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#F5EFE6]/10 bg-[#101D30] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#A8B7CC]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#F5EFE6]">
            <Users className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
            ห้องคู่รัก: <span className="font-mono text-[#E8A838]">{roomId}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span data-testid="room-presence" className="tabular-nums">
            {wsConnected
              ? `ออนไลน์ด้วยกัน ${onlineCount} คน`
              : 'กำลังเชื่อมต่อห้อง...'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#182B47] px-2.5 py-1.5 text-xs font-medium text-[#F5EFE6] hover:bg-[#223B5E] transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
              )}
              <span>
                {copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ชวนแฟน'}
              </span>
            </button>
            <button
              type="button"
              onClick={onCreateNewRoom}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#F5EFE6]/12 bg-[#0D1829] px-2.5 py-1.5 text-xs font-medium text-[#A8B7CC] hover:text-[#F5EFE6] transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>สร้างห้องใหม่</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onTriggerFirework(0.52, 0.18)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#182B47] px-3 py-1.5 text-xs font-medium text-[#F5EFE6] hover:bg-[#223B5E] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
            <span>จุดพลุฉลอง</span>
          </button>

          <button
            type="button"
            onClick={onTriggerPetals}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#182B47] px-3 py-1.5 text-xs font-medium text-[#F5EFE6] hover:bg-[#223B5E] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Flower2 className="h-3.5 w-3.5 text-[#D97B8A]" aria-hidden="true" />
            <span>โปรยกลีบกุหลาบ</span>
          </button>

          <button
            type="button"
            aria-pressed={soundEnabled}
            onClick={onToggleSound}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              soundEnabled
                ? 'bg-[#E8A838] text-[#08111E]'
                : 'border border-[#F5EFE6]/15 bg-[#0D1829] text-[#A8B7CC] hover:text-[#F5EFE6]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>เสียงริมน้ำ: {soundEnabled ? 'เปิด' : 'ปิด'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Moonlit River Stage */}
      <div className="relative overflow-hidden rounded-2xl border border-[#F5EFE6]/12 bg-[#07101C]">
        {!imageFailed && (
          <img
            src={location.imageUrl}
            alt={`บรรยากาศริมน้ำ ${location.name}`}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}

        <canvas
          ref={canvasRef}
          data-testid="river-canvas"
          onClick={handleCanvasClick}
          aria-label={`ผืนน้ำจำลองสถานที่ ${location.name} แตะท้องฟ้าเพื่อจุดพลุ หรือแตะกระทงเพื่ออ่านคำอธิษฐาน`}
          className="relative z-10 block h-[340px] w-full cursor-pointer sm:h-[420px]"
        />

        {/* Top-left location caption */}
        <div className="pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-2 rounded-lg bg-[#08111E]/90 px-3 py-2 text-xs text-[#F5EFE6] border border-[#F5EFE6]/10">
          <MapPin className="h-3.5 w-3.5 text-[#E8A838] shrink-0" aria-hidden="true" />
          <span className="font-medium">{location.name}</span>
          <span className="text-[#A8B7CC]" aria-hidden="true">·</span>
          <span className="text-[#A8B7CC]">{location.province}</span>
        </div>

        {/* Selected Couple Wish Inspector or Clean Empty-River Prompt */}
        {activeKrathong ? (
          <div className="relative z-20 border-t border-[#F5EFE6]/10 bg-[#0D1829]/95 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8B7CC]">
                  <Sparkles className="h-3.5 w-3.5 text-[#E8A838] shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-[#F5EFE6]">
                    {activeKrathong.yourName} &amp; {activeKrathong.partnerName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeKrathong.krathongName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeKrathong.locationName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatThaiTime(activeKrathong.floatedAt)} น.
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[#F5EFE6]">
                  “{activeKrathong.wish}”
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onDownloadCard(activeKrathong)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E8A838]/40 bg-[#15253C] px-2.5 py-1.5 text-xs font-medium text-[#F5EFE6] hover:bg-[#1E3352] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#E8A838]" aria-hidden="true" />
                  <span>บันทึกการ์ดภาพ</span>
                </button>
                {krathongs.slice(0, 4).map((item) => {
                  const isCurrent = item.id === activeKrathong.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectKrathong(item.id)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838] ${
                        isCurrent
                          ? 'bg-[#E8A838] text-[#08111E]'
                          : 'bg-[#15253C] text-[#A8B7CC] hover:text-[#F5EFE6]'
                      }`}
                    >
                      {item.yourName} &amp; {item.partnerName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-20 border-t border-[#F5EFE6]/10 bg-[#0D1829]/95 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#A8B7CC]">
                ขณะนี้มีกระทงเปล่าลอยอยู่ใต้แสงจันทร์ (แตะท้องฟ้าเพื่อจุดพลุได้) · เขียนคำอธิษฐานคู่เพื่อปล่อยกระทงลงน้ำ
              </p>
              <button
                type="button"
                onClick={onGoToFloat}
                className="rounded-md bg-[#182B47] px-3.5 py-2 text-xs font-semibold text-[#F5EFE6] hover:bg-[#223B5E] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8A838]"
              >
                ไปเขียนคำอธิษฐาน
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
