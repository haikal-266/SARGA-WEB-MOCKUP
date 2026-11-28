export interface WatermarkStampConfig {
  organizationName: string;
  picName: string;
  picContact: string;
  picPosition?: string;
  fingerprint: string;
  watermarkEnabled?: boolean;
  applyGrayscale?: boolean;
}

export function formatWibTimestamp(date = new Date()): string {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const wib = new Date(utcMs + 7 * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())} ${pad(wib.getHours())}:${pad(wib.getMinutes())}:${pad(wib.getSeconds())} WIB`;
}

export function generateDocumentFingerprint(): string {
  return `SRG-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function applyGrayscaleFilter(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Luminance formula for natural identity document black & white
      const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Fallback if canvas is tainted (cross-origin)
    ctx.save();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export function paintForensicWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: WatermarkStampConfig
): void {
  const timestamp = formatWibTimestamp();
  const banner = `HANYA UNTUK VERIFIKASI KEANGGOTAAN SARGA ${config.organizationName.toUpperCase()}`;

  // Watermark diagonal berulang
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const diag = Math.hypot(w, h);
  const stepY = Math.max(76, Math.round(h / 5));
  const fontSize = Math.max(13, Math.round(w / 44));

  for (let y = -diag / 2; y <= diag / 2; y += stepY) {
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(15, 118, 110, 0.32)';
    ctx.fillText(banner, 0, y);

    ctx.font = `700 ${Math.max(11, fontSize - 2)}px monospace`;
    ctx.fillStyle = 'rgba(17, 17, 17, 0.28)';
    ctx.fillText(`PJ: ${config.picName} (${config.picContact}) · ${timestamp}`, 0, y + fontSize + 6);
  }
  ctx.restore();

  // Kotak data resmi penanggung jawab di bagian bawah
  const boxHeight = Math.max(84, Math.round(h * 0.23));
  const padX = Math.max(16, Math.round(w * 0.03));
  const boxY = h - boxHeight;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, boxY, w, boxHeight);

  // Garis atas teal
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(0, boxY, w, 3);

  ctx.fillStyle = '#5eead4';
  ctx.font = `700 ${Math.max(12, Math.round(w / 58))}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lineGap = Math.max(16, Math.round((boxHeight - 18) / 4));
  const startY = boxY + 10;
  ctx.fillText(banner, padX, startY, w - padX * 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.max(11, Math.round(w / 64))}px monospace`;
  const posText = config.picPosition ? ` (${config.picPosition})` : '';
  ctx.fillText(`PENANGGUNG JAWAB : ${config.picName}${posText}`, padX, startY + lineGap, w - padX * 2);
  ctx.fillText(`KONTAK RESMI WA  : ${config.picContact}`, padX, startY + lineGap * 2, w - padX * 2);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `500 ${Math.max(10, Math.round(w / 68))}px monospace`;
  ctx.fillText(
    `TANGGAL PENGAJUAN: ${timestamp} | KODE VERIFIKASI: ${config.fingerprint}`,
    padX,
    startY + lineGap * 3,
    w - padX * 2
  );
  ctx.restore();
}

export function renderWatermarkedDocument(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  config: WatermarkStampConfig
): void {
  const rawW = img.naturalWidth || 960;
  const rawH = img.naturalHeight || 600;
  const scale = rawW > 1024 ? 1024 / rawW : rawW < 640 ? 800 / rawW : 1;
  const w = Math.max(480, Math.round(rawW * scale));
  const h = Math.max(300, Math.round(rawH * scale));

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // 1. Ubah ke Grayscale untuk dokumen identitas
  if (config.applyGrayscale !== false) {
    applyGrayscaleFilter(ctx, w, h);
  }

  // 2. Sematkan watermark forensik
  if (config.watermarkEnabled !== false) {
    paintForensicWatermark(ctx, w, h, config);
  }
}
