# BE PIC Gwenza

Backend system for Gwenza production monitoring - an integrated production management system with e-commerce platforms (TikTok & Shopee) to manage orders, inventory, and production processes.

## 📋 Description

BE PIC Gwenza is a backend system designed to manage the entire production flow from order receipt to product delivery. The system uses a microservices architecture with message queue (RabbitMQ) for asynchronous data processing.

## 🏗️ System Architecture

### Tech Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Database**: MySQL/MariaDB with Prisma ORM
- **Message Queue**: RabbitMQ (AMQP)
- **Object Storage**: MinIO (S3-compatible)
- **AI Integration**: OpenRouter API
- **Authentication**: JWT (Access & Refresh Token)
- **File Processing**: XLSX for data import
- **Containerization**: Docker & Docker Compose

### Main Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express API Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Public API   │  │  Auth API    │  │ Middlewares  │      │
│  │ - Register   │  │ - Protected  │  │ - Auth       │      │
│  │ - Login      │  │   Routes     │  │ - Upload     │      │
│  │ - Refresh    │  │              │  │ - Error      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   MariaDB   │  │  RabbitMQ   │  │   MinIO     │
│  (Database) │  │   (Queue)   │  │  (Storage)  │
└─────────────┘  └──────┬──────┘  └─────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Upload Worker │ │Order Worker  │ │Sync Worker   │
│- Parse Excel │ │- Insert DB   │ │- Sync Data   │
│- Validate    │ │- Update      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 🔄 Application Flow

### 1. Authentication Flow
```
User → Login → JWT Token (Access + Refresh) → Protected Routes
                    ↓
              Cookie Storage
                    ↓
              Auto Refresh (when expired)
```

### 2. Order Import Flow (Asynchronous)
```
1. User uploads Excel file (TikTok/Shopee format)
   ↓
2. File is saved to MinIO (S3)
   ↓
3. Publish message to RabbitMQ (UPLOAD_ORDER_QUEUE)
   ↓
4. Upload Worker consumes message
   ↓
5. Download file from MinIO & parse Excel
   ↓
6. Batch data & publish to PROCESS_ORDER_QUEUE
   ↓
7. Order Worker consumes & inserts to database
   ↓
8. Update import status to processed
```

### 3. Production Flow
```
Order → Project → Project Items → Assign Tailor → Inbound → Outbound
  ↓        ↓           ↓              ↓            ↓          ↓
Open    Batch ID   Distribution   Production   Receive   Delivery
```

### 4. Merchandise Flow
```
Supplier → Merchandise Inbound → Stock → Merchandise Outbound → Tailor
              ↓                    ↓              ↓
          Material/            Inventory      Production
          Accessories          Tracking        Material
```

## 📁 Project Structure

```
be-pic-gwenza/
├── src/
│   ├── apps/                    # Application configuration
│   │   ├── database.js          # Prisma client
│   │   ├── logging.js           # Winston logger
│   │   ├── rabbitmq.js          # RabbitMQ connection
│   │   ├── s3.client.js         # MinIO/S3 client
│   │   └── web.js               # Express app setup
│   │
│   ├── controllers/             # Request handlers
│   │   ├── user.controller.js
│   │   ├── order.controller.js
│   │   ├── project.controller.js
│   │   ├── inbound.controller.js
│   │   ├── outbound.controller.js
│   │   ├── merchandise.*.controller.js
│   │   └── ...
│   │
│   ├── services/                # Business logic
│   │   ├── user.service.js
│   │   ├── order.service.js
│   │   ├── project.service.js
│   │   └── ...
│   │
│   ├── validations/             # Joi validation schemas
│   │   ├── validation.js        # Base validator
│   │   └── *.validation.js
│   │
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── error.middleware.js  # Error handler
│   │   └── upload.middleware.js # Multer S3 upload
│   │
│   ├── routes/                  # API routes
│   │   ├── public.api.js        # Public endpoints
│   │   └── auth.api.js          # Protected endpoints
│   │
│   ├── workers/                 # Background workers
│   │   ├── upload.worker.js     # Process uploaded files
│   │   ├── order.worker.js      # Process orders
│   │   ├── sync.worker.js       # Sync operations
│   │   ├── upload.cmd.js        # Upload worker CLI
│   │   └── process.cmd.js       # Process worker CLI
│   │
│   ├── utils/                   # Utilities
│   │   ├── constants.js         # App constants
│   │   ├── format.js            # Date/data formatters
│   │   ├── generate.js          # ID generators
│   │   ├── security.js          # Bcrypt helpers
│   │   └── rabbitmq/
│   │       ├── publisher.js     # RabbitMQ publisher
│   │       └── queue.js         # Queue setup
│   │
│   ├── errors/                  # Custom errors
│   │   └── response.error.js
│   │
│   └── main.js                  # Application entry point
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
│
├── docker/
│   └── rabbitmq/
│       └── Dockerfile           # Custom RabbitMQ image
│
├── docker-compose.yml           # Docker services
├── Dockerfile                   # Production image
├── Dockerfile.dev               # Development image
├── Makefile                     # Docker shortcuts
├── .env.example                 # Environment template
└── package.json                 # Dependencies
```

## 🗄️ Database Schema

### Core Entities

#### Users & Authentication
- **User**: User management with role-based access (ADMIN_SYSTEM, PPIC, RECEIPT, FD, MD, INBOUND_OPERATOR, OUTBOUND_OPERATOR, PRODUCT_ADMIN)

#### Production Management
- **Order**: Orders from e-commerce platforms (TikTok/Shopee)
- **Project**: Production batch with PIC (Person In Charge)
- **ProjectItem**: Detailed items per project with tailor assignment
- **Inbound**: Receipt of production results from tailor
- **Outbound**: Product shipment to customer
- **Return**: Product returns

#### Master Data
- **Product**: Product master with variants
- **Variant**: Product variants (size, color, etc.)
- **ProductVariant**: Many-to-many relationship between product and variant
- **Tailor**: Tailor/vendor data
- **FashionDesign**: Design samples and revision tracking

#### Merchandise Management
- **Merchandise**: Production materials and accessories
- **Supplier**: Material supplier data
- **Color**: Color master data
- **MerchandiseInbound**: Material receipt from supplier
- **MerchandiseOutbound**: Material distribution to tailor

#### Import & AI
- **Import**: File import tracking (ORDER/CANCEL)
- **AI Integration**: AI queries for data analysis

## 🚀 Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development without Docker)
- Make (optional, for shortcuts)

### Quick Start with Docker

1. **Clone repository**
```bash
git clone <repository-url>
cd be-pic-gwenza
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env as needed
```

3. **Generate JWT secrets**
```bash
# Generate random string for ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

4. **Start services**
```bash
# Using Make
make build    # Build and start all services
make start    # Start services (without rebuild)
make stop     # Stop services
make clean    # Clean unused images

# Or directly with docker-compose
docker compose up --build
docker compose up -d          # Detached mode
docker compose down           # Stop services
```

5. **Run database migrations**
```bash
# Enter API container
docker compose exec api sh

# Run migration
npx prisma migrate deploy

# Generate Prisma client (if not yet generated)
npx prisma generate
```

6. **Access services**
- API: http://localhost:3000
- MinIO Console: http://localhost:9003 (minioadmin/minioadmin123)
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- MariaDB: localhost:3306 (root/4377)

### Development Setup (Without Docker)

1. **Install dependencies**
```bash
npm install
```

2. **Setup database**
```bash
# Make sure MySQL/MariaDB is running
# Update DATABASE_URL in .env

npx prisma migrate deploy
npx prisma generate
```

3. **Setup MinIO & RabbitMQ**
```bash
# Install and run MinIO & RabbitMQ locally
# Or use docker-compose only for these services
docker compose up -d mariadb minio rabbitmq
```

4. **Run application**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run workers (in separate terminals)
npm run worker:upload
npm run worker:process
npm run worker:sync
```

## 📡 API Endpoints

### Public Endpoints

```
GET  /health-check              # Health check
POST /users                     # Register user
POST /users/login               # Login
GET  /users/refresh-token       # Refresh access token
GET  /users/logout              # Logout
```

### Protected Endpoints (Require JWT)

#### User Management
```
GET  /users                     # List users
POST /users/change-password     # Change password
```

