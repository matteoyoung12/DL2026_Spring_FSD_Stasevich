import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QRType, QRConfig, WiFiData, VCardData } from "../types";
import { HexColorPicker } from "react-colorful";
import { 
  Link, Type, Wifi, Contact, Download, Share2, 
  Settings2, Palette, History as HistoryIcon, 
  Check, Copy, Trash2, ExternalLink, Save,
  Image as ImageIcon, X, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function QRCodeGenerator({ onSave }: { onSave: () => void }) {
  const [type, setType] = useState<QRType>("url");
  const [content, setContent] = useState("");
  const [wifiData, setWifiData] = useState<WiFiData>({ ssid: "", encryption: "WPA", hidden: false });
  const [vcardData, setVcardData] = useState<VCardData>({ firstName: "", lastName: "", phone: "", email: "" });
  
  const [config, setConfig] = useState<QRConfig>({
    fgColor: "#000000",
    bgColor: "#ffffff",
    level: "H", // Default to High for logos
    margin: 4,
    scale: 10,
    borderRadius: 0,
    logo: undefined,
    gradient: {
      enabled: false,
      color2: "#4f46e5",
      type: "linear"
    }
  });

  const [showFgPicker, setShowFgPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate QR Content based on type
  const getFinalContent = () => {
    switch (type) {
      case "url": return content.startsWith("http") ? content : `https://${content}`;
      case "text": return content;
      case "wifi": 
        return `WIFI:S:${wifiData.ssid};T:${wifiData.encryption};P:${wifiData.password || ""};H:${wifiData.hidden ? "true" : "false"};;`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardData.lastName};${vcardData.firstName}\nFN:${vcardData.firstName} ${vcardData.lastName}\nTEL;TYPE=CELL:${vcardData.phone}\nEMAIL:${vcardData.email}\nORG:${vcardData.organization || ""}\nTITLE:${vcardData.title || ""}\nURL:${vcardData.url || ""}\nEND:VCARD`;
      default: return "";
    }
  };

  const drawLogo = (canvas: HTMLCanvasElement, logoSrc: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const qrSize = canvas.width;
      const logoSize = qrSize * 0.22; // Slightly larger logo
      const x = (qrSize - logoSize) / 2;
      const y = (qrSize - logoSize) / 2;

      // Draw rounded background for logo to make it more noticeable
      const padding = 6;
      const bgSize = logoSize + padding * 2;
      const bgX = (qrSize - bgSize) / 2;
      const bgY = (qrSize - bgSize) / 2;
      
      ctx.save();
      // Shadow for the logo background
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      ctx.fillStyle = config.bgColor;
      // Rounded rectangle for background
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
      
      // Draw logo with rounded corners if possible, or just centered
      ctx.drawImage(img, x, y, logoSize, logoSize);
      
      // Update the preview URL
      setQrUrl(canvas.toDataURL("image/png"));
    };
    img.src = logoSrc;
  };

  const generateQR = async () => {
    const finalContent = getFinalContent();
    if (!finalContent) return;

    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, finalContent, {
          errorCorrectionLevel: config.level,
          margin: config.margin,
          scale: config.scale,
          color: {
            dark: config.fgColor,
            light: config.bgColor,
          },
        });

        if (config.logo) {
          drawLogo(canvasRef.current, config.logo);
        } else {
          setQrUrl(canvasRef.current.toDataURL("image/png"));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    generateQR();
  }, [type, content, wifiData, vcardData, config]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig({ ...config, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (format: "png" | "svg") => {
    const link = document.createElement("a");
    link.download = `qrcraft-${Date.now()}.${format}`;
    link.href = qrUrl;
    link.click();
  };

  const handleSave = async () => {
    const finalContent = getFinalContent();
    const id = Math.random().toString(36).substring(2, 10);
    
    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          content: finalContent,
          type,
          config
        })
      });
      if (res.ok) {
        onSave();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Hidden Canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Left Column: Input & Config */}
      <div className="lg:col-span-7 space-y-6">
        {/* Type Selector */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {(["url", "text", "wifi", "vcard"] as QRType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                type === t 
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {t === "url" && <Link size={16} />}
              {t === "text" && <Type size={16} />}
              {t === "wifi" && <Wifi size={16} />}
              {t === "vcard" && <Contact size={16} />}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>

        {/* Input Forms */}
        <motion.div 
          layout
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm"
        >
          {type === "url" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">URL Адрес</label>
              <input
                type="text"
                placeholder="https://example.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {type === "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Текст</label>
              <textarea
                placeholder="Введите ваш текст здесь..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SSID (Название сети)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  value={wifiData.ssid}
                  onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Пароль</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  value={wifiData.password || ""}
                  onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Шифрование</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  value={wifiData.encryption}
                  onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value as any })}
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Без пароля</option>
                </select>
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Имя"
                className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                value={vcardData.firstName}
                onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
              />
              <input
                placeholder="Фамилия"
                className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                value={vcardData.lastName}
                onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
              />
              <input
                placeholder="Телефон"
                className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                value={vcardData.phone}
                onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
              />
              <input
                placeholder="Email"
                className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                value={vcardData.email}
                onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
              />
            </div>
          )}
        </motion.div>

        {/* Customization Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Palette size={20} />
            <h2>Внешний вид</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* Foreground Color */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Цвет кода</label>
                <button 
                  onClick={() => { setShowFgPicker(!showFgPicker); setShowBgPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md border border-zinc-200 shadow-sm" style={{ backgroundColor: config.fgColor }} />
                    <span className="text-sm font-mono uppercase">{config.fgColor}</span>
                  </div>
                  <ChevronDown size={16} className={cn("transition-transform", showFgPicker && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showFgPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 top-full left-0 mt-2 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700"
                    >
                      <HexColorPicker color={config.fgColor} onChange={(color) => setConfig({ ...config, fgColor: color })} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Background Color */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Цвет фона</label>
                <button 
                  onClick={() => { setShowBgPicker(!showBgPicker); setShowFgPicker(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md border border-zinc-200 shadow-sm" style={{ backgroundColor: config.bgColor }} />
                    <span className="text-sm font-mono uppercase">{config.bgColor}</span>
                  </div>
                  <ChevronDown size={16} className={cn("transition-transform", showBgPicker && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {showBgPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 top-full left-0 mt-2 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700"
                    >
                      <HexColorPicker color={config.bgColor} onChange={(color) => setConfig({ ...config, bgColor: color })} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Уровень коррекции (L-H)</label>
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  {["L", "M", "Q", "H"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setConfig({ ...config, level: l as any })}
                      className={cn(
                        "flex-1 py-1 rounded-md text-xs font-bold transition-all",
                        config.level === l ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-sm font-medium block mb-3">Логотип в центре</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
              >
                <ImageIcon size={16} />
                {config.logo ? "Изменить лого" : "Выбрать лого"}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              {config.logo && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-white">
                    <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <button 
                    onClick={() => setConfig({ ...config, logo: undefined })}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              Рекомендуется использовать квадратные изображения с прозрачным фоном.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-5">
        <div className="sticky top-8 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative group">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={qrUrl}
                className="p-6 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 transition-all duration-300"
                style={{ backgroundColor: config.bgColor }}
              >
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                ) : (
                  <div className="w-64 h-64 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-400 text-sm text-center px-8">Введите данные для генерации кода</p>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="mt-8 w-full grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDownload("png")}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Download size={18} />
                PNG
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                <Save size={18} />
                Сохранить
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
              <strong>Совет:</strong> При добавлении логотипа мы автоматически устанавливаем высокий уровень коррекции (H), чтобы код оставался читаемым.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
