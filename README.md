# BE PIC Gwenza

A backend system for production monitoring and inventory management for Gwenza. This application handles order processing, project management, inbound/outbound logistics, and merchandise tracking.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Workers](#workers)
- [Project Structure](#project-structure)

## ✨ Features

- **User Management** - Authentication and authorization with role-based access control
- **Order Management** - Process and track orders from multiple channels
- **Project Management** - Create and manage production projects with batch tracking
- **Inbound/Outbound Logistics** - Track goods receipt and distribution
- **Merchandise Management** - Manage raw materials and accessories inventory
- **Fashion Design Tracking** - Track sample development and production readiness
- **Supplier Management** - Manage supplier information
- **Product & Variant Management** - Manage products with multiple variants
- **Report Generation** - Generate reports with AI-powered query capabilities
- **File Import** - Bulk import orders and cancellations via Excel files

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MySQL/MariaDB
- **ORM**: Prisma
- **Message Queue**: RabbitMQ
- **Object Storage**: MinIO (S3-compatible)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Logging**: Winston
- **AI Integration**: OpenRouter API

## 📦 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MySQL/MariaDB (or use Docker)
- RabbitMQ (or use Docker)
- MinIO (or use Docker)

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/hidayatridwan/be-pic-gwenza.git
cd be-pic-gwenza
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

4. **Run database migrations**

```bash
npx prisma migrate deploy
# or for development
npx prisma migrate dev
```

## ⚙️ Configuration

Create a `.env` file based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PORT` | Application port | `3000` |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | - |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | - |
| `DATABASE_URL` | MySQL connection string | - |
| `S3_URL` | MinIO/S3 endpoint URL | - |
| `S3_KEY` | S3 access key | - |
| `S3_SECRET` | S3 secret key | - |
| `S3_BUCKET` | S3 bucket name | - |
| `RABBITMQ_URL` | RabbitMQ connection URL | - |
| `RABBITMQ_EXCHANGE` | RabbitMQ exchange name | - |
| `OPENROUTER_API_KEY` | OpenRouter AI API key | - |

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Running Workers

```bash
# Upload order worker
npm run worker:upload-order

# Upload cancel worker
npm run worker:upload-cancel

# Process order worker
npm run worker:process-order

# Process cancel worker
npm run worker:process-cancel
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh access token |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/products` | Get product list |
| GET | `/api/public/variants` | Get variant list |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |

### Inbounds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inbounds` | Get all inbounds |
| POST | `/api/inbounds` | Create inbound |
| PATCH | `/api/inbounds/:id` | Update inbound |

### Outbounds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/outbounds` | Get all outbounds |
| POST | `/api/outbounds` | Create outbound |
| PATCH | `/api/outbounds/:id` | Update outbound |

### Merchandise

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchandises` | Get all merchandise |
| POST | `/api/merchandises` | Create merchandise |
| PATCH | `/api/merchandises/:id` | Update merchandise |

### Merchandise Inbound

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchandise-inbounds` | Get all merchandise inbounds |
| POST | `/api/merchandise-inbounds` | Create merchandise inbound |
| PATCH | `/api/merchandise-inbounds/:id` | Update merchandise inbound |

### Merchandise Outbound

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchandise-outbounds` | Get all merchandise outbounds |
| POST | `/api/merchandise-outbounds` | Create merchandise outbound |
| PATCH | `/api/merchandise-outbounds/:id` | Update merchandise outbound |

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | Get all suppliers |
| POST | `/api/suppliers` | Create supplier |
| PATCH | `/api/suppliers/:id` | Update supplier |

### Tailors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tailors` | Get all tailors |
| POST | `/api/tailors` | Create tailor |
| PATCH | `/api/tailors/:id` | Update tailor |

### Fashion Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fashion-designs` | Get all fashion designs |
| POST | `/api/fashion-designs` | Create fashion design |
| PATCH | `/api/fashion-designs/:id` | Update fashion design |

### Colors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/colors` | Get all colors |
| POST | `/api/colors` | Create color |
| PATCH | `/api/colors/:id` | Update color |

### Variants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/variants` | Get all variants |
| POST | `/api/variants` | Create variant |
| PATCH | `/api/variants/:id` | Update variant |

### Returns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/returns` | Get all returns |
| POST | `/api/returns` | Create return |
| PATCH | `/api/returns/:id` | Update return |

### Imports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/imports/upload` | Upload import file |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/ai` | AI-powered report query |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/query` | AI query endpoint |

## 🗄 Database Schema

### User Roles

| Role | Description |
|------|-------------|
| `ADMIN_SYSTEM` | Full system access |
| `PPIC` | Production Planning & Inventory Control |
| `RECEIPT` | Receipt/Receiving operations |
| `FD` | Fashion Design |
| `MD` | Merchandising |
| `INBOUND_OPERATOR` | Inbound operations |
| `OUTBOUND_OPERATOR` | Outbound operations |
| `PRODUCT_ADMIN` | Product management |

### Core Entities

- **Users** - System users with role-based access
- **Products** - Product catalog
- **Variants** - Product variants (sizes, colors, etc.)
- **Orders** - Customer orders from various channels
- **Projects** - Production batches/projects
- **ProjectItems** - Individual assignments within projects
- **Inbounds** - Goods receipt records
- **Outbounds** - Goods issue records
- **Returns** - Return transactions
- **Tailors** - Tailor/master information
- **Merchandise** - Raw materials and accessories
- **Suppliers** - Supplier information
- **Colors** - Color master data
- **FashionDesigns** - Sample development tracking

## 🔄 Workers

The application uses RabbitMQ workers for asynchronous processing:

| Worker | Queue | Description |
|--------|-------|-------------|
| `upload-order` | `upload.order.queue` | Process bulk order uploads from Excel files |
| `upload-cancel` | `upload.cancel.queue` | Process bulk cancellation uploads |
| `process-order` | `process.order.queue` | Process individual order records |
| `process-cancel` | `process.cancel.queue` | Process individual cancellation records |

## 📁 Project Structure

```
src/
├── apps/                    # Application bootstrap
│   ├── database.js         # Database connection
│   ├── logging.js          # Winston logger setup
│   ├── rabbitmq.js         # RabbitMQ connection
│   ├── s3.client.js        # MinIO/S3 client
│   └── web.js              # Express app setup
├── controllers/            # Request handlers
├── errors/                 # Custom error classes
├── generated/              # Prisma generated client
├── middlewares/            # Express middlewares
│   ├── auth.middleware.js  # JWT authentication
│   ├── error.middleware.js # Error handling
│   └── upload.middleware.js# File upload handling
├── routes/                 # API route definitions
├── services/               # Business logic layer
├── utils/                  # Utility functions
│   ├── constants.js        # Application constants
│   ├── format.js           # Formatting utilities
│   ├── generate.js         # Code generation
│   ├── security.js         # Security utilities
│   └── rabbitmq/           # RabbitMQ utilities
├── validations/            # Joi validation schemas
└── workers/                # Background workers
    ├── process-cancel/
    ├── process-order/
    ├── upload-cancel/
    └── upload-order/
```

## 📝 License

ISC License

## 👤 Author

Ridwan Hidayat