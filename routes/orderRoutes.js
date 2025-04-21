const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); 
const createImage = require('../components/createImage.js');
const { insertSalesOrder, insertSalesOrderItems, getMaxOrderId } = require('../sql/orderDb.js');

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

module.exports = router;