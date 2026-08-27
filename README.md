# Product Manager

A lightweight, client-friendly admin panel for managing products on an existing WooCommerce website.

> This application does **not** replace WordPress or WooCommerce. It is a simple interface that sits on top of an existing WooCommerce installation and communicates with it through its REST API.

---

## Architecture

```
Browser → Next.js App → /api/* routes (server-side) → WooCommerce REST API → WordPress
```

WooCommerce credentials never leave the server. The browser only talks to our own `/api/*` routes.

---

## Requirements

- Node.js 18+
- An existing WordPress website with WooCommerce installed
- WooCommerce REST API credentials (Read/Write)

---

## Quick Start

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
WORDPRESS_URL=https://your-wordpress-site.com
WC_CONSUMER_KEY=ck_xxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxx
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000/test](http://localhost:3000/test) to verify the WooCommerce connection.

---

## Generating WooCommerce API Credentials

1. In WordPress admin, go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add key**
3. Set:
   - Description: `Product Manager`
   - User: (admin user)
   - Permissions: `Read/Write`
4. Click **Generate API key**
5. Copy the **Consumer key** and **Consumer secret** into `.env.local`

> The secret is only shown once. Save it immediately.

---

## Environment Variables

| Variable | Description |
|---|---|
| `WORDPRESS_URL` | Your WordPress site URL (no trailing slash) |
| `WC_CONSUMER_KEY` | WooCommerce REST API consumer key |
| `WC_CONSUMER_SECRET` | WooCommerce REST API consumer secret |

**Never prefix these with `NEXT_PUBLIC_`.** They must remain server-side only.

---

## Build for Production

```bash
npm run build
npm start
```

---

## Troubleshooting

### 401 Unauthorized
- Check that `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` are correct
- Ensure the API key has Read/Write permissions
- Your WordPress site must use HTTPS (required for Basic Auth)

### 404 Not Found on /wp-json/wc/v3
- Ensure WooCommerce is installed and activated
- Check that WordPress permalinks are set to something other than Plain: **Settings → Permalinks**

### CORS errors in browser
- You should never see CORS errors — the browser talks only to our Next.js server, never directly to WooCommerce
- If you do see CORS errors, a client component is incorrectly calling WooCommerce directly

### Image upload failures (Phase 4)
- The WordPress user associated with the API key must have `upload_files` capability
- Check max upload size in WordPress: **Media → Add New** shows the limit

### Categories not appearing
- Ensure categories exist in **WooCommerce → Products → Categories**
- The API key must have Read permission for categories

---

## Project Structure

```
app/
  api/
    products/          ← GET list, POST create
      [id]/            ← GET one, PUT update, DELETE
    categories/        ← GET all categories
    test/              ← Phase 1 connection test (remove in production)
  test/                ← Connection test UI (remove in production)

lib/
  woocommerce/
    client.ts          ← Core HTTP client (server-only)
    products.ts        ← Product CRUD functions
    categories.ts      ← Category fetch functions
    media.ts           ← Media Library functions (Phase 4)
  api-error.ts         ← Centralized error normalization

types/
  woocommerce.ts       ← Shared TypeScript types
```

---

## Security Notes

- WooCommerce credentials are server-side only (never in client code or browser)
- All API routes validate and sanitize input with Zod
- Authentication via HTTP-only secure cookies (Phase 6)
- Raw WooCommerce errors are never exposed to the client
