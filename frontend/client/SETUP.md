# Setup & Installation Guide

## ✅ Completed Structure

The codebase has been restructured according to the README specifications:

### 📁 Folder Structure Created

- ✅ `stores/` - Zustand stores (cart, checkout, auth)
- ✅ `features/` - Business logic modules (auth, product, order, checkout, campaign, promotion)
- ✅ `hooks/` - Composable hooks (useCart, useCheckout, useAuth, useOrder)
- ✅ `lib/` - Core utilities (auth, fetcher, constants, utils)
- ✅ `types/` - TypeScript type definitions
- ✅ `components/` - UI components (layout components created)
- ✅ `app/` - Next.js App Router with route groups:
  - `(store)/` - Public storefront routes
  - `(auth)/` - Authentication routes
  - `(user)/` - User-only routes
  - `(admin)/` - Admin-only routes

### 🔧 Tech Stack Integration

- ✅ NextAuth.js configured with credentials provider
- ✅ Zustand stores with persistence
- ✅ TanStack Query provider setup
- ✅ Middleware for route protection
- ✅ TypeScript types for NextAuth
- ✅ API client (Axios) configured
- ✅ Server Actions for checkout
- ✅ Zod validation schemas

## 📦 Next Steps

### 1. Install Dependencies

```bash
cd frontend/client
npm install
```

**Note**: If you encounter permission errors, you may need to:
- Run with `sudo` (not recommended)
- Fix npm permissions
- Or use `yarn` instead

### 2. Set Up Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Initialize shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
# ... add more as needed
```

### 4. Connect Backend API

Update API endpoints in:
- `features/auth/auth.service.ts`
- `features/product/product.api.ts`
- `features/order/order.api.ts`

Ensure your backend API matches the expected endpoints.

### 5. Implement File Upload Storage

Update `app/api/uploads/route.ts` to integrate with your storage solution:
- AWS S3
- Cloudflare R2
- Cloudinary
- Or local storage for development

### 6. Build UI Components

Create components in `components/`:
- `components/cart/CartItem.tsx`
- `components/cart/CartSummary.tsx`
- `components/product/ProductCard.tsx`
- `components/product/ProductDetail.tsx`
- `components/checkout/CheckoutForm.tsx`
- `components/checkout/PaymentForm.tsx`
- etc.

### 7. Add Form Handling

For checkout forms, consider adding:
```bash
npm install react-hook-form @hookform/resolvers
```

Then integrate with Zod validators in `features/checkout/checkout.validator.ts`.

### 8. Test the Application

```bash
npm run dev
```

Visit:
- `http://localhost:3000` - Homepage
- `http://localhost:3000/products` - Product list
- `http://localhost:3000/cart` - Shopping cart
- `http://localhost:3000/login` - Login page

## 🔍 Key Files to Review

1. **`app/api/auth/[...nextauth]/route.ts`** - NextAuth configuration
2. **`app/middleware.ts`** - Route protection logic
3. **`stores/cart.store.ts`** - Cart state management
4. **`features/checkout/checkout.action.ts`** - Server action for order creation
5. **`lib/fetcher.ts`** - API client configuration

## ⚠️ Important Notes

1. **NextAuth v5**: The code uses NextAuth v5 (beta). If you encounter issues, you may need to adjust the configuration.

2. **Zustand Persist**: Cart store uses localStorage persistence. Ensure localStorage is available (browser environment).

3. **Server Components**: Most pages are Server Components by default. Add `"use client"` only when needed (interactivity, hooks, etc.).

4. **Type Safety**: All types are defined in `types/` directory. Keep them in sync with your backend API.

5. **Environment Variables**: Never commit `.env.local` to version control.

## 🐛 Troubleshooting

### NextAuth Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check that API routes are accessible
- Verify credentials provider is working

### Zustand Persist Issues
- Check browser console for localStorage errors
- Ensure you're in a browser environment (not SSR)

### TypeScript Errors
- Run `npm run build` to check for type errors
- Ensure all imports are correct
- Check that `types/next-auth.d.ts` is being recognized

## 📚 Additional Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com/)
