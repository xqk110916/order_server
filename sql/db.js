const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
  host: '59.110.47.109',
  port: 3306,
  user: 'xqk',
  password: '1379502663.sx',
  database: 'sales_order',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release(); // 释放连接
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

// 执行测试
testConnection();

module.exports = pool;