# Pagemint

Pagemint is a MERN application for creator link pages, product showcases, custom QR codes and shareable birthday pages.

This repository deliberately has **no root `package.json` and no root `node_modules`**. Install and run the backend and frontend independently.

## Project structure

```text
pagemint/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js
│       ├── index.js
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/
    ├── package.json
    ├── .env.example
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        ├── lib/
        ├── pages/
        └── styles.css
```

## Requirements

- Node.js 20 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- An ImageKit account for profile, product and birthday images

## 1. Backend setup

Open a terminal:

```bash
cd pagemint/backend
cp .env.example .env
npm install
```

Edit `backend/.env`:

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pagemint
ACCESS_TOKEN_SECRET=your_first_long_random_secret
REFRESH_TOKEN_SECRET=your_different_long_random_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_DAYS=30
FRONTEND_ORIGIN=http://localhost:5173
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

Generate two independent secrets (run twice):

```bash
openssl rand -base64 48
```

Start the API:

```bash
npm run dev
```

This command is intentionally just `node src/index.js`. It does not use nodemon, tsx watch mode, Vite or any automatic restart tool. A startup failure exits once and prints the failure; it does not restart in a loop.

Check the backend:

```bash
curl http://localhost:3000/health
```

Expected response resembles:

```json
{"status":"ok","service":"pagemint-backend","timestamp":"..."}
```

The API waits for MongoDB before it starts listening. If MongoDB is stopped or `MONGODB_URI` is wrong, the backend exits with a connection error. Start MongoDB and run `npm run dev` again.

## 2. Frontend setup

Open a second terminal:

```bash
cd pagemint/frontend
cp .env.example .env
npm install
npm run dev
```

`frontend/.env`:

```dotenv
VITE_PORT=5173
VITE_API_URL=http://localhost:3000
VITE_PREVIEW_PORT=4173
```

Open <http://localhost:5173>.

The frontend talks directly to the API at `VITE_API_URL`; Vite is not part of the backend. If you change the backend port, update `VITE_API_URL` and restart Vite. If you change the frontend port, also update `FRONTEND_ORIGIN` in `backend/.env`.

## 3. Authentication

- Registration: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Refresh: `POST /api/auth/refresh`
- Logout: `POST /api/auth/logout`
- Current user: `GET /api/auth/me`
- Delete account: `DELETE /api/auth/account`

Access and refresh JWTs are stored in separate HTTP-only cookies. The access token is short-lived; the refresh token is rotated and its SHA-256 hash is stored in MongoDB. The browser does not write either token to `localStorage`.

## 4. Main API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Backend health |
| `POST` | `/api/auth/register` | Register account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Rotate token pair |
| `POST` | `/api/auth/logout` | Revoke current refresh session |
| `GET` | `/api/auth/me` | Get current user |
| `DELETE` | `/api/auth/account` | Delete account and queue owned image cleanup |
| `GET` | `/api/profile/me` | Get profile editor data |
| `PATCH` | `/api/profile/me` | Update alias, details, appearance or QR settings |
| `PATCH` | `/api/profile/avatar` | Set ImageKit avatar |
| `DELETE` | `/api/profile/avatar` | Remove avatar |
| `POST` | `/api/profile/links` | Add link |
| `PATCH` | `/api/profile/links/reorder` | Reorder links atomically |
| `PATCH` | `/api/profile/links/:id` | Edit/enable/disable link |
| `DELETE` | `/api/profile/links/:id` | Remove link |
| `POST` | `/api/profile/products` | Add product |
| `PATCH` | `/api/profile/products/:id` | Edit/enable/disable product |
| `DELETE` | `/api/profile/products/:id` | Remove product |
| `GET` | `/api/birthday-pages` | List owned birthday pages |
| `POST` | `/api/birthday-pages` | Create birthday page |
| `PATCH` | `/api/birthday-pages/:id` | Edit birthday page |
| `DELETE` | `/api/birthday-pages/:id` | Delete birthday page |
| `GET` | `/api/media/imagekit-auth` | Get short-lived ImageKit upload signature |
| `GET` | `/api/public/profiles/:alias` | Public link profile |
| `GET` | `/api/public/birthday/:alias` | Public birthday page |
| `POST` | `/api/public/birthday/:alias/wishes` | Add a public birthday wish |

