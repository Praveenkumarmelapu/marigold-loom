# Database schema (MongoDB, via Mongoose)

All models live in `server/src/models`.

## User
| Field | Type | Notes |
|---|---|---|
| name | String | required, 2-80 chars, HTML tags stripped |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt (cost 12), `select: false` so it is never returned by default |
| role | `customer` \| `admin` | default `customer`; only the seed script can create an admin |
| createdAt / updatedAt | Date | automatic |

## Category
| Field | Type | Notes |
|---|---|---|
| name | String | required, unique |
| slug | String | required, unique, used in URLs and filters |
| blurb | String | short description |

## Product
| Field | Type | Notes |
|---|---|---|
| name | String | required, indexed |
| description | String | required, up to 2000 chars |
| price | Number | INR, whole rupees, >= 0 |
| category | ObjectId -> Category | required, indexed |
| images | [{ url, publicId, width, height, format, bytes }] | Cloudinary URL and metadata, up to 6 |
| stock | Number | integer >= 0 |
| featured | Boolean | shows on the home page |
| badge | String | optional label such as "New" |
| createdAt / updatedAt | Date | automatic, used for "newest" sorting |

## Cart
| Field | Type | Notes |
|---|---|---|
| user | ObjectId -> User | unique, one cart per user |
| items | [{ product: ObjectId -> Product, quantity: 1-20 }] | prices are never stored; they are read from Product on every request |

## API summary
| Method and path | Access | Purpose |
|---|---|---|
| POST /api/auth/signup, /login, /logout; GET /api/auth/me | public | session cookie auth |
| GET /api/products (q, category, sort, page, limit, inStock) | public | list, search, filter, sort, paginate |
| GET /api/products/:id | public | detail plus related products |
| GET /api/categories | public | categories with product counts |
| GET/POST/PATCH/DELETE /api/cart... | customer or admin (signed in) | server-side cart, price and stock re-validated |
| POST/PUT/DELETE /api/admin/products | admin | create, update, delete products |
| POST/PUT/DELETE /api/admin/categories | admin | manage categories |
| POST /api/admin/uploads | admin | image upload to Cloudinary |
| GET /api/admin/stats | admin | dashboard counts |
