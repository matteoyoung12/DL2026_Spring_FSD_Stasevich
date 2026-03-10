# DL2026_Spring_FSD_Stasevich
# QR Craft

**Профессиональный генератор QR-кодов с кастомизацией, историей и аналитикой сканирований**

---

## 🚀 Возможности

- **Генерация QR-кодов** различных типов (URL, текст, email, телефон)
- **Кастомизация дизайна**: выбор цвета переднего плана и фона
- **История созданных QR-кодов** с возможностью повторного просмотра и удаления
- **Аналитика сканирований**: отслеживание количества просмотров каждого QR-кода
- **Красивая landing page** для каждого QR-кода по ссылке `/s/:id`
- **Сохранение в базу данных** SQLite (better-sqlite3)
- **Современный UI** с анимациями на Motion и Tailwind CSS
- **Иконки Lucide React** для элегантного дизайна

---

## 🛠 Технологии

| Категория | Технологии |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Стили** | Tailwind CSS 4, Motion |
| **Backend** | Node.js, Express |
| **База данных** | SQLite (better-sqlite3) |
| **Генерация QR** | QRCode, QRServer API |
| **Иконки** | Lucide React |
| **Утилиты** | clsx, tailwind-merge |

---

## 📦 Установка и запуск

### Предварительные требования

- Node.js (версия 18 или выше)
- npm или yarn

### Шаги установки

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте переменные окружения:**
   
   Создайте файл `.env.local` на основе `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   
   Отредактируйте `.env.local` и укажите ваш Gemini API ключ:
   ```
   GEMINI_API_KEY="your_gemini_api_key_here"
   APP_URL="http://localhost:3000"
   ```

3. **Запустите сервер разработки:**
   ```bash
   npm run dev
   ```
   
   Приложение будет доступно по адресу: **http://localhost:3000**

---

## 📜 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск сервера разработки (Vite + Express) |
| `npm run build` | Сборка проекта для продакшена |
| `npm run preview` | Предварительный просмотр продакшен-сборки |
| `npm run clean` | Очистка директории `dist` |
| `npm run lint` | Проверка TypeScript (без компиляции) |
| `npm run start` | Запуск продакшен-сервера |

---

## 🗄️ Структура базы данных

Таблица `qr_codes`:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | TEXT | Уникальный идентификатор (PRIMARY KEY) |
| `content` | TEXT | Содержимое QR-кода |
| `type` | TEXT | Тип QR-кода (url, text, email, phone) |
| `config` | TEXT | JSON с настройками (цвета и т.д.) |
| `created_at` | DATETIME | Дата и время создания |
| `scan_count` | INTEGER | Количество сканирований |

---

## 🌐 API Endpoints

### `POST /api/qr`
Сохранение нового QR-кода в базу данных.

**Request Body:**
```json
{
  "id": "unique-id-123",
  "content": "https://example.com",
  "type": "url",
  "config": {
    "fgColor": "#000000",
    "bgColor": "#ffffff"
  }
}
```

**Response:**
```json
{ "success": true }
```

---

### `GET /api/history`
Получение истории всех созданных QR-кодов.

**Response:**
```json
[
  {
    "id": "unique-id-123",
    "content": "https://example.com",
    "type": "url",
    "config": { "fgColor": "#000000", "bgColor": "#ffffff" },
    "created_at": "2026-03-10T12:00:00.000Z",
    "scan_count": 5
  }
]
```

---

### `DELETE /api/qr/:id`
Удаление QR-кода из истории.

**Response:**
```json
{ "success": true }
```

---

### `GET /s/:id`
Landing page для QR-кода с аналитикой и редиректом.

- Отображает красивую страницу с QR-кодом
- Показывает количество сканирований
- Автоматически увеличивает счётчик сканирований
- Содержит кнопку для перехода по ссылке (если это URL)

---

## 📁 Структура проекта

```
f:\DL2026_Spring_FSD_Stasevich\
├── src/
│   ├── App.tsx              # Главный компонент приложения
│   ├── main.tsx             # Точка входа React
│   ├── index.css            # Глобальные стили
│   ├── types.ts             # TypeScript типы
│   └── components/
│       └── History.tsx      # Компонент истории QR-кодов
├── server.ts                # Express сервер с API и базой данных
├── index.html               # HTML шаблон
├── package.json             # Зависимости и скрипты
├── tsconfig.json            # Конфигурация TypeScript
├── vite.config.ts           # Конфигурация Vite
├── qrcraft.db               # SQLite база данных
├── .env.example             # Пример переменных окружения
└── README.md                # Документация
```

---

## 🎨 Особенности UI

- **Градиентный фон** в стиле modern SaaS
- **Стеклянные карточки** с backdrop-blur эффектом
- **Плавные анимации** появления и взаимодействия
- **Адаптивный дизайн** для всех устройств
- **Тёмная/светлая тема** через Tailwind CSS

---

## 🔐 Безопасность

- API ключи хранятся в переменных окружения
- SQLite база данных с параметризованными запросами
- Валидация входных данных на сервере

---

## 📄 Лицензия

Проект создан в рамках тестового задания **DL2026 Spring FSD**.

---

## 👨‍💻 Автор

**Stasevich**

---

<div align="center">
  <sub>Создано с ❤️ используя React, Express и SQLite</sub>
</div>