#### Master Data
```
# Tailors
POST   /tailors                 # Create tailor
GET    /tailors                 # List tailors
GET    /tailors/:tailorId       # Get tailor detail
PUT    /tailors/:tailorId       # Update tailor
DELETE /tailors/:tailorId       # Delete tailor

# Products
POST   /products                # Create product
GET    /products                # List products
GET    /products/:productId     # Get product detail
PUT    /products/:productId     # Update product
GET    /products/:productId/variants  # Get product variants

# Variants
GET    /variants                # List variants

# Suppliers
POST   /suppliers               # Create supplier
GET    /suppliers               # List suppliers
GET    /suppliers/:supplierId   # Get supplier detail
PUT    /suppliers/:supplierId   # Update supplier

# Colors
POST   /colors                  # Create color
GET    /colors                  # List colors
GET    /colors/:colorId         # Get color detail
PUT    /colors/:colorId         # Update color
```

#### Order Management
```
POST /imports                   # Upload order file (Excel)
GET  /imports                   # List imports
GET  /orders                    # List orders
GET  /orders/summary            # Order summary
```

#### Production Management
```
# Projects
POST   /projects                # Create project (batch)
DELETE /projects/:projectId     # Cancel project
GET    /projects                # List projects
GET    /projects/:projectId/project-items  # Get project items
GET    /projects/:productId/product-items  # Get product items
GET    /projects/products       # Get products for project

# Inbound (Receipt from Tailor)
POST   /inbounds                # Create inbound
DELETE /inbounds/:inboundId     # Cancel inbound
GET    /inbounds                # List inbounds

# Outbound (Shipment to Customer)
POST   /outbounds               # Create outbound
GET    /outbounds               # List outbounds
DELETE /outbounds/:outboundId   # Cancel outbound

# Returns
POST   /returns                 # Create return
GET    /returns                 # List returns
```

#### Merchandise Management
```
# Merchandise
POST   /merchandises            # Create merchandise
GET    /merchandises            # List merchandises
GET    /merchandises/:merchandiseId  # Get merchandise detail
PUT    /merchandises/:merchandiseId  # Update merchandise

# Merchandise Inbound
POST   /merchandise-inbounds    # Create merchandise inbound
GET    /merchandise-inbounds    # List merchandise inbounds
GET    /merchandise-inbounds/:merchandiseId/inbound-codes  # Get inbound codes
DELETE /merchandise-inbounds/:merchandiseInboundId  # Cancel

# Merchandise Outbound
POST   /merchandise-outbounds   # Create merchandise outbound
GET    /merchandise-outbounds   # List merchandise outbounds
DELETE /merchandise-outbounds/:merchandiseOutboundId  # Cancel
```

#### Fashion Design
```
POST   /fashion-designs         # Create fashion design (with file upload)
GET    /fashion-designs         # List fashion designs
PUT    /fashion-designs/:fashionDesignId  # Update fashion design
DELETE /fashion-designs/:fashionDesignId  # Delete fashion design
```

#### Reports
```
GET /reports/products           # Report by products
GET /reports/pic                # Report by PIC
GET /reports/tailors            # Report by tailors
GET /reports/date               # Report by expired date
GET /reports/merchandise-summary  # Merchandise summary
GET /reports/merchandise-date   # Merchandise by date
```

#### AI Integration
```
POST /ai                        # AI query/analysis
```

## 🔐 Authentication

The system uses JWT with dual token strategy:

### Access Token
- Short-lived (15 minutes)
- Sent via Authorization header: `Bearer <token>`
- Used for all protected endpoints

### Refresh Token
- Long-lived (7 days)
- Stored in HTTP-only cookie
- Used to generate new access token

### Flow
```
1. Login → Receive Access Token + Refresh Token (cookie)
2. Request with Access Token in header
3. Access Token expired → Call /users/refresh-token
4. Receive new Access Token
5. Repeat step 2
```

## 🔧 Environment Variables

```bash
# Application
APP_PORT=3000

# JWT Authentication
ACCESS_TOKEN_SECRET=<random-64-char-hex>
REFRESH_TOKEN_SECRET=<random-64-char-hex>

# Database
DATABASE_URL=mysql://root:4377@mariadb:3306/pic_gwenza

# MinIO (S3-compatible storage)
S3_URL=http://minio:9000
S3_KEY=minioadmin
S3_SECRET=minioadmin123
S3_BUCKET=pic-gwenza

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_EXCHANGE=gwenzax.order
RABBITMQ_EXCHANGE_TYPE=topic

# Queue Names
UPLOAD_ORDER_QUEUE=upload.order.queue
PROCESS_ORDER_QUEUE=process.order.queue
UPLOAD_CANCEL_QUEUE=upload.cancel.queue
PROCESS_CANCEL_QUEUE=process.cancel.queue

# Routing Keys (Events)
UPLOAD_ORDER_CREATED=upload.order.created
UPLOAD_ORDER_CANCELLED=upload.order.cancelled
PROCESS_ORDER_REQUESTED=order.process.requested
PROCESS_ORDER_CANCELLED=order.process.cancelled

# Dead Letter Queue
DLQ_SUFFIX=.dlq

# AI Integration
OPENROUTER_API_KEY=<your-api-key>
```

## 🎯 Use Cases

### 1. Import Orders from E-commerce
```
1. User uploads Excel file (TikTok/Shopee format)
2. System parses and validates data
3. Orders enter database with OPEN status
4. Orders are ready to be created as projects
```

### 2. Create Production Project
```
1. PPIC selects orders to be produced
2. Create project with batch ID
3. Assign PIC and tailor for each item
4. Tailor starts production
```

### 3. Production Receipt (Inbound)
```
1. Inbound operator receives goods from tailor
2. Input quantity and quality check
3. Update stock and project status
4. Goods ready for outbound
```

### 4. Shipment to Customer (Outbound)
```
1. Outbound operator prepares goods
2. Input tracking number and shipping date
3. Update order status to CLOSED
4. Generate shipping report
```

### 5. Material Management (Merchandise)
```
1. Receive material from supplier (Inbound)
2. Track stock per color and type
3. Distribute material to tailor (Outbound)
4. Monitor usage and reorder point
```

## 📊 Monitoring & Logging

### Logging
- Winston logger with daily rotate file
- Log levels: error, warn, info, debug
- Log files in `/logs` directory

### RabbitMQ Monitoring
- Management UI: http://localhost:15672
- Monitor queue depth, message rates
- Dead Letter Queue for failed messages

### Database Monitoring
- Prisma query logging (development)
- Connection pool monitoring

## 🧪 Testing

```bash
# Run tests (if available)
npm test

# Check database connection
npx prisma db pull

# Validate schema
npx prisma validate

# View database in Prisma Studio
npx prisma studio
```

## 🐛 Troubleshooting

### RabbitMQ Connection Failed
```bash
# Check RabbitMQ status
docker compose ps rabbitmq
docker compose logs rabbitmq

# Restart RabbitMQ
docker compose restart rabbitmq
```

### Database Connection Error
```bash
# Check MariaDB status
docker compose ps mariadb
docker compose logs mariadb

# Test connection
docker compose exec mariadb mysql -uroot -p4377 -e "SHOW DATABASES;"
```

### MinIO Upload Failed
```bash
# Check MinIO status
docker compose ps minio
docker compose logs minio

# Create bucket manually
# Access MinIO console: http://localhost:9003
# Login: minioadmin/minioadmin123
# Create bucket: pic-gwenza
```

### Worker Not Processing Messages
```bash
# Check worker logs
docker compose logs api

# Restart workers
npm run worker:upload
npm run worker:process
```

## 🔄 Update & Migration

### Update Dependencies
```bash
npm update
npm audit fix
```

### Database Migration
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migration to production
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

## 📝 Best Practices

1. **Always use transactions** for multi-table operations
2. **Validate input** using Joi schemas
3. **Handle errors** with proper error middleware
4. **Log important operations** for audit trail
5. **Use batch processing** for bulk operations
6. **Implement retry mechanism** for failed messages
7. **Monitor queue depth** to prevent bottleneck
8. **Regular backup** of database and MinIO storage

## 👥 User Roles

- **ADMIN_SYSTEM**: Full access to all features
- **PPIC**: Production planning & control
- **RECEIPT**: Goods receipt
- **FD**: Fashion design management
- **MD**: Merchandise management
- **INBOUND_OPERATOR**: Inbound operations
- **OUTBOUND_OPERATOR**: Outbound operations
- **PRODUCT_ADMIN**: Product master data management

## 📄 License

ISC

## 👨‍💻 Author

Ridwan Hidayat

---

**Note**: This system is under active development. For questions or issues, please contact the development team.
