# Diagnostic Booking Service

A backend service for diagnostic test bookings with simulated payments, built with Node.js, Express.js, PostgreSQL, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Databases:** PostgreSQL (users, bookings, payments) + MongoDB (diagnostic centres, tests)
- **Auth:** JWT (JSON Web Tokens)
- **ORM/ODM:** Sequelize (PostgreSQL) + Mongoose (MongoDB)

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- MongoDB >= 6.0

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb diagnostic_booking
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
| Method | Endpoint           | Description      | Auth |
|--------|-------------------|------------------|------|
| POST   | /api/auth/signup   | Register user    | No   |
| POST   | /api/auth/login    | Login user       | No   |
| GET    | /api/auth/profile  | Get user profile | Yes  |

### Diagnostic Tests
| Method | Endpoint           | Description      | Auth |
|--------|-------------------|------------------|------|
| GET    | /api/centres/tests | List all tests   | Yes  |
| POST   | /api/centres/tests | Create a test    | Yes  |

### Diagnostic Centres
| Method | Endpoint                  | Description           | Auth |
|--------|--------------------------|----------------------|------|
| GET    | /api/centres              | List all centres     | Yes  |
| GET    | /api/centres/:id          | Get centre details   | Yes  |
| POST   | /api/centres              | Create a centre      | Yes  |
| POST   | /api/centres/:id/tests    | Add test to centre   | Yes  |

### Bookings
| Method | Endpoint                    | Description       | Auth |
|--------|-----------------------------|-------------------|------|
| POST   | /api/bookings               | Create booking    | Yes  |
| GET    | /api/bookings               | List my bookings  | Yes  |
| GET    | /api/bookings/:id           | Get booking       | Yes  |
| PATCH  | /api/bookings/:id/cancel    | Cancel booking    | Yes  |

### Payments
| Method | Endpoint               | Description              | Auth |
|--------|------------------------|--------------------------|------|
| POST   | /api/payments          | Initiate payment         | Yes  |
| POST   | /api/payments/webhook  | Payment webhook          | No   |

## Demo Credentials

After seeding: `john@example.com` / `password123`

## Architecture Decisions

- **Dual database:** PostgreSQL for transactional data (users, bookings, payments) ensuring ACID compliance. MongoDB for catalogue data (centres, tests) leveraging flexible document schema.
- **Idempotent webhooks:** Webhook events are deduplicated using a unique `event_id` stored on the payment record. Database unique constraints handle race conditions.
- **Payment simulation:** Configurable success rate via `PAYMENT_SUCCESS_RATE` env variable.
- **Authorization:** Users can only view/modify their own bookings.
