const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); 
const createImage = require('../components/createImage.js');
const { insertSalesOrder, insertSalesOrderItems, getMaxOrderId } = require('../sql/orderDb.js');
const pool = require('../sql/db.js');

// 定义保存订单信息的接口
router.post('/submit', async (req, res) => {
  const formData = req.body;
  // 年月日 + 取数据库中最大的 id + 1  生成新的 orderNumber
  const orderNumber = await getOrderNumber("sales_order");
  formData.orderNumber = orderNumber;
  
  try {
    // 插入销售订单主表数据
    const orderId = await insertSalesOrder(formData);
    // 插入销售订单明细表数据
    await insertSalesOrderItems(orderId, orderNumber, formData.orderItems);

    const base64Data = await createImage(formData);
    // 返回成功响应，包含订单编号
    res.status(200).json({
      code: 200,
      message: '表单数据保存成功',
      data: base64Data,
    });
  } catch (error) {
    console.error('保存订单数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '保存订单数据失败，请稍后重试',
    });
  }
});

// 测试接口
router.get('/test', (req, res) => {
  // 返回成功响应
  res.status(200).json({
    code: 200,
    message: '表单数据保存成功',
  });
});

// table: 表名
async function getOrderNumber(table) {
  // 获取最大的 id
  const maxId = await getMaxOrderId(table);
  // 生成新的 id
  const newId = maxId + 1;
  // 生成当前日期的年月日格式
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  // 生成补全为 5 位的新 id
  const idPart = String(newId).padStart(5, '0');
  // 生成新的 orderNumber
  const orderNumber = `${datePart}-${idPart}`;
  return orderNumber
}

// 只返回 sales_order 中的数据的列表接口，支持分页
router.get('/list', async (req, res) => {
  const currentPage = parseInt(req.query.currentPage) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (currentPage - 1) * pageSize;
  console.log(currentPage, pageSize, offset);
  
  try {
    // 查询当前页的数据
    const [rows] = await pool.execute('SELECT * FROM sales_order LIMIT ? OFFSET ?', [pageSize, offset]);
    // 查询总记录数
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM sales_order');
    const total = countResult[0].total;

    res.status(200).json({
      code: 200,
      message: '获取订单列表成功',
      data: rows,
      pagination: {
        currentPage,
        pageSize,
        total
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取订单列表失败，请稍后重试'
    });
  }
});

// 返回合并 sales_order_items 数据的订单列表接口，支持分页
router.get('/detailsList', async (req, res) => {
  const currentPage = parseInt(req.query.currentPage) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (currentPage - 1) * pageSize;

  try {
    // 查询当前页的订单数据
    const [orders] = await pool.execute('SELECT * FROM sales_order LIMIT ? OFFSET ?', [pageSize, offset]);
    // 查询总记录数
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM sales_order');
    const total = countResult[0].total;

    const orderIds = orders.map(order => order.id);
    // 手动拼接 IN 子句的参数
    const placeholders = orderIds.map(() => '?').join(',');
    const [items] = await pool.execute(`SELECT * FROM sales_order_items WHERE order_id IN (${placeholders})`, orderIds);

    const result = orders.map(order => {
      const orderItems = items.filter(item => item.order_id === order.id);
      return {
        ...order,
        orderItems
      };
    });

    res.status(200).json({
      code: 200,
      message: '获取包含明细的订单列表成功',
      data: result,
      currentPage,
      pageSize,
      total
    });
  } catch (error) {
    console.error('获取包含明细的订单列表失败:', error);
    console.error('错误类型:', error.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '获取包含明细的订单列表失败，请稍后重试'
    });
  }
});

// 获取订单详情接口，附带 sales_order_items 中的信息
router.get('/getDetailsById/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    const [orders] = await pool.execute('SELECT * FROM sales_order WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '未找到该订单'
      });
    }
    const [items] = await pool.execute('SELECT * FROM sales_order_items WHERE order_id = ?', [orderId]);
    const order = {
      ...orders[0],
      orderItems: items
    };

    res.status(200).json({
      code: 200,
      message: '获取订单详情成功',
      data: order
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取订单详情失败，请稍后重试'
    });
  }
});

module.exports = router;