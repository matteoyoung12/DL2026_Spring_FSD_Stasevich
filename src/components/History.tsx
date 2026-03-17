import React, { useRef, useState, useMemo } from "react";
import QRCode from "qrcode";
import { QRCodeData, QRType } from "../types";
import {
  Trash2, Calendar, BarChart3, Download, Maximize2, Copy, Check,
  Search, Star, StarOff, Filter, SortAsc, SortDesc, Grid, List,
  X, Heart, Tag, Clock, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryProps {
  items: QRCodeData[];
  onDelete: (id: string) => void;
  onToggleFavorite?: (id: string, favorite: boolean) => void;
  onUpdateNote?: (id: string, note: string) => void;
}

type SortOption = "newest" | "oldest" | "name" | "popular" | "type";
type ViewMode = "grid" | "list";

export default function History({ items, onDelete, onToggleFavorite, onUpdateNote }: HistoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedItem, setSelectedItem] = useState<QRCodeData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<QRType | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  const qrTypes: QRType[] = ["url", "text", "wifi", "vcard", "email", "sms", "event"];

  const typeIcons: Record<string, string> = {
    url: "🔗", text: "📝", wifi: "📶", vcard: "👤",
    email: "📧", sms: "💬", event: "📅"
  };

  const typeColors: Record<string, string> = {
    url: "from-blue-500 to-cyan-500",
    text: "from-purple-500 to-pink-500",
    wifi: "from-green-500 to-emerald-500",
    vcard: "from-orange-500 to-amber-500",
    email: "from-red-500 to-rose-500",
    sms: "from-indigo-500 to-violet-500",
    event: "from-teal-500 to-cyan-500"
  };

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.content.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.note?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== "all") {
      result = result.filter(item => item.type === selectedType);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter(item => item.favorite);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.content.localeCompare(b.content);
        case "popular":
          return b.scan_count - a.scan_count;
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, selectedType, showFavoritesOnly, sortBy]);

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

  const handleToggleFavorite = (id: string, currentFavorite: boolean) => {
    onToggleFavorite?.(id, !currentFavorite);
  };

  const handleSaveNote = (id: string) => {
    // Save note to database via API
    fetch(`/api/qr/${id}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteValue })
    }).then(() => {
      // Update local selectedItem state immediately
      setSelectedItem(prev => prev ? { ...prev, note: noteValue } : null);
      // Update parent state
      onUpdateNote?.(id, noteValue);
      setEditingNote(null);
    });
  };

  const stats = useMemo(() => ({
    total: items.length,
    favorites: items.filter(i => i.favorite).length,
    totalScans: items.reduce((sum, i) => sum + i.scan_count, 0),
    byType: qrTypes.reduce((acc, type) => {
      acc[type] = items.filter(i => i.type === type).length;
      return acc;
    }, {} as Record<QRType, number>)
  }), [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">История пуста. Создайте свой первый QR-код!</p>
      </div>
    );
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Grid size={20} />
            </div>
            <div>
              <p className="text-xs text-white/80">Всего</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-xs text-white/80">Избранное</p>
              <p className="text-2xl font-bold">{stats.favorites}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-white/80">Сканирований</p>
              <p className="text-2xl font-bold">{stats.totalScans}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Tag size={20} />
            </div>
            <div>
              <p className="text-xs text-white/80">Типов</p>
              <p className="text-2xl font-bold">{Object.values(stats.byType).filter(v => v > 0).length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Поиск по содержимому..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters || selectedType !== "all" || showFavoritesOnly
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="name">По названию</option>
              <option value="popular">По популярности</option>
              <option value="type">По типу</option>
            </select>
            {sortBy === "oldest" ? (
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            ) : (
              <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            )}
          </div>

          {/* View Mode */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType("all")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedType === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Все
                  </button>
                  {qrTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedType === type
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <span>{typeIcons[type]}</span>
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                  <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-2" />
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      showFavoritesOnly
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {showFavoritesOnly ? <Star size={14} /> : <StarOff size={14} />}
                    Избранное
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">
          Показано {filteredItems.length} из {items.length}
        </p>
        {(searchQuery || selectedType !== "all" || showFavoritesOnly) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setShowFavoritesOnly(false);
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">Ничего не найдено по заданным фильтрам</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFavorite(item.id, item.favorite || false)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.favorite
                              ? "text-amber-500 hover:text-amber-600"
                              : "text-zinc-400 hover:text-amber-500"
                          }`}
                        >
                          {item.favorite ? <Star size={16} className="fill-current" /> : <Star size={16} />}
                        </button>
                        <button onClick={() => onDelete(item.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.content}</p>
                    {item.note && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg truncate">
                        📌 {item.note}
                      </p>
                    )}
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
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              key={item.id}
              whileHover={{ x: 4 }}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.content)}&color=${item.config.fgColor.replace("#", "")}&bgcolor=${item.config.bgColor.replace("#", "")}`} alt="QR" className="w-14 h-14 object-contain" />
                  </motion.div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${typeColors[item.type] || "from-indigo-500 to-purple-500"} text-white text-[10px] font-bold uppercase rounded-full`}>
                      <span>{typeIcons[item.type] || "📄"}</span>
                      {item.type}
                    </span>
                    {item.note && (
                      <span className="text-xs text-zinc-500">📌 {item.note}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.content}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(item.created_at).toLocaleDateString("ru-RU")}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                      <BarChart3 size={12} />
                      {item.scan_count}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(item.id, item.favorite || false)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.favorite
                        ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                        : "text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {item.favorite ? <Star size={18} className="fill-current" /> : <Star size={18} />}
                  </button>
                  <button onClick={() => handleCopyLink(item)} className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
                    {copiedId === item.id ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                  </button>
                  <button onClick={() => handleDownload(item)} className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
                    <Download size={18} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-lg">
                <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
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
                      <X size={20} className="text-zinc-500" />
                    </button>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-purple-950/30">
                    <motion.div className="relative mx-auto w-64 h-64" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                      <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                      <div className="relative bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(selectedItem.content)}&color=${selectedItem.config.fgColor.replace("#", "")}&bgcolor=${selectedItem.config.bgColor.replace("#", "")}`} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                    </motion.div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-1">Содержимое</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-all">{selectedItem.content}</p>
                    </div>
                    {editingNote === selectedItem.id ? (
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          placeholder="Добавить заметку..."
                          className="w-full bg-transparent outline-none text-sm resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNote(selectedItem.id)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg hover:bg-zinc-300"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Заметка</p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedItem.note || "Нет заметки"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingNote(selectedItem.id);
                            setNoteValue(selectedItem.note || "");
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
                        >
                          <Tag size={16} />
                        </button>
                      </div>
                    )}
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
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