## 5. ImageKit lifecycle

The ImageKit private key stays on the backend. The authenticated frontend asks the backend for a short-lived signed upload payload, then uploads directly to ImageKit. Image files are saved under `/pagemint/<Mongo user id>/...`.

Before an ImageKit file ID is saved to a profile, product or birthday page, the backend checks the file against ImageKit and verifies that its path belongs to the authenticated MongoDB user. When an image is replaced, removed, or an account is deleted, its file ID is added to `MediaDeletionJob`. A backend worker retries provider deletions with backoff. The private key is never shipped to Vite.

If ImageKit is not configured, media operations fail explicitly. Account deletion will not proceed when it cannot persist cleanup jobs for existing images.

## 6. Design catalogue

The visual editor renders the actual public page as its workspace. Select an element to open its floating inspector, or drag it on the canvas; horizontal position, vertical position and width can also be fine-tuned. Page styling includes 40 page backgrounds, 41 distinct font families, 40 page-wide colour themes, searchable platform presets, Simple Icons / Font Awesome / Lucide icon families, and official, monochrome or custom icon colours. The sticker library contains 50 searchable vector sticker-style assets that can be dragged, resized and rotated. Links and product collections each support list, grid and card layouts. Birthday pages use the same canvas workflow, require a birth date, support up to 30 photos, five gallery compositions, captions, photo ordering, page styling and animated celebration effects. The QR designer uses QRCodeStyling to control module shape, dot geometry, finder frames, pupils, gradients, logo overlays, quiet zone, error correction, size, caption frames and PNG/SVG export.

## 7. Tests

Run the backend checks from `backend/`:

```bash
npm test
```

Run the frontend catalogue and project-contract checks from `frontend/`:

```bash
npm test
```

These tests cover alias generation, the registration route mount, the direct Node development command, port configuration, ImageKit file-type and ownership checks, ImageKit API endpoint paths, the client-rendered entry point, exported dashboard component and the 40-item design catalogues. They are not a substitute for running the app against MongoDB and ImageKit.

## 8. Production build

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

The built frontend is in `frontend/dist`. Configure your production web server to serve that build and route SPA paths (`/`, `/login`, `/register`, `/dashboard`, `/u/*`, `/bday/*`) to `index.html`. The backend is a separate process/service.

For production, set `NODE_ENV=production`, use HTTPS, use a strict `FRONTEND_ORIGIN`, configure secure secrets, enable managed MongoDB backups, and use a persistent hosting environment for the media cleanup worker.

## Current scope / limitations

- This is a client-rendered React application. Server-side rendering is intentionally not included, as requested.
- Username is fixed after registration; the public profile alias can be changed independently.
- Birthday pages can be created for another person without creating an account for the recipient.
- This project has not been security-audited. Review cookie/CSRF policy, rate limits, monitoring, provider quotas, image moderation and account recovery before public launch.

## Visual editor update (2026-11-20)

- Profile and birthday canvases now use a centered, responsive card over the page background.
- Card surface, border, radius, padding and shadow are independently configurable.
- Canvas elements expose position, width, height, rotation, font size/weight, padding, radius, background, text colour and shadow controls.
- The inspector can be moved by dragging its title bar.
- Users can upload custom PNG, WebP and GIF stickers through ImageKit; GIF animation is preserved by rendering the hosted image directly.
- Uploaded background and sticker assets are ownership-verified by the backend and removed assets are queued for cleanup.
- Birthday effects include confetti, fireworks, sparklers, balloons, sparkles, snow, rain and wind.
- Canvas height is calculated from visible sections rather than reserving a fixed empty product section.

Validation: backend and frontend Node test suites pass. These are automated contract/unit tests; a Vite production build and live browser/MongoDB/ImageKit integration still require running in an environment with dependencies and service credentials installed.

