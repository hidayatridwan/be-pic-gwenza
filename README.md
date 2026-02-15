# BE-PIC-GWENZA (Internal)

Backend service untuk **PIC & Production Monitoring System -- Gwenza**.\
Project ini menggunakan **API + Worker architecture** dengan message
queue (RabbitMQ) dan object storage (MinIO).

> ⚠️ Repository ini **INTERNAL ONLY**\
> Jangan share `.env`, credentials, atau akses infrastructure ke pihak
> luar.

------------------------------------------------------------------------

## 🎯 Purpose

-   Menyediakan REST API untuk kebutuhan PIC & monitoring
-   Memproses task berat/asinkron via background workers
-   Menyimpan & mengelola file menggunakan MinIO (S3 compatible)
-   Menyediakan AI-powered analytics query interface (Natural Language →
    SQL)
-   Menjaga performa API tetap ringan dan scalable

------------------------------------------------------------------------

## 🧱 Tech Stack

-   **Node.js 22**
-   **Express.js**
-   **MariaDB**
-   **Prisma ORM**
-   **RabbitMQ**
-   **MinIO (S3 Compatible)**
-   **OpenRouter (ArceeAI-compatible API)**
-   **ArceeAI SDK (AI abstraction layer)**
-   **Docker & Docker Compose**

------------------------------------------------------------------------

## 🤖 AI Integration (OpenRouter / OpenAI Compatible)

Project ini terintegrasi dengan AI provider melalui **OpenRouter
(OpenAI-compatible API)**.

Digunakan untuk:

-   Natural Language → Query Plan conversion
-   Intent detection
-   Dynamic analytics query generation
-   Executive summary generation

### 🔄 AI Flow Architecture

    User Question
        ↓
    AI Provider (OpenRouter / ArceeAI-compatible)
        ↓
    Query Plan JSON
        ↓
    Joi Validation
        ↓
    Intent Router
        ↓
    SQL Builder
        ↓
    MariaDB
        ↓
    Natural Language Response

### 🎯 Supported Intents

-   `top_product`
-   `total_orders`
-   `channel_comparison`
-   `cancel_rate`
-   `deadline_alert`
-   `period_growth`
-   `product_trend`
-   `status_summary`
-   `urgent_orders`
-   `executive_summary`

------------------------------------------------------------------------

## 🔐 Environment Variables

Tambahkan ke `.env`:

    OPENROUTER_API_KEY=your_key_here
    AI_PROVIDER=openrouter

Jika menggunakan OpenAI native:

    OPENAI_API_KEY=your_key_here
    AI_PROVIDER=openai

------------------------------------------------------------------------

## 📁 Project Structure

    .
    ├── docker/
    │   └── rabbitmq/
    ├── logs/
    ├── prisma/
    │   ├── migrations/
    │   └── schema.prisma
    ├── src/
    │   ├── apps/
    │   ├── controllers/
    │   ├── errors/
    │   ├── generated/
    │   ├── middlewares/
    │   ├── routes/
    │   ├── services/
    │   ├── utils/
    │   ├── validations/
    │   ├── workers/
    │   └── main.js
    ├── .env
    ├── docker-compose.yml
    ├── Dockerfile
    ├── Dockerfile.dev
    ├── package.json
    └── README.md

------------------------------------------------------------------------

## ⚙️ Development

### Start Development

    docker compose up -d

### Run Worker

    npm run worker:upload
    npm run worker:process
    npm run worker:retry
    npm run worker:sync

------------------------------------------------------------------------

## 🛡️ Security Notes

-   Jangan commit `.env`
-   Jangan expose API keys
-   Gunakan rate limit untuk endpoint AI
-   Validasi semua AI output dengan Joi sebelum digunakan
-   Jangan pernah execute raw SQL dari AI response

------------------------------------------------------------------------

## 🚀 Future Roadmap

-   Multi-provider AI fallback
-   Query caching (Redis)
-   AI cost monitoring
-   Executive dashboard analytics
-   Auto anomaly detection
