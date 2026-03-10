import React, { useRef, useState } from "react";
import QRCode from "qrcode";
import { QRCodeData } from "../types";
import { Trash2, Calendar, BarChart3, Download, Maximize2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryProps {
  items: QRCodeData[];
  onDelete: (id: string) => void;
}

export default function History({ items, onDelete }: HistoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedItem, setSelectedItem] = useState<QRCodeData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleDownload = async (item: QRCodeData) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      await QRCode.toCanvas(canvas, item.content, {
        errorCorrectionLevel: item.config.level,
        margin: item.config.margin,
        scale: 10,
        color: { dark: item.config.fgColor, light: item.config.bgColor },
      });
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
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qrcraft-${item.id}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleCopyLink = async (item: QRCodeData) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(item.content)}&color=${item.config.fgColor.replace("#", "")}&bgcolor=${item.config.bgColor.replace("#", "")}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
      const url = `${window.location.origin}/qr/${item.id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotation({ x: ((centerY - y) / centerY) * 15, y: ((x - centerX) / centerX) * 15 });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">История пуста. Создайте свой первый QR-код!</p>
      </div>
    );
  }

  const typeIcons: Record<string, string> = { url: "🔗", text: "📝", wifi: "📶", vcard: "👤" };
  const typeColors: Record<string, string> = { 
    url: "from-blue-500 to-cyan-500", 
    text: "from-purple-500 to-pink-500", 
    wifi: "from-green-500 to-emerald-500", 
    vcard: "from-orange-500 to-amber-500" 
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <canvas ref={canvasRef} className="hidden" />
        {items.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20, rotateY: -5 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: index * 0.05, type: "spring" }}
            key={item.id}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex gap-4">
                <div className="relative cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden"
                    whileHover={{ scale: 1.05, rotateY: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.content)}&color=${item.config.fgColor.replace("#", "")}&bgcolor=${item.config.bgColor.replace("#", "")}`} alt="QR" className="w-20 h-20 object-contain" />
                  </motion.div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Maximize2 size={12} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r ${typeColors[item.type] || "from-indigo-500 to-purple-500"} text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-md`}>
                      <span>{typeIcons[item.type] || "📄"}</span>
                      {item.type}
                    </span>
                    <button onClick={() => onDelete(item.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.content}</p>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                      <Calendar size={12} />
                      {new Date(item.created_at).toLocaleDateString("ru-RU")}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                      <BarChart3 size={12} />
                      {item.scan_count}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button onClick={() => handleCopyLink(item)} className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors" title="Копировать">
                  {copiedId === item.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
                <button onClick={() => handleDownload(item)} className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors" title="Скачать">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-lg">
                <motion.div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700" style={{ transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transition: "transform 0.1s ease-out" }} onMouseMove={handleMouseMove} onMouseLeave={() => setRotation({ x: 0, y: 0 })}>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Maximize2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">QR Code</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide">{selectedItem.type}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                      <Check size={20} className="text-zinc-500" />
                    </button>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-purple-950/30">
                    <motion.div className="relative mx-auto w-64 h-64" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                      <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                      <div className="relative bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(selectedItem.content)}&color=${selectedItem.config.fgColor.replace("#", "")}&bgcolor=${selectedItem.config.bgColor.replace("#", "")}`} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                    </motion.div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-1">Содержимое</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{selectedItem.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Дата создания</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{new Date(selectedItem.created_at).toLocaleDateString("ru-RU")}</p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">Сканирований</p>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{selectedItem.scan_count}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-3">
                    <button onClick={() => { handleCopyLink(selectedItem); }} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors">
                      {copiedId === selectedItem.id ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                      {copiedId === selectedItem.id ? "Скопировано" : "Копия"}
                    </button>
                    <button onClick={() => handleDownload(selectedItem)} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-xl text-sm font-medium transition-colors text-indigo-700 dark:text-indigo-300">
                      <Download size={18} />
                      Скачать
                    </button>
                  </div>
                </motion.div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-xs text-zinc-500 mt-4">
                  Наведите курсор для 3D эффекта
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
