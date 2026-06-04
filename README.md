# 🧚‍♀️ FairyDiary

> A magical, private, emotionally intelligent digital diary built with Next.js 14, Framer Motion, and OpenRouter AI.

![FairyDiary](./public/icons/icon-192.svg)

## ✨ Features

- **🔒 Secure PIN Authentication** — Local PIN with SHA-256 hashing, session management
- **📝 Rich Diary Editor** — Auto-save, word count, mood selector, weather, gratitude, tags
- **🤖 AI Writing Tools** — 6 rewrite styles, smart title gen, mood detection, reflection questions
- **📊 Insights Dashboard** — Mood charts, writing streaks, monthly trends, top tags
- **📅 Calendar View** — Monthly calendar with mood-colored entry dots
- **🔥 Streak Tracking** — Daily journaling streak with celebrations
- **🎨 Mood-Reactive UI** — Themes subtly adapt to your mood
- **💾 Local-First Privacy** — All data stored in localStorage + IndexedDB
- **📱 PWA Ready** — Installable on mobile, offline capable
- **✨ Premium Animations** — Framer Motion powered with floating particles

## 🚀 Quick Start

```bash
# 1. Clone or unzip
cd fairydiary

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

## 🔑 Environment Variables

Create a `.env.local` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your free API key at [openrouter.ai](https://openrouter.ai)

> **Note:** The app works fully without an API key — AI features will show a friendly error message.

## 📁 Project Structure

```
fairydiary/
├── app/
│   ├── (app)/           # Authenticated app routes
│   │   ├── home/        # Dashboard
│   │   ├── write/       # Entry editor
│   │   ├── timeline/    # All entries + search
│   │   ├── insights/    # Analytics
│   │   ├── calendar/    # Calendar view
│   │   └── settings/    # Settings
│   ├── api/ai/          # Server-side AI routes
│   ├── lock/            # PIN lock screen
│   └── onboarding/      # First-time setup
├── components/
│   ├── ui/              # Reusable UI components
│   └── layout/          # Navigation, layout
├── features/
│   ├── auth/            # PIN lock, onboarding
│   ├── entries/         # Entry CRUD components
│   ├── ai/              # AI toolbar
│   ├── media/           # Media upload/preview
│   └── insights/        # Charts, summaries
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (auth, storage, AI)
├── store/               # Zustand global state
└── types/               # TypeScript definitions
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | App Router, SSR, API Routes |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Zustand | State management |
| Recharts | Data visualization |
| OpenRouter | AI writing assistance |
| IndexedDB (idb) | Media storage |
| LocalStorage | Entries + settings |

## 📱 PWA Installation

1. Open in Chrome/Safari on mobile
2. Tap "Add to Home Screen" or install prompt
3. Use like a native app

## 🔐 Privacy

- **100% local** — no data ever leaves your device
- **PIN-protected** — SHA-256 hashed, stored locally
- **No analytics** — no tracking, no telemetry
- **Export/Import** — full data portability via JSON backup

## 🤖 AI Features

All AI calls go through secure Next.js API routes — your API key is never exposed to the client.

### Available AI Modes:
- ✨ **Rewrite Beautifully** — Polished, eloquent prose
- 🧚‍♀️ **Fairy Mode** — Magical, enchanted storytelling  
- 🌸 **Poetic Mode** — Lyrical, imagery-rich writing
- 🌿 **Calm Mode** — Peaceful, mindful reflection
- 📝 **Mature Mode** — Sophisticated, refined voice
- 🤍 **Minimal Mode** — Clean, essential words only
- 🔮 **Smart Title** — Auto-generate a beautiful title
- 💫 **Mood Detection** — Detect your emotional tone
- 🪞 **Reflection** — Thoughtful questions to explore deeper

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
Add your environment variables in the Vercel dashboard.

### Build for production
```bash
npm run build
npm start
```

## 📱 App Store Deployment

### iOS (Capacitor)
```bash
npm install @capacitor/core @capacitor/ios
npx cap init
npx cap add ios
npm run build && npx cap sync
npx cap open ios
```
Then build in Xcode and submit to App Store Connect.

### Android (Capacitor)
```bash
npm install @capacitor/android
npx cap add android
npm run build && npx cap sync
npx cap open android
```
Then build in Android Studio and submit to Google Play.

## 📄 License

MIT — feel free to build and sell your own version.

---

Made with ✨ magic and lots of 💜 by FairyDiary
