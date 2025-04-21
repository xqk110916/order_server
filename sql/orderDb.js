const pool = require('./db.js');

// 插入销售订单主表数据
async function insertSalesOrder(orderData) {
  const connection = await pool.getConnection();
  try {
    const orderInsertQuery = `
      INSERT INTO sales_order (order_number, client_name, maker, business, base_name, order_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const orderValues = [
      orderData.orderNumber,
      orderData.clientName,
      orderData.maker,
      orderData.business,
      orderData.base,
      orderData.date
    ];

    const [orderResult] = await connection.query(orderInsertQuery, orderValues);
    return orderResult.insertId;
  } finally {
    connection.release();
  }
}

// 插入销售订单明细表数据
async function insertSalesOrderItems(orderId, orderNumber, orderItems) {
  const connection = await pool.getConnection();
  try {
    const itemInsertQuery = `
      INSERT INTO sales_order_items (order_id, order_number, category_name, size, unit, quantity, price, amount, weight, box_name, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const item of orderItems) {
      const itemValues = [
        orderId,
        orderNumber,
        item.categoryName,
        item.size,
        item.unit,
        item.quantity,
        item.price,
        parseFloat(item.amount),
        item.weight,
        item.boxName,
        item.remark
      ];
      await connection.query(itemInsertQuery, itemValues);
    }
  } finally {
    connection.release();
  }
}

// 获取数据库中最大的 id
async function getMaxOrderId(table) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT MAX(id) as maxId FROM ' + table);
    return rows[0].maxId || 0;
  } finally {
    connection.release();
  }
}

module.exports = {
  insertSalesOrder,
  insertSalesOrderItems,
  getMaxOrderId
};