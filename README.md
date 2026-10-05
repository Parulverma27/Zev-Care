# Node.js + Express + React Native Template

Full-stack starter in a **single repo**: Node.js/Express API + **React Native** frontend (iOS, Android, Web) under `resources/views` — Laravel-style layout.

Includes a working **Users CRUD** example. **Firebase**, **Google Sign-In**, and **Razorpay** are **optional** — leave env blank and they stay off; add keys and they auto-enable. One-command scripts produce **web**, **APK**, **AAB**, and **IPA**.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, Sequelize, MySQL |
| Frontend | React Native, Expo, React Navigation |
| Platforms | iOS, Android, Web (`react-native-web`) |
| Integrations | Firebase, Google Auth, Razorpay (optional — auto on when keys set) |

## MVC architecture (required pattern)

This template enforces **strict MVC** on both backend and frontend.

### Backend (`app/`)

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Model** | `app/models/` | ORM schema only — no business logic |
| **View** | `app/http/responses/` | JSON response shape (`ApiResponse`) |
| **Controller** | `app/controllers/` | HTTP in/out only — calls Services |
| **Service** | `app/services/` | Business rules |
| **Repository** | `app/repositories/` | Database queries |
| **Request** | `app/http/requests/` | Input validation (like Laravel Form Requests) |
| **Middleware** | `app/middlewares/` | Cross-cutting HTTP concerns |

**Request flow:** `routes/api.js` → `Controller` → `Service` → `Repository` → `Model`

### Frontend (`resources/views/src/`)

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Model** | `src/models/` | Domain objects (`User.js`) |
| **View** | `src/views/` + `src/components/` | UI only — no API calls |
| **Controller** | `src/controllers/` | State + orchestration (`useUserController`) |
| **Service** | `src/services/` | API/data access (`UserService.js`) |

**Request flow:** `View` → `Controller` → `Service` → Express API

### Where scripts live (not inside `app/`)

`app/` is **application MVC code only** — controllers, models, services, etc.

Build and ops scripts live in **`scripts/`** at the repo root (same idea as Laravel’s `artisan` / `scripts/` being separate from `app/`):

| Path | Purpose |
|------|---------|
| `scripts/mobile/` | SHA, JKS keystore, APK, AAB, IPA, web copy |
| `database/` | Migrations and seeders |

Do **not** put APK/IPA build scripts inside `app/` — they are not part of the MVC request cycle.

## Project structure

```
├── app/                          # Backend MVC
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── repositories/
│   ├── middlewares/
│   └── http/
│       ├── requests/             # Validation rules
│       └── responses/            # ApiResponse helpers
├── config/                       # db.js, firebase.js, google.js, razorpay.js
├── database/                     # migrations, seeders
├── loaders/                      # Express + DB bootstrap
├── scripts/
│   └── mobile/                   # SHA, keystore, APK, AAB, IPA, web copy
├── public/                       # Expo web build output (npm run build:web)
├── resources/
│   └── views/                    # React Native app (all frontend here)
│       ├── App.js
│       ├── app.config.cjs
│       ├── eas.json
│       ├── assets/
│       ├── signing/              # JKS, key.properties, Firebase files
│       └── src/
│           ├── models/           # User.js
│           ├── views/            # UsersView.js
│           ├── controllers/      # UserController.js
│           ├── components/       # UserForm (view partial)
│           ├── services/         # UserService, ApiService
│           ├── navigation/
│           └── constants/
├── routes/                       # api.js, web.js
├── server.js
└── .env.example
```

## Prerequisites

- Node.js 18+, npm 9+, MySQL 8+
- **Web:** modern browser
- **iOS:** macOS + Xcode (or Expo Go)
- **Android:** Android Studio emulator (or Expo Go)
- **Release builds:** Java `keytool`, Android SDK, Xcode (iOS IPA), optional [EAS CLI](https://docs.expo.dev/eas/)

## Quick start (minimal — only DB required)

```bash
cp .env.example .env
# Edit .env: set DB_PASSWORD and DB_NAME only
npm install
npm run migrate
npm run seed          # optional demo users
```

**Nothing else is compulsory.** Razorpay, Firebase, Google Auth, Twilio, EAS — all optional. Empty env = feature disabled.

Check what is enabled: `npm run mobile:check`

### Development

**Terminal 1 — API:**

```bash
npm run dev
```

**Terminal 2 — frontend (`resources/views`):**

| Command | Platform |
|---------|----------|
| `npm run dev:web` | Browser |
| `npm run dev:app` | Expo dev tools (QR) |
| `npm run dev:ios` | iOS Simulator |
| `npm run dev:android` | Android Emulator |
| `npm run dev:full:web` | API + web together |

### Production web (single server)

```bash
npm run build:web
npm start
```

Open `http://localhost:3000` — Express serves API + web app.

## Developer build guide (APK / AAB / IPA / Web)

All build outputs land in predictable folders:

| Asset | Command | Output |
|-------|---------|--------|
| **Web** | `npm run build:web` | `public/` |
| **APK** (install on phone) | `npm run build:android:apk` | `resources/views/build-output/app-release.apk` |
| **AAB** (Play Store) | `npm run build:android:aab` | `resources/views/build-output/app-release.aab` |
| **IPA** (App Store) | `npm run build:ios:ipa` | `resources/views/build-output/ipa/` |

### First-time Android setup (2 steps)

```bash
# 1. Add one line to .env
ANDROID_KEYSTORE_PASSWORD=your_secure_password

# 2. Build — setup + prebuild + APK happen automatically
npm run build:android:apk
```

Same for AAB: `npm run build:android:aab`

### iOS (needs Mac + Xcode)

```bash
npm run build:ios:ipa
```

Or use EAS cloud (no local Xcode): `npm run eas:ios:ipa`

### Verify machine is ready

```bash
npm run mobile:check
```

### Optional integrations (auto-detect)

| Feature | Enable by setting | Auto-detect helper |
|---------|-------------------|-------------------|
| Firebase push | `EXPO_PUBLIC_FIREBASE_API_KEY` + `PROJECT_ID` + `APP_ID` | `isFirebaseConfigured()` |
| Google Sign-In | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `isGoogleAuthConfigured()` |
| Razorpay | `EXPO_PUBLIC_RAZORPAY_KEY_ID` (app), `RAZORPAY_KEY_SECRET` (server) | `isRazorpayConfigured()` |

Frontend: `resources/views/src/constants/features.js`  
Backend: `config/features.js`  
Expo plugins in `app.config.cjs` register **only** when keys exist.

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm start` | Production server |
| `npm run dev` | API with file watch |
| `npm run migrate` | Run migrations |
| `npm run seed` | Seed data |

### Frontend (resources/views)

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Expo web dev |
| `npm run dev:app` | Expo dev server |
| `npm run dev:ios` / `dev:android` | Simulator / emulator |
| `npm run build:web` | Static web → `public/` |

### Native prebuild

| Script | Description |
|--------|-------------|
| `npm run prebuild` | Generate `android/` + `ios/` |
| `npm run prebuild:android` | Android only |
| `npm run prebuild:ios` | iOS only |
| `npm run prebuild:clean` | Clean regenerate |

### Mobile builds (developer-friendly)

| Script | Description |
|--------|-------------|
| `npm run mobile:check` | Verify Node, Java, SDK, signing, optional features |
| `npm run mobile:setup` | One-time Android keystore + key.properties |
| `npm run build:android:apk` | **Full APK pipeline** (setup → prebuild → APK) |
| `npm run build:android:aab` | **Full AAB pipeline** (setup → prebuild → AAB) |
| `npm run build:ios:ipa` | **Full IPA pipeline** (prebuild → archive) |
| `npm run android:sha` | SHA1/SHA256 for Google/Firebase (when using those) |

Keystore: `resources/views/signing/upload-keystore.jks` (gitignored)

### iOS builds

| Script | Description |
|--------|-------------|
| `npm run ios:ipa` | Archive + export **IPA** (macOS + Xcode) |
| `npm run build:ios:ipa` | prebuild + IPA |

Output: `resources/views/build-output/ipa/`

### EAS cloud builds (optional)

| Script | Output |
|--------|--------|
| `npm run eas:android:apk` | APK (internal) |
| `npm run eas:android:aab` | AAB (production) |
| `npm run eas:ios:ipa` | IPA (production) |

Set `EAS_PROJECT_ID` in `.env` and run `eas login` / `eas init` in `resources/views`.

## Environment variables

**Required:** `DB_PASSWORD`, `DB_NAME` (and `DB_USER` if not `root`).

**Optional:** everything else in `.env.example` — commented blocks show what to uncomment when needed.

Use `isFeatureEnabled('razorpay')` (backend) or `isFeatureEnabled('razorpay')` (frontend `features.js`) before calling integration code.

### API URL (mobile)

| Environment | `EXPO_PUBLIC_API_URL` |
|-------------|------------------------|
| iOS Simulator | `http://localhost:3000/api` |
| Android Emulator | `http://10.0.2.2:3000/api` |
| Physical device | `http://<LAN-IP>:3000/api` |
| Web production | Same origin `/api` (auto) |

## Example: Users CRUD

**Backend**

| Layer | File |
|-------|------|
| Route | `routes/api.js` |
| Request | `app/http/requests/UserStoreRequest.js` |
| Controller | `app/controllers/UserController.js` |
| Service | `app/services/UserService.js` |
| Repository | `app/repositories/UserRepository.js` |
| Model | `app/models/User.js` |

**Frontend**

| Layer | File |
|-------|------|
| View | `resources/views/src/views/UsersView.js` |
| Controller | `resources/views/src/controllers/UserController.js` |
| Service | `resources/views/src/services/UserService.js` |
| Model | `resources/views/src/models/User.js` |

**Add a new feature:** backend route → request rules → controller → service → repository → model, then mirror on frontend: view → controller → service → model.

## Architecture

```
Frontend MVC                          Backend MVC
─────────────                         ───────────
Views (UsersView)                     routes/api.js
    ↓                                     ↓
Controllers (useUserController)       Controllers (UserController)
    ↓                                     ↓
Services (UserService)                Services (UserService)
    ↓                                     ↓
    └──────── axios /api ──────────→  Repositories → Models → MySQL
```

## License

Use freely as a starter template.
