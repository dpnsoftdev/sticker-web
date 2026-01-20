# docs.md

## 1. Overview

An **order / pre-order** store application focused on handmade / collectible products, supporting:

- **In-stock** and **pre-order** products
- **Categories / Variants** with unique SKUs
- **Campaigns** for pre-order and flash sale
- **Promotions** with discount codes
- Checkout collecting **contact and shipping information**
- Payment via **bank transfer** with **2 payment plans**: full payment (100%) or deposit (e.g. 50%)
- **Bank transfer receipt upload is required before placing an order** (UI-driven design)

---

## 2. Roles

### 2.1 Customer (customer)

- Browse products, select variants, place orders, track orders
- Apply promotion codes during checkout
- View active campaigns
- Upload payment receipts

### 2.2 Store Owner (owner)

- Manage users
- Manage products / variants / pre-orders
- Manage categories
- Manage campaigns (pre-order, flash sale)
- Manage promotions (discount codes)
- Manage orders and payment statuses
- Configure payment / bank transfer methods
- Reconcile receipts, confirm orders, update shipping
- View analytics and reports

---

## 3. Customer Features

### 3.1 Product Listing Page

### 3.2 Product Detail Page (PDP)

### 3.3 Cart

- Add items to cart:
  - `product_id` + `variant_id` (optional)
  - `quantity`
- Display cart items:
  - Image, SKU, product name, variant name, quantity, price
  - Show campaign price if the product is in a campaign
- Allow users to:
  - Increase / decrease quantity
  - Remove items
- Display subtotal amount

### 3.4 Checkout

#### 3.4.1 Contact Information

- Facebook / Instagram link (required)
- Email (required)
- Phone number (required)

#### 3.4.2 Shipping Information

- Receiver full name (required)
- Receiver phone number (optional / required based on rules)
- Shipping address (required)
- Notes (optional)

#### 3.4.3 Promotion

- Enter promotion code (optional)
- Validate promotion:
  - Check existence and active status
  - Check validity period (`start_date`, `end_date`)
  - Check remaining usage (`total_uses`, `used_count`)
  - Check application conditions (`min_order_amount`, `applicable_to`)
  - Check per-user limits (if any)
- Display discount amount after applying
- Allow removing applied promotion

#### 3.4.4 Payment

- Select **payment_plan**:
  - Full payment (100%)
  - Deposit (e.g. 50%) + refund/deposit description (e.g. “within 1 month”)
- Select **payment_method** (at least one: bank transfer)
- Display bank transfer information:
  - Account holder name
  - Bank / wallet
  - Account number
  - Copy button
- Upload payment receipt (required by UI design):
  - Validate file type and size
  - Store uploaded file URL

#### 3.4.5 Order Confirmation

- Product subtotal
- Promotion discount (if any)
- Shipping fee (if any)
- Payable amount based on payment plan (after discount)
- Submit order
- Return order code and initial status

---

## 3.5 Order Tracking

- Customers can:
  - Look up orders by order code + email/phone (optional)
  - View order status:
    - `pending_payment` / `processing` / `shipped` / `delivered` / `cancelled`
  - View order details:
    - Product list (product + variant, quantity)
    - Total amount, discount (if any), payable amount
    - Contact and shipping information
    - Payment plan and payment method
  - View uploaded payment receipt (if any)

---

## 4. Owner Features

### 4.1 User Management

- View user list
- CRUD users:
  - email, password, name, phone, avatar
  - role (`owner | customer`)
  - status (`active | inactive | suspended`)
  - `email_verified`, `phone_verified`
- Filter by role and status

### 4.2 Category Management

- CRUD categories:
  - name, slug, description
  - image

### 4.3 Product Management

- CRUD products:
  - `sku` (unique), name, slug, category_id
  - `product_type` (`in_stock | preorder`)
  - price, currency, price_note, shipping_note
  - stock, seller_name
  - size_description, package_description, preorder_description
  - images
- Preorder management:
  - `start_date`, `end_date`
  - Rule: `product_type = preorder` ⇒ `preorder != null`
- View `view_count`

### 4.4 Variant Management

- CRUD variants per product:
  - `sku` (unique), name, description
  - Override price (optional)
  - Override stock (optional)
  - Images (optional)
- Sort variant display order

### 4.5 Campaign Management

- CRUD campaigns:
  - name, slug, description
  - type (`preorder | flash_sale | promotion`)
  - status (`active | ended | cancelled`)
  - `start_date`, `end_date`
  - `banner_image`, `thumbnail_image`
- Manage campaign items:
  - Add / edit / remove products or variants
  - Set `campaign_price`, `campaign_stock`, `campaign_image` per item
- Campaign settings:
  - `allow_over_stock`
  - `max_quantity_per_order`
  - `require_deposit`, `deposit_percentage`
  - `estimated_delivery_date`, `delivery_note`
- View metadata:
  - `total_orders`, `total_revenue`, `view_count`

### 4.6 Promotion Management

- CRUD promotions:
  - `code` (unique), name, description
  - type (`discount_code | buy_x_get_y | free_shipping`)
  - status (`active | inactive`)
  - `start_date`, `end_date`
- Discount configuration:
  - type (`percentage | fixed_amount | free_shipping`)
  - value, `max_discount_amount`, `min_order_amount`
