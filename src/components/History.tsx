import React, { useRef } from "react";
import QRCode from "qrcode";
import { QRCodeData } from "../types";
import { Trash2, ExternalLink, Calendar, BarChart3, Download } from "lucide-react";
import { motion } from "motion/react";

interface HistoryProps {
  items: QRCodeData[];
  onDelete: (id: string) => void;
}

export default function History({ items, onDelete }: HistoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = async (item: QRCodeData) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Generate the base QR code on the hidden canvas
      await QRCode.toCanvas(canvas, item.content, {
        errorCorrectionLevel: item.config.level,
        margin: item.config.margin,
        scale: 10, // High quality for download
        color: {
          dark: item.config.fgColor,
          light: item.config.bgColor,
        },
      });

      // If there's a logo, draw it
      if (item.config.logo) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = item.config.logo!;
        });

        const qrSize = canvas.width;
        const logoSize = qrSize * 0.22;
        const x = (qrSize - logoSize) / 2;
        const y = (qrSize - logoSize) / 2;

        const padding = 6;
        const bgSize = logoSize + padding * 2;
        const bgX = (qrSize - bgSize) / 2;
        const bgY = (qrSize - bgSize) / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = item.config.bgColor;
        
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(bgX + radius, bgY);
        ctx.lineTo(bgX + bgSize - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + radius);
        ctx.lineTo(bgX + bgSize, bgY + bgSize - radius);
        ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - radius, bgY + bgSize);
        ctx.lineTo(bgX + radius, bgY + bgSize);
        ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - radius);
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.drawImage(img, x, y, logoSize, logoSize);
      }

      // Trigger download
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qrcraft-${item.id}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">История пуста. Создайте свой первый QR-код!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <canvas ref={canvasRef} className="hidden" />
      {items.map((item, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          key={item.id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex-shrink-0 border border-zinc-100 dark:border-zinc-800 p-1">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.content)}&color=${item.config.fgColor.replace("#", "")}&bgcolor=${item.config.bgColor.replace("#", "")}`} 
                alt="QR" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded tracking-wider">
                  {item.type}
                </span>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {item.content}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <BarChart3 size={12} />
                  {item.scan_count} сканов
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
             <a 
              href={`/s/${item.id}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
             >
               Динамическая ссылка <ExternalLink size={10} />
             </a>
             <button 
              onClick={() => handleDownload(item)}
              className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
             >
               <Download size={14} />
             </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
