-- Script untuk Create Production User di MySQL
-- Run ini di phpMyAdmin atau MySQL CLI
-- Ganti <STRONG_PASSWORD> sebelum dijalankan

-- Step 1: Create user untuk production
CREATE USER 'prod_user'@'%' IDENTIFIED BY '<STRONG_PASSWORD>';

-- Step 2: Grant semua permissions ke database inventarisasi
GRANT ALL PRIVILEGES ON inventarisasi.* TO 'prod_user'@'%';

-- Step 3: Apply changes
FLUSH PRIVILEGES;

-- Step 4: Verify user berhasil dibuat
SELECT user, host FROM mysql.user WHERE user='prod_user';

-- Step 5: Test login (jalankan command ini di terminal):
-- mysql -h localhost -u prod_user -p inventarisasi
-- password: <STRONG_PASSWORD>
