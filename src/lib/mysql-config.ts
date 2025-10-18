import mysql from 'mysql2/promise';

export const mysqlPool = mysql.createPool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '3306'),
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: 'WHOOPHEALTHDATA',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}