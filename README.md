# RFID Attendance System Backend

Sistem backend absensi berbasis RFID untuk IoT Campus Krinadwipayana.  
Dibangun dengan Node.js, Express, Prisma, dan JWT Authentication.

---

## 🚀 Fitur Utama

- **Manajemen User** (CRUD, aktivasi, role)
- **Manajemen Jadwal** (CRUD, assign user ke jadwal)
- **Absensi** (scan RFID, riwayat, rekap)
- **Notifikasi** (otomatis & manual, per user/role)
- **Settings** (konfigurasi sistem)
- **Audit Log** (catat aktivitas penting)
- **Dashboard & Analytics** (statistik kehadiran, grafik)
- **JWT Auth** (stateless, secure)

---

## 🛠️ Instalasi & Setup

1. **Clone repo & install dependencies**
   ```sh
   git clone <repo-url>
   cd backend-rfid
   npm install
   ```

2. **Copy file environment**
   ```sh
   cp .env.example .env
   ```
   Lalu isi variabel di `.env` sesuai kebutuhan (DB, JWT, dsb).

3. **Setup database**
   ```sh
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Jalankan server**
   ```sh
   npm run dev
   ```
   Server berjalan di port sesuai `.env` (default: 5000).

---

## 📚 Dokumentasi API

### **Authentication**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/auth/register`    | POST   | -         | Register user             |
| `/api/auth/login`       | POST   | -         | Login user                |
| `/api/auth/logout`      | POST   | Bearer    | Logout user               |
| `/api/auth/me`          | GET    | Bearer    | Get current user info     |

---

### **User Management (Admin Only)**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/users`            | POST   | Admin     | Create user               |
| `/api/users`            | GET    | Admin     | List users                |
| `/api/users/:id`        | GET    | Admin     | Get user by ID            |
| `/api/users/:id`        | PUT    | Admin     | Update user               |
| `/api/users/:id`        | DELETE | Admin     | Delete user               |

---

### **Schedule Management (Admin Only)**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/schedules`        | POST   | Admin     | Create schedule           |
| `/api/schedules`        | GET    | Admin     | List schedules            |
| `/api/schedules/:id`    | GET    | Admin     | Get schedule by ID        |
| `/api/schedules/:id`    | PUT    | Admin     | Update schedule           |
| `/api/schedules/:id`    | DELETE | Admin     | Delete schedule           |

---

### **Assign User to Schedule (Admin Only)**

| Endpoint                                      | Method | Auth  | Keterangan                       |
|------------------------------------------------|--------|-------|-----------------------------------|
| `/api/schedule-users`                          | POST   | Admin | Assign user ke schedule           |
| `/api/schedule-users/by-schedule/:scheduleId`  | GET    | Admin | List user dalam satu schedule     |
| `/api/schedule-users/by-user/:userId`          | GET    | Admin | List schedule yang diikuti user   |
| `/api/schedule-users/:id`                      | DELETE | Admin | Unassign user dari schedule       |

---

### **Attendance**

| Endpoint                                | Method | Auth   | Keterangan                              |
|------------------------------------------|--------|--------|------------------------------------------|
| `/api/attendance/scan`                   | POST   | Bearer | Scan absensi (RFID)                      |
| `/api/attendance/user/:userId`           | GET    | Bearer | List riwayat absensi per user            |
| `/api/attendance/schedule/:scheduleId`   | GET    | Bearer | List riwayat absensi per schedule        |
| `/api/attendance/recap/:userId`          | GET    | Bearer | Rekap absensi user                       |

---

### **Notification**

| Endpoint                                | Method | Auth   | Keterangan                              |
|------------------------------------------|--------|--------|------------------------------------------|
| `/api/notifications/role`                | POST   | Admin  | Kirim notifikasi ke semua user by role   |
| `/api/notifications/user`                | POST   | Admin  | Kirim notifikasi ke user tertentu        |
| `/api/notifications/me`                  | GET    | Bearer | List notifikasi user yang login          |
| `/api/notifications/:id/read`            | PUT    | Bearer | Tandai notifikasi sudah dibaca           |

---

### **Settings (Admin Only)**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/settings`         | POST   | Admin     | Create setting            |
| `/api/settings`         | GET    | Admin     | List settings             |
| `/api/settings/:key`    | GET    | Admin     | Get setting by key        |
| `/api/settings/:key`    | PUT    | Admin     | Update setting            |
| `/api/settings/:key`    | DELETE | Admin     | Delete setting            |

---

### **Audit Log (Admin Only)**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/audit-logs`       | GET    | Admin     | List audit logs           |

---

### **Dashboard & Analytics (Admin Only)**

| Endpoint                                | Method | Auth   | Keterangan                              |
|------------------------------------------|--------|--------|------------------------------------------|
| `/api/dashboard/attendance-stats`        | GET    | Admin  | Statistik kehadiran harian/mingguan/bulanan |
| `/api/dashboard/attendance-chart`        | GET    | Admin  | Data grafik absensi per status           |

---

### **Health Check**

| Endpoint                | Method | Auth      | Keterangan                |
|-------------------------|--------|-----------|---------------------------|
| `/api/health`           | GET    | -         | Cek status server         |

---

## 🔒 **Authentication & Role**

- Semua endpoint (kecuali `/api/auth/register`, `/api/auth/login`, `/api/health`) membutuhkan header:
  ```
  Authorization: Bearer <token>
  ```
- Endpoint dengan label **Admin** hanya bisa diakses user dengan role `ADMIN`.

---

## 📦 **Contoh Request**

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Scan Absensi:**
```http
POST /api/attendance/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id",
  "scheduleId": "schedule_id",
  "rfidCard": "1234567890"
}
```

---

## 📝 **Catatan**

- Semua response dalam format JSON.
- Timestamps (`createdAt`, `updatedAt`) tersedia di hampir semua resource.
- Untuk detail field dan enum, lihat file `prisma/schema.prisma`.

---

## 👨‍💻 **Kontribusi**

1. Fork repo ini
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahanmu
4. Push ke branch dan buat Pull Request

---

## 📄 **Lisensi**

MIT

---

**Backend RFID Attendance System — IoT Campus Krinadwipayana**