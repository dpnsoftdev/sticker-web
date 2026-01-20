# E-commerce Client (Next.js)

This is the **client-side application** for an **order / pre-order e-commerce platform** focused on handmade and collectible products.  
The app is built with **Next.js App Router** and supports **guest checkout**, **authenticated users**, and **admin analytics**.

---

## 1. Tech Stack

### Core

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**

### UI & Styling

- **shadcn/ui** – component library
- **Tailwind CSS**
- **next/font** (Geist)

### Authentication & Authorization

- **NextAuth.js**
  - Credentials / OAuth providers
  - Role-based access (`GUEST | USER | ADMIN`)
- Middleware-based route protection

### Data & State

- **React Server Components (RSC)**
- **Server Actions**
- **Fetch / Axios** for API communication
- **Zustand** – client-side global state
- **TanStack Query** – client cache & async state

### Other

- ESLint + Prettier
- Environment-based configuration
- SEO-friendly routing
- Image optimization (`next/image`)

---

## 2. Application Roles

### I. GUEST

- Default role (no login required)
- Browse products & campaigns
- Add to cart
- Checkout and upload payment receipt
- Track orders by order code

### II. USER (Customer)

- Authenticated customer
- Access user profile
- View order history and order details

### III. ADMIN (Owner)

- Authenticated user with `owner` role
- Access admin dashboard & analytics

---

## 3. Routing Structure (App Router)

```
client/
├── app/                          # Next.js App Router
│   ├── (store)/                  # Public storefront (GUEST)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Homepage (RSC)
│   │   ├── products/
│   │   │   ├── page.tsx          # Product list (RSC)
│   │   │   └── [slug]/page.tsx   # Product detail (RSC)
│   │   ├── cart/page.tsx         # Cart page (Client)
│   │   ├── checkout/page.tsx     # Checkout flow (Client)
│   │   ├── campaigns/[slug]/page.tsx
│   │   └── order/track/page.tsx
│   │
│   ├── (auth)/                   # Authentication
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (user)/                   # USER only
│   │   ├── layout.tsx
│   │   ├── profile/page.tsx
│   │   ├── orders/page.tsx
│   │   └── orders/[orderId]/page.tsx
│   │
│   ├── (admin)/                  # ADMIN only
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── analytics/page.tsx
│   │
│   ├── api/                      # Route Handlers
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── uploads/route.ts
│   │
│   ├── layout.tsx                # Root layout (Providers)
│   ├── globals.css
│   ├── not-found.tsx
│   └── middleware.ts
│
├── stores/                       # GLOBAL CLIENT STATE (Zustand)
│   ├── cart.store.ts             # Cart items, quantity, total
│   ├── checkout.store.ts         # Shipping, payment, step state
│   └── auth.store.ts             # Client session / user snapshot
│
├── components/                   # Shared UI components (CLIENT)
│   ├── ui/                       # shadcn/ui
│   ├── layout/                   # Header, Footer, Sidebar
│   │   └── Header.tsx            # uses cart.store
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── product/
│   └── order/
│
├── features/                     # BUSINESS LOGIC (SERVER + CLIENT)
│   ├── auth/
│   │   ├── auth.service.ts       # server auth logic
│   │   ├── auth.types.ts
│   │   └── auth.guard.ts
│   │
│   ├── product/
│   │   ├── product.api.ts        # fetch products (server)
│   │   ├── product.types.ts
│   │   └── product.utils.ts
│   │
│   ├── order/
│   │   ├── order.api.ts          # create / fetch orders (server)
│   │   ├── order.types.ts
│   │   └── order.constants.ts
│   │
│   ├── checkout/
│   │   ├── checkout.action.ts    # server actions
│   │   └── checkout.validator.ts
│   │
│   ├── campaign/
│   └── promotion/
│
├── hooks/                        # STORE WRAPPERS / COMPOSABLE HOOKS
│   ├── useCart.ts                # wraps cart.store
│   ├── useCheckout.ts            # wraps checkout.store
│   ├── useAuth.ts                # sync NextAuth + auth.store
│   └── useOrder.ts
│
├── lib/                          # CORE UTILITIES
│   ├── auth.ts                   # requireAuth / requireAdmin
│   ├── fetcher.ts                # API wrapper
│   ├── constants.ts
│   └── utils.ts
│
├── types/                        # GLOBAL SHARED TYPES
│   ├── user.ts
│   ├── order.ts
│   ├── product.ts
│   └── next-auth.d.ts
│
├── styles/
│   └── tailwind.css
│
├── public/
│   └── images/
│
└── middleware.ts                 # Role & auth protection
```

---

## 4. State Management Strategy

### Server State (RSC)

Handled by **Server Components & Server Actions**:

- Product list / product detail
- Campaigns
- Order detail
- Admin analytics data

✅ Benefits:
- SEO friendly
- Automatic caching
- Smaller JS bundle

---

### Client State (Zustand)

Handled by **Zustand store** for **cross-page & long-lived UI state**.

#### Used for:

- 🛒 Cart
- 👤 Client auth/session state
- 🧾 Checkout flow state
- 🎛 UI preferences

> **Rule of thumb:**  
> If the state is **interactive, client-only, and shared across pages → Zustand**

---

## 5. Setup Instructions

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Run Development Server

```bash
npm run dev
```

---

## 6. Next Steps

1. **Install shadcn/ui components**: Run `npx shadcn@latest add button` etc.
2. **Connect to backend API**: Update API endpoints in `features/*/api.ts` files
3. **Implement file upload**: Configure storage (S3/R2/Cloudinary) in `app/api/uploads/route.ts`
4. **Add UI components**: Build out cart, checkout, product pages with shadcn/ui
5. **Add form validation**: Use React Hook Form + Zod for checkout forms
6. **Implement search & filters**: Add product search and category filtering

---

## 7. Project Structure Notes

- **Route Groups**: `(store)`, `(auth)`, `(user)`, `(admin)` organize routes without affecting URLs
- **Server Components**: Default for data fetching (SEO, performance)
- **Client Components**: Use `"use client"` for interactivity (cart, forms, etc.)
- **Server Actions**: Use for mutations (create order, update cart)
- **Middleware**: Protects routes based on authentication and roles

---

End of README.md
