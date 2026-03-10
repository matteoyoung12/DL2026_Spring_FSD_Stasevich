import React, { useState, useEffect } from "react";
import QRCodeGenerator from "./components/QRCodeGenerator";
import History from "./components/History";
import { QRCodeData } from "./types";
import { QrCode, Sparkles, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [history, setHistory] = useState<QRCodeData[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      await fetch("/api/qr/" + id, { method: "DELETE" });
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <QrCode size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">QR Craft</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("generate")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "generate" 
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Генератор
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "history" 
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                История
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="md:hidden mb-8 flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "generate" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
            }`}
          >
            Генератор
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "history" ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"
            }`}
          >
            История
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "generate" ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold mb-2">Создайте свой QR-код</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Выберите тип данных и настройте стиль под ваш бренд.</p>
              </div>
              <QRCodeGenerator onSave={fetchHistory} />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-10 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Ваша история</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Все ваши сгенерированные коды и статистика их сканирований.</p>
                </div>
                <div className="hidden sm:block">
                   <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 rounded-xl">
                     <Sparkles size={16} />
                     Всего кодов: {history.length}
                   </div>
                </div>
              </div>
              <History items={history} onDelete={deleteFromHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-zinc-500">
            © 2026 QR Craft. Сделано с ❤️ для devcraft lab.
          </p>
        </div>
      </footer>
    </div>
  );
}
