@echo off
REM Script untuk create production user di MySQL

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

echo Creating production user...
%MYSQL_PATH% -u root -e "CREATE USER 'prod_user'@'%%' IDENTIFIED BY 'Inventaris@2025!';"
%MYSQL_PATH% -u root -e "GRANT ALL PRIVILEGES ON inventarisasi.* TO 'prod_user'@'%%';"
%MYSQL_PATH% -u root -e "FLUSH PRIVILEGES;"
%MYSQL_PATH% -u root -e "SELECT user, host FROM mysql.user WHERE user='prod_user';"

echo.
echo Production user created successfully!
echo.
echo Connection string:
echo mysql -h localhost -u prod_user -p inventarisasi
echo password: Inventaris@2025!
echo.
pause
