# Uniblox Assignment

A full-stack e-commerce application built with React (frontend) and Express.js (backend), featuring a customer-facing store and an admin dashboard for managing products, orders, and discount codes.

## 🚀 Features

### Store (Customer-Facing)
- **Product Catalog**: Browse products with pagination and infinite scroll
- **Product Search**: Search for products by name
- **Product Details**: View detailed information about individual products
- **Shopping Cart**: Add, update, and manage items in your cart
- **Discount Codes**: Apply discount codes at checkout
- **Checkout**: Complete orders with discount code support
- **Order Confirmation**: View order success page after checkout

### Admin Dashboard
- **Admin Authentication**: Secure login system with JWT tokens
- **Statistics Dashboard**: View sales statistics and analytics
- **Discount Code Management**: Create and manage global discount codes
- **Protected Routes**: All admin routes are protected with authentication middleware

## 🚦 Getting Started

For detailed setup instructions, please refer to [setup.md](./setup.md).


## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Rspack** for bundling
- **Zustand** for state management
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database management
- **SQLite** (via LibSQL) for database
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

## 📁 Project Structure

```
uniblox-assignment/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── utils/          # Utility functions
│   │   └── router/         # Route configuration
│   └── package.json
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── controller/     # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── db/             # Database schema and connection
│   │   └── utils/          # Utility functions
│   ├── drizzle/            # Database migrations
│   ├── Uniblox Assignment.postman_collection.json  # Postman API collection
│   └── package.json
├── setup.md                # Detailed setup instructions
└── README.md               # This file
```

## 🔌 API Endpoints

### Store API (`/api/v1/store`)
- `GET /products` - Get paginated products
- `GET /products/search` - Search products
- `GET /products/product/:productId` - Get product by ID
- `GET /cart` - Get user's cart
- `PUT /cart` - Update cart
- `GET /discounts` - Get available discount codes
- `POST /checkout` - Process checkout with discount code

### Admin API (`/api/v1/admin`)
- `POST /auth/login` - Admin login
- `GET /statistics` - Get sales statistics (protected)
- `POST /discount-codes` - Create discount code (protected)

## 📦 Postman API Collection

A complete Postman API collection is available in [Postman Collection](./server/UnibloxAssignment.postman_collection.json)


## 🧪 Testing

The backend includes comprehensive test suites:
- Integration tests

To run test go to:
   ```bash
   cd server
   npm run test
   ```