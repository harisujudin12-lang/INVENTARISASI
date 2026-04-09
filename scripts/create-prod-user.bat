@echo off
REM Script untuk create production user di MySQL
REM Set password aman di PROD_DB_PASSWORD sebelum menjalankan script

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set PROD_DB_PASSWORD=<STRONG_PASSWORD>

echo Creating production user...
%MYSQL_PATH% -u root -e "CREATE USER 'prod_user'@'%%' IDENTIFIED BY '%PROD_DB_PASSWORD%';"
%MYSQL_PATH% -u root -e "GRANT ALL PRIVILEGES ON inventarisasi.* TO 'prod_user'@'%%';"
%MYSQL_PATH% -u root -e "FLUSH PRIVILEGES;"
%MYSQL_PATH% -u root -e "SELECT user, host FROM mysql.user WHERE user='prod_user';"

echo.
echo Production user created successfully!
echo.
echo Connection string:
echo mysql -h localhost -u prod_user -p inventarisasi
echo password: %PROD_DB_PASSWORD%
echo.
pause