## Visual editor additions (November 2026)

- The editor inspector is now an overlay layer on desktop and a movable fixed panel on smaller screens. When closed, an explicit **Open editor panel** control remains available.
- Both profile and birthday canvases support user-created text elements. Text elements are stored in the page `appearance.textItems` object and saved through the existing profile/birthday PATCH endpoints.
- Text boxes can be dragged on the canvas and styled independently: expressive display font, size, weight, italic, line-height, letter spacing, alignment, text/background colour, width, rotation, padding, border, radius, opacity, box shadow and text shadow.
- Added a curated expressive font set and removed several office/document-oriented families from the global font selector.
- Birthday canvas now previews confetti and fireworks effects while editing as well as on the public page.
- Canvas height calculations account for custom text elements so adding text near the bottom does not clip it.

Verification performed in this environment: 16 frontend contract tests, 6 backend contract tests, 3 ImageKit validation tests, TypeScript JSX transpile parsing for all frontend JS/JSX files, backend `node --check` on route and entry files, and relative-import resolution. A browser session with the user's MongoDB/ImageKit credentials was not available, so live integration and Vite production build are not claimed as verified.

## Birthday and profile editor refinement (2026-11-20)

- Birthday headline, recipient name, date, countdown and message are separate canvas nodes. Each has its own typography controls and can be hidden/removed independently.
- The birthday cover image has independent corner-radius, fit and height controls. Its radius is applied to the image container and image, not inherited from the card.
- Birthday celebration layers are mounted at the page level rather than inside the card, so they span the complete page area.
- Birthday and profile text boxes support mobile-friendly emoji entry, image paste and uploaded PNG/JPEG/WebP/GIF stickers. Selected text boxes can now be resized by dragging the canvas corner handle, in addition to the inspector's numeric controls.
- Profile and birthday cards have 12 independent card themes with distinct surface, typography, border, radius, padding and shadow settings. These do not replace page-background themes.
- The profile canvas now calculates height from active positioned nodes and custom content; obsolete saved height values and layout entries for removed links/products no longer reserve space.
- Both editor inspectors are portaled to the document body and use viewport-based dragging, outside the preview's clipping and scroll containers.
- The QR upload path now passes the authenticated user into the QR editor (required to construct the ImageKit user folder). Local logo previews are normalised to transparent PNG data URLs before being passed to the QR renderer; saved designs still retain the hosted ImageKit asset reference.

Latest automated verification: frontend `npm test` (26 tests), backend `npm test` (12 tests), Vite config check, backend entry/app syntax checks, TypeScript JSX transpile parsing for all 26 frontend JS/JSX files, relative-import resolution, and CSS brace-balance checks. The production Vite bundle, real-browser pointer interactions, MongoDB persistence and live ImageKit upload/export still require a configured runtime and have not been represented as verified here.


## Independent page and card backgrounds

The profile and birthday editors now use the same background preset catalogue for two independent surfaces: the page background and the centered card background. Selecting a card background changes only the card surface; it does not replace the page colour theme, typography, text colour, or accent. Selecting a page preset clears any previously uploaded page background so the selected preset is visible. Card-specific theme packs and card typography/colour controls have been removed.

Birthday celebration behaviour is split between active effects (confetti and fireworks, which expose the public “Make a little noise” action) and ambient effects (snow, rain, wind, and sparkle drift). Ambient effect density can be adjusted and is saved with the page appearance. The public action is hidden when neither confetti nor fireworks is enabled.

## Custom page and card backgrounds

The profile and birthday studios expose independent custom gradient builders for the page background and the centered card background. Each builder supports linear and radial gradients, 2–6 colour stops, linear direction presets plus a 0–360° angle control, and radial shape/origin controls. Gradient configuration is stored in the page `appearance` object and rendered by both the studio preview and public canvas.

Card appearance is separate from the background itself. The card controls expose corner radius, border width and colour, padding, shadow depth and shadow colour. These settings are persisted in `appearance` and shared by the profile and birthday canvases; no card theme presets are used.