- Usage limits:
  - `total_uses`, `per_user_limit`, `per_user_period`
- Applicable scope:
  - `all_products` (true/false)
  - products (array of `product_id`)
  - variants (array of `variant_id`)
- View metadata:
  - `total_discount_given`, `total_orders`, `view_count`

### 4.7 Order Management

- View order list, filter by:
  - Order status (`pending_payment | processing | shipped | delivered | cancelled`)
  - Date range
  - Email / phone
  - Promotion code
- View order details:
  - Contact info, shipping address, items (product + variant, quantity)
  - Payment plan, method, bank info, uploaded receipt
  - Applied promotion (if any): code, discount amount
- Update order status:
  - Confirm payment / valid receipt (`pending_payment → processing`)
  - Update shipping (`processing → shipped`)
  - Confirm delivery (`shipped → delivered`)
  - Cancel order (`→ cancelled`)

### 4.8 Payment Configuration

- Manage receiving bank accounts
- Enable / disable payment methods (`bank_transfer | momo | zalopay`)
- Configure visible payment plans (full / deposit) (optional)

---

## 5. Business Rules

### 5.1 Product

- `sku` must be unique system-wide
- `product_type` enum: `in_stock | preorder` (default: in_stock)
- `in_stock` ⇒ `preorder = null` (recommended)
- `preorder` ⇒ `preorder.start_date` and `preorder.end_date` are required
- `price`, `stock` ≥ 0
- `slug` must be unique

### 5.2 Variant

- `sku` must be unique system-wide
- Each variant belongs to exactly one product (`product_id`)
- Can override `price` and `stock` (nullable)
- If `variant.price` is null ⇒ use product price
- If `variant.stock` is null ⇒ use product stock

### 5.3 Campaign

- `slug` must be unique
- Campaign can contain both products and variants
- Each campaign item may define:
  - `campaign_price`
  - `campaign_stock`
  - `campaign_image`
- Campaign status:
  - `active`: `start_date ≤ now ≤ end_date`
  - `ended`: `now > end_date`
  - `cancelled`: manually cancelled
- If `require_deposit = true`, all orders in the campaign must use a deposit plan

### 5.4 Promotion

- `code` must be unique and case-insensitive
- Promotion status:
  - `active`: valid within date range
  - `inactive`: paused or expired
- Promotion validation:
  - Status must be active
  - Valid date range
  - Check `total_uses` and `used_count`
  - Check `per_user_limit` and `per_user_period`
  - Check `min_order_amount`
  - Check applicability (`all_products`, products, variants)
- Discount calculation:
  - `percentage`: `(subtotal * value / 100)`, capped by `max_discount_amount`
  - `fixed_amount`: flat discount
  - `free_shipping`: shipping fee waived
- Only one promotion per order
- Increment `used_count` after successful application

### 5.5 Order

- Required checkout fields:
  - Contact: `social_link`, `email`, `phone`
  - Shipping: `receiver_name`, `phone`, `address`
  - Payment: `plan_type`, `method`, `bill_image`
- `itemIds` array includes:
  - `product_id` (required)
  - `variant_id` (optional)
  - `quantity` (required, ≥ 1)
- Order status flow:
  - `pending_confirmation`: Receipt uploaded, waiting for owner confirmation
  - `payment_confirmed`: Payment confirmed by owner
  - `preparing_shipment`: Preparing items (optional)
  - `shipped`: Handed to shipping carrier
  - `delivered`: Customer received items
  - `cancelled`: Order cancelled (owner, customer, or rejected receipt)
- Promotion data stored in order:
  - `promotion_id`, `code`, `discount_amount`, `discount_type`
  - Immutable after order creation

### 5.6 Stock Management

- If variants have their own stock ⇒ deduct variant stock
- If variant stock is null ⇒ use product stock
- Preorder allows overselling if:
  - `product_type = preorder` without campaign, or
  - Campaign `allow_over_stock = true`
- Campaign stock (`campaign_stock`) is independent from product / variant stock

### 5.7 Payment Plan

- `full`: pay 100% of order value (after discount)
- `deposit`: partial payment based on `deposit_percentage`
- Deposits are commonly used for preorders and campaigns requiring deposits

---

## 6. Integration & Upload

### 6.1 File Upload

- Upload payment receipt:
  - Store file in storage (S3 / R2 / Cloudinary / Local)
  - Validate file type (`jpg`, `png`, `pdf`) and size (max 5MB)
  - Return URL stored in `order.payment.bill_image`
- Upload product / variant images:
  - Support multiple images
  - Validate file type and size
  - Resize / optimize if needed
- Upload campaign images:
  - `banner_image`, `thumbnail_image`
  - Per-item campaign images

### 6.2 Email Notifications (Optional)

- Send email notifications:
  - Order created
  - Payment confirmed
  - Shipping updates
  - Order delivered

### 6.3 SKU Management

- SKU format: customizable (e.g. `PRD-XXX-001`, `VAR-XXX-001`)
- SKU must be unique system-wide
- Can be auto-generated or manually entered
- SKU is displayed in:
  - Product detail page
  - Variant selection
  - Cart
  - Order detail
  - Admin management

---

End of docs.md
