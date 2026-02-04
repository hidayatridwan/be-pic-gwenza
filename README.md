# BE-PIC-GWENZA (Internal)

Backend service untuk **PIC & Production Monitoring System – Gwenza**.  
Project ini menggunakan **API + Worker architecture** dengan message queue (RabbitMQ) dan object storage (MinIO).

> ⚠️ Repository ini **INTERNAL ONLY**  
> Jangan share `.env`, credentials, atau akses infrastructure ke pihak luar.

---

## 🎯 Purpose

- Menyediakan REST API untuk kebutuhan PIC & monitoring
- Memproses task berat/asinkron via background workers
- Menyimpan & mengelola file menggunakan MinIO (S3 compatible)
- Menjaga performa API tetap ringan dan scalable

---

## 🧱 Tech Stack

- **Node.js 22**
- **Express.js**
- **MariaDB**
- **Prisma ORM**
- **RabbitMQ**
- **MinIO (S3 Compatible)**
- **Docker & Docker Compose**

---

## 📁 Project Structure

```txt
.
├── docker/
│   └── rabbitmq/            # Custom RabbitMQ image & config
├── logs/                    # Application & worker logs
├── prisma/
│   ├── migrations/          # Prisma migrations
│   └── schema.prisma
├── src/
│   ├── apps/                # App bootstrap / init logic
│   ├── controllers/         # HTTP controllers
│   ├── errors/              # Custom error definitions
│   ├── generated/           # Auto-generated files
│   ├── middlewares/         # Express middlewares
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Helpers / utilities
│   ├── validations/         # Joi validation schemas
│   ├── workers/             # RabbitMQ workers
│   └── main.js              # Application entry point
├── .env
├── docker-compose.yml
├── Dockerfile
├── Dockerfile.dev
├── package.json
└── README.md
