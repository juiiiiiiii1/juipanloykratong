import {
  KRATHONG_ITEMS,
  LOY_KRATHONG_LOCATIONS,
  type FloatedKrathong,
} from '../data/loyKrathongData';
import { formatThaiDate, formatThaiTime } from './loyKrathongLogic';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Fallback character wrap for long Thai continuous strings
      if (ctx.measureText(word).width > maxWidth) {
        let slice = '';
        for (const ch of word) {
          if (ctx.measureText(slice + ch).width > maxWidth) {
            lines.push(slice);
            slice = ch;
          } else {
            slice += ch;
          }
        }
        current = slice;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function compressCouplePhoto(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      }
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  if (!img) {
    throw new Error('ไฟล์รูปภาพไม่ถูกต้อง');
  }

  const maxDim = 480;
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const targetW = Math.max(1, Math.round(img.width * ratio));
  const targetH = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', 0.78);
}

export async function downloadMemoryCardPng(
  item: FloatedKrathong
): Promise<void> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const loc =
    LOY_KRATHONG_LOCATIONS.find((l) => l.id === item.locationId) ??
    LOY_KRATHONG_LOCATIONS[0];
  const krathong =
    KRATHONG_ITEMS.find((k) => k.id === item.krathongId) ?? KRATHONG_ITEMS[0];

  const [locImg, krathongImg, coupleImg] = await Promise.all([
    loadImage(loc.imageUrl),
    loadImage(krathong.imageUrl),
    item.photoDataUrl ? loadImage(item.photoDataUrl) : Promise.resolve(null),
  ]);

  // Background fill
  ctx.fillStyle = '#08111E';
  ctx.fillRect(0, 0, width, height);

  // Top scenic location banner
  const heroH = 540;
  if (locImg) {
    const scale = Math.max(width / locImg.width, heroH / locImg.height);
    const drawW = locImg.width * scale;
    const drawH = locImg.height * scale;
    ctx.drawImage(
      locImg,
      (width - drawW) / 2,
      (heroH - drawH) / 2,
      drawW,
      drawH
    );
  }

  const scrim = ctx.createLinearGradient(0, 120, 0, heroH + 40);
  scrim.addColorStop(0, 'rgba(8, 17, 30, 0.15)');
  scrim.addColorStop(0.7, 'rgba(8, 17, 30, 0.75)');
  scrim.addColorStop(1, '#08111E');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, heroH + 40);

  // Subtle gold frame border
  ctx.strokeStyle = 'rgba(232, 168, 56, 0.38)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Header brand
  ctx.fillStyle = '#E8A838';
  ctx.font = '600 28px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ลอยกระทงของจุ้ยกับแพน · บันทึกคืนวันเพ็ญ', 80, 96);

  // Overlapping circular/rounded photos (Krathong + optional Couple Photo)
  const centerY = 470;
  if (coupleImg && krathongImg) {
    // Two framed rounded cards side-by-side
    const drawFramed = (
      img: HTMLImageElement,
      cx: number,
      cy: number,
      size: number
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 24);
      ctx.clip();
      const s = Math.max(size / img.width, size / img.height);
      ctx.drawImage(
        img,
        cx - (img.width * s) / 2,
        cy - (img.height * s) / 2,
        img.width * s,
        img.height * s
      );
      ctx.restore();
      ctx.strokeStyle = '#E8A838';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 24);
      ctx.stroke();
    };
    drawFramed(coupleImg, width / 2 - 145, centerY, 240);
    drawFramed(krathongImg, width / 2 + 145, centerY, 240);
  } else if (krathongImg) {
    const size = 270;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(width / 2 - size / 2, centerY - size / 2, size, size, 28);
    ctx.clip();
    const s = Math.max(size / krathongImg.width, size / krathongImg.height);
    ctx.drawImage(
      krathongImg,
      width / 2 - (krathongImg.width * s) / 2,
      centerY - (krathongImg.height * s) / 2,
      krathongImg.width * s,
      krathongImg.height * s
    );
    ctx.restore();
    ctx.strokeStyle = '#E8A838';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(width / 2 - size / 2, centerY - size / 2, size, size, 28);
    ctx.stroke();
  }

  // Couple Names
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F5EFE6';
  ctx.font = '700 58px "Noto Serif Thai", serif';
  ctx.fillText(`${item.yourName} & ${item.partnerName}`, width / 2, 710);

  // Location & Krathong metadata
  ctx.fillStyle = '#E8A838';
  ctx.font = '500 28px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText(`${item.locationName} · ${item.krathongName}`, width / 2, 768);

  // Divider
  ctx.strokeStyle = 'rgba(245, 239, 230, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, 815);
  ctx.lineTo(width - 160, 815);
  ctx.stroke();

  // Wish text
  ctx.fillStyle = '#F5EFE6';
  ctx.font = '500 36px "Noto Serif Thai", serif';
  const wishLines = wrapTextLines(ctx, `“${item.wish}”`, width - 200).slice(
    0,
    5
  );
  wishLines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, 895 + idx * 56);
  });

  // Footer date & time
  ctx.fillStyle = '#A8B7CC';
  ctx.font = '400 24px "IBM Plex Sans Thai", sans-serif';
  const thaiDate = formatThaiDate(item.floatedAt);
  const thaiTime = formatThaiTime(item.floatedAt);
  ctx.fillText(
    `${thaiDate} · เวลา ${thaiTime} น.`,
    width / 2,
    height - 96
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `loy-krathong-${item.yourName}-${item.partnerName}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
