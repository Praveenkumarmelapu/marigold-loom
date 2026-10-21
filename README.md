# ZAVIRO

A full-stack e-commerce web app for a fictional fashion brand (women, men, footwear, accessories). Built for the nevulTAR fresher web developer assignment.

- **Frontend:** React 18 (Vite), React Router, plain CSS with a custom design system
- **Backend:** Node.js + Express 4, validation with Zod
- **Database:** MongoDB (Atlas) with Mongoose
- **Image uploads:** Cloudinary (server-side signed upload)
- **Hosting:** Vercel (static React build plus the Express app as a serverless function)

Live site: see `LIVE_URL` in the submission message. Admin and customer demo credentials are shared privately, never in this repo.

## Features

- Custom brand (ZAVIRO): caps wordmark with "Everyday elegance" tagline, editorial black, ruby and ivory palette, Cormorant Garamond + Jost type, hand-built layout
- Landing page: header with navigation, search, login/signup and cart icons, hero with CTA, categories, featured products, new arrivals, promo band, footer with links and contact details
- Customer signup, login, logout with validation messages, bcrypt password hashing, HttpOnly cookie session (JWT)
- Product listing from the database with search by name, category filter, in-stock filter, sorting (newest, price, name) and pagination
- Product detail with large image, price, description, category, stock status, add to cart, link back to the listing
- Server-side cart: add, increase/decrease, remove, subtotals and total. Prices and stock are read from the database on every request
- Checkout with delivery address, coupon codes (server-validated) and cash on delivery; order history in the customer account
- Admin area (`/admin`): dashboard (revenue, orders, best sellers), products (create, read, update, delete with confirmation, search, category filter, Cloudinary upload), categories, order management (status updates, cancel with stock restore), coupons, customers, and settings
- Settings let the admin change the site colours, the hero banner (text, button, image) and the offer banner, all stored in MongoDB and applied storefront-wide
- Loading, empty, error and success states, responsive from 360px to desktop, keyboard focus styles, skip link, labelled forms

## Project structure

```
api/index.js            Vercel serverless entry (wraps the Express app)
server/src/
  config/               env, MongoDB connection (cached for serverless), Cloudinary
  models/               User, Category, Product, Cart, Order, Coupon, Setting
  controllers/          auth, products, categories, cart, orders, coupons, settings, uploads, stats
  routes/index.js       all routes, with auth and admin guards
  middleware/           auth (JWT cookie), validate (Zod), upload (multer), errorHandler
  utils/                sanitize, asyncHandler, HttpError
server/scripts/         seed.js, smoke-test.js, dev-memory-db.js
client/src/
  components/           Header, Footer, ProductCard, Field, Guards, Logo, icons
  context/              AuthContext, CartContext
  pages/                Home, Shop, ProductDetail, Cart, Login, Signup, Account, admin/*
  lib/api.js            fetch wrapper, money and image helpers
docs/SCHEMA.md          database models and API summary
```

## Local setup

Requirements: Node 18+, a MongoDB database (Atlas free tier works), a free Cloudinary account.

```bash
git clone <this repo> && cd marigold-loom
npm install
npm --prefix client install
cp .env.example .env        # then fill in the values
npm run seed                # creates categories, products, images, admin and demo customer
npm run build               # builds the React app into client/dist
npm start                   # http://localhost:4000 serves the API and the built site
```

For hot reload run `npm run dev:server` and `npm run dev:client` in two terminals and open http://localhost:5173.

Environment variables (see `.env.example`): `MONGODB_URI`, `JWT_SECRET` (24+ random characters), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. For seeding only: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `DEMO_EMAIL`, `DEMO_PASSWORD`.

### Run the API checks

With the server running and the database seeded:

```bash
ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE_URL=http://localhost:4000 npm run test:api
```

This runs 47 checks against the real API: auth, validation, role checks, cart price and stock rules, image upload rules, injection attempts and security headers.

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel (framework preset "Other").
2. Vercel reads `vercel.json`: it runs `npm run build`, serves `client/dist`, and rewrites `/api/*` to the Express function in `api/index.js`.
3. Add the environment variables above (except the seed-only ones) in Project Settings, Environment Variables.
4. In MongoDB Atlas, Network Access must allow Vercel's dynamic IPs (`0.0.0.0/0`), and the database user needs read/write access.
5. Run `npm run seed` once from your machine against the production `MONGODB_URI` to create data and the admin account.

## Technology and architecture decisions

- **One repo, one Vercel project.** The React app is static and the Express app runs as a single serverless function. Same origin means cookies work without CORS and `SameSite=Lax` gives CSRF protection for state-changing requests.
- **Cookie sessions, not localStorage tokens.** The JWT lives in an HttpOnly, Secure, SameSite=Lax cookie so page scripts cannot read it. The server loads the user from the database on every request, so a changed role or deleted account takes effect immediately.
- **Authorization on the server.** `requireAuth` and `requireAdmin` middleware guard the routes. The React route guards are only a convenience.
- **Zod for validation.** Every body and query is parsed and rejected with field-level messages. Strings are stripped of HTML tags.
- **Prices are never trusted from the client.** The cart stores product ids and quantities only. Totals are computed from current database prices, and quantity is capped by stock.
- **MongoDB connection is cached** between serverless invocations to avoid opening a new connection per request.
- **Cloudinary uploads go through the server** so the API secret never reaches the browser. The server checks type, size (4 MB) and the real file signature before uploading.

## Security measures and how they were tested

| Measure | Where | How it is tested |
|---|---|---|
| bcrypt hashing (cost 12), hash excluded from queries | authController, User model | signup/login checks; no hash in any response |
| Generic login error and equal timing for unknown emails | authController | wrong-password test returns the same message |
| HttpOnly + SameSite cookie, Secure in production | middleware/auth | cookie flags asserted in smoke test |
| Role-based authorization on every admin route | routes/index.js | customer and anonymous calls to admin APIs return 403 and 401 |
| Public signup can never create an admin | authController | signup with `role: "admin"` still gives `customer` |
| NoSQL injection | express-mongo-sanitize, Zod types | login with `{"$gt": ""}` is rejected |
| XSS | React escaping, HTML stripped on input, CSP via helmet | `<script>` in a product name is stripped |
| Rate limiting on login and signup | express-rate-limit | 30 attempts per 15 minutes per IP |
| Upload validation | multer + signature check | fake PNG, text file and 5 MB file are rejected; valid image accepted |
| Secrets in env vars only | .gitignore, .env.example | no credentials committed |
| Cross-site writes blocked | app.js Origin check | request with a foreign Origin returns 403 |
| Safe errors | errorHandler | 500s return a generic message, never stack traces |
| Security headers | helmet | asserted in smoke test |

## What was tested

Automated: 47 API checks (`npm run test:api`). Browser checks with Playwright on desktop (1366px) and mobile (390px): signup validation, login, guest redirected from add-to-cart, add to cart, quantity change, customer blocked from `/admin`, admin create with image upload, search, edit, delete with confirmation. Screenshots were reviewed for layout at both sizes.

## AI tools disclosure

This project was built with the help of an AI coding agent (Claude-based) acting for the candidate, plus an AI image model for the product photos, which are generated images and not real products. The candidate reviewed the result and can explain the architecture, API endpoints, models, authentication and authorization. The checklist of assignment requirements is in `docs/REQUIREMENTS.md`.

## Fashion catalogue images

Product photos in `client/public/shop` are sample stock photographs from Unsplash (Unsplash licence). Replace them with your own photography, or upload new images per product in the admin.
