# Assignment requirement checklist

Status is verified against the running app (API smoke tests plus browser tests). "Live" items are re-verified on the Vercel deployment.

## 1. Landing page and design
- [x] Custom brand identity, logo, colors, typography (Marigold Loom, indigo/clay/marigold, Fraunces + Hanken Grotesk)
- [x] Header with navigation, search, login/signup, cart icon
- [x] Hero with custom headline, imagery, CTA
- [x] Featured products and product categories
- [x] New arrivals / recommended
- [x] Promotional banner
- [x] Footer with useful links and contact information
- [x] Custom layout, consistent spacing/type/components, hover states and transitions
- [x] Responsive on mobile, tablet, desktop

## 2. Customer authentication
- [x] Registration, login, logout
- [x] Form validation and useful errors (client and server)
- [x] Password hashing (bcrypt)
- [x] Session via HttpOnly cookie JWT
- [x] Protected customer (cart, account) and admin routes
- [x] Backend authorization checks
- [x] No Firebase

## 3. Product listing and details
- [x] Products from database; image, name, price, info
- [x] Search by name, filter by category, sort by price and others, pagination
- [x] Detail page: large image, name, price, description, category, stock, add to cart, back to listing
- [x] Data comes from backend, not hardcoded

## 4. Admin dashboard and CRUD
- [x] Create, read, update, delete (with confirmation) products
- [x] Image upload via Cloudinary
- [x] Category management
- [x] Admin search and category filter
- [x] Fields: name, description, price, category, images, stock, created/updated timestamps
- [x] Backend-enforced admin authorization

## 5. Database and backend
- [x] Structured API (routes, controllers, models, middleware)
- [x] Frontend talks to backend over HTTP API
- [x] Validation (Zod), API error and DB failure handling
- [x] Secrets in environment variables
- [x] Schema documented (docs/SCHEMA.md)

## 6. Image upload
- [x] Upload from admin, displayed on cards and detail pages
- [x] File type and size validation, failed upload handling
- [x] URL and metadata stored in DB
- [x] Upload protected from unauthorized users
- [x] No secrets in frontend code

## 7. Shopping cart
- [x] Add, increase/decrease, remove, subtotal/total, clear display
- [x] Persisted per user in DB
- [x] Backend validates price and stock; client prices ignored

## 8. Security
- [x] Hashing, sanitization, backend authn/authz, customers blocked from admin APIs
- [x] Injection and XSS protections, secure session handling, env secrets
- [x] Upload and payload validation, proper status codes, safe errors
- [x] No credentials committed

## 9. Code quality
- [x] Reusable React components, separated routes/controllers/models/middleware/config
- [x] Loading, error, empty and success states
- [x] Meaningful commits, README with setup instructions

## 10. AI policy
- [x] AI use disclosed in README

## 11. Deployment and submission
- [x] Live URL, GitHub repo, admin and customer demo credentials (shared privately), README, schema docs, architecture notes, AI disclosure, testing confirmation
