const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); 
const createImage = require('../components/createImage.js');
const pool = require('../sql/db.js');

// 定义保存订单信息的接口
router.post('/submit', async (req, res) => {
  const formData = req.body;
  // 生成 UUID 作为订单编号
  const orderNumber = uuidv4();
  formData.orderNumber = orderNumber;

  try {
    const base64Data = await createImage(formData);
    // 返回成功响应，包含订单编号
    res.status(200).json({
      code: 200,
      message: '表单数据保存成功',
      data: base64Data,
    });
  } catch (error) {
    console.error('生成图片失败:', error);
    res.status(500).json({
      code: 500,
      message: '生成图片失败，请稍后重试',
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

module.exports = router;