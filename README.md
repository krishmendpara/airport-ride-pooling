# 🚖 Smart Airport Ride Pooling Backend

A scalable backend system that groups airport passengers into shared cabs while respecting seat capacity, luggage limits, detour tolerance, and dynamic pricing.

Built with a modern asynchronous architecture using queue-based processing and distributed locking to support high concurrency.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Algorithm Design](#-algorithm-design)
- [Database Schema](#-database-schema)
- [Concurrency Strategy](#-concurrency-strategy)
- [Dynamic Pricing](#-dynamic-pricing)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Performance Considerations](#-performance-considerations)
- [Project Structure](#-project-structure)
- [Assumptions](#-assumptions)

---

## 🎯 Features

### Core Features

✅ Intelligent ride pooling  
✅ Seat & luggage constraint enforcement  
✅ Detour tolerance validation  
✅ Background ride processing (BullMQ)  
✅ Distributed locking (Redis)  
✅ Dynamic distance-based pricing  
✅ Redis-based surge multiplier  
✅ Real-time updates using Socket.IO  
✅ Rate limiting  
✅ Redis caching for read APIs  
✅ Swagger API documentation  

---

## 🛠 Tech Stack

### Backend
- **Node.js** (v18+)
- **Express.js**
- **TypeScript**

### Database
- **MongoDB** (with 2dsphere geospatial indexes)
- **Redis** (caching, distributed locks, queue backend)

### Queue & Async Processing
- **BullMQ**

### Real-Time Communication
- **Socket.IO**

### Utilities
- **Geolib** (Haversine distance calculation)
- **express-rate-limit**
- **swagger-ui-express**
- **swagger-jsdoc**

### Dev Tools
- **Docker**
- **Docker Compose**
- **PM2** (recommended for production)
- **Artillery** (load testing)

---

## 🏗 Architecture

### High-Level Flow
```
Client
  ↓
Express API
  ↓
MongoDB (store ride as PENDING)
  ↓
BullMQ Queue
  ↓
Worker
  ↓
Ride Matching + Pricing
  ↓
Update MongoDB
  ↓
Emit Socket.IO event
```

The API is **non-blocking**. Heavy operations are processed asynchronously in background workers.

---

## 🧠 Algorithm Design

### Ride Matching

**Approach:**
1. Query open pools
2. Filter by seat and luggage capacity
3. Calculate pickup proximity (geospatial)
4. Validate detour tolerance
5. Assign best valid pool (greedy selection)
6. Use Redis distributed lock to prevent race conditions

#### Time Complexity
- Geospatial query: `O(log n)`
- Pool filtering: `O(k)`
- **Total per request**: `O(log n + k)`

Where:
- `n` = total ride requests
- `k` = candidate pools

---

### Distance Calculation

Uses **Haversine formula** via Geolib.

**Time Complexity**: `O(1)`

---

## 💾 Database Schema

### RideRequests Collection
```javascript
{
  user: ObjectId,
  pickupLocation: { type: "Point", coordinates: [lng, lat] },
  dropLocation: { type: "Point", coordinates: [lng, lat] },
  luggageCount: Number,
  seatCount: Number,
  detourTolerance: Number,
  status: ["PENDING", "MATCHED", "CANCELLED"],
  pool: ObjectId,
  fare: Number,
  createdAt: Date
}
```

**Indexes:**
- `pickupLocation` → 2dsphere
- `dropLocation` → 2dsphere
- `status`
- `pool`

---

### RidePools Collection
```javascript
{
  passengers: [ObjectId],
  maxSeats: Number,
  maxLuggage: Number,
  currentSeats: Number,
  currentLuggage: Number,
  status: ["OPEN", "FULL"]
}
```

**Indexes:**
- `status`
- `status + currentSeats` (compound)

---

## 🔒 Concurrency Strategy

- ✅ Redis Distributed Lock (Redlock) prevents double assignment
- ✅ Atomic MongoDB document updates
- ✅ Background job processing via BullMQ
- ✅ Worker concurrency control
- ✅ Rate limiting per IP

**This prevents:**
- Double booking
- Over-capacity pools
- Race conditions
- Surge counter inconsistencies

---

## 💰 Dynamic Pricing

### Formula
```
fare = (baseFare + distance × perKmRate) × surgeMultiplier × poolDiscount
```

### Components

- **Base Fare**: Fixed starting price
- **Distance-based pricing**: Per-kilometer rate
- **Redis-based surge multiplier**: Active requests counter
- **Pool discount**: Shared ride discount

---

## 🚀 Getting Started

### Using Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Run development server
npm run dev
```

**Swagger UI:**
```
http://localhost:5000/api-docs
```

---

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start worker (in another terminal)
npm run worker
```

---

## 📚 API Endpoints

### Create Ride
```http
POST /api/rides/create
```

### Get Ride
```http
GET /api/rides/:rideId
```

### Cancel Ride
```http
DELETE /api/cancel/:rideId
```

### Swagger Documentation
```
http://localhost:5000/api-docs
```

---

## ⚡ Performance Considerations

- ✅ Async queue-based processing
- ✅ Redis caching (30s TTL)
- ✅ Indexed geospatial queries
- ✅ Rate limiting middleware
- ✅ Worker concurrency tuning
- ✅ Stateless API design for horizontal scaling

---

## 📁 Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # MongoDB schemas
├── routes/          # API routes
├── services/        # Business logic
├── workers/         # Background jobs
├── sockets/         # Socket.IO setup
├── utils/           # Utility functions
└── server.ts        # Application entry
```

---

## 📌 Assumptions

1. Maximum **4 seats** per pool
2. Maximum **6 luggage units** per pool
3. **5km matching radius** for nearby cabs
4. Simplified detour calculation (direct distance)
5. No payment gateway integration (fare calculation only)
6. No external map API integration (Haversine distance)
7. User authentication simplified (expects user ObjectId)

---

## ✅ Summary

This backend demonstrates:

✅ Scalable asynchronous architecture  
✅ Distributed concurrency control  
✅ Geospatial indexing  
✅ Queue-based job processing  
✅ Real-time event updates  
✅ Clean modular TypeScript structure  

---





<div align="center">

**⭐ Star this repo if you find it helpful!**

**Built with ❤️ using Node.js + TypeScript + MongoDB + Redis**

</div>
