const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// 定义生成图片的函数
async function generateOrderImage(formData) {
  // 计算输出目录的绝对路径
  const outputDir = path.join(__dirname, "../public/images");
  // 计算输出文件的绝对路径
  const outputPath = path.join(outputDir, "order.png");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 根据新的列宽调整画布宽度
  const columnWidths = [150, 150, 100, 100, 100, 100, 100, 100, 100, 120];
  const canvasWidth = 10 + columnWidths.reduce((acc, width) => acc + width, 0) + 10;
  let canvasHeight = 600; // 初始高度，后续可能调整

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // 设置画布背景色为白色
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 转换 undefined 或 null 为 0 或空字符串
  const convertValue = (value) => {
    if (value === undefined || value === null) {
      return typeof value === "number" ? 0 : "";
    }
    return value;
  };

  // 绘制标题并居中，设置标题字体更粗
  ctx.font = "900 20px Arial";
  ctx.fillStyle = "#000";
  const title = "销售出库单";
  const titleWidth = ctx.measureText(title).width;
  const titleX = (canvasWidth - titleWidth) / 2;
  ctx.fillText(title, titleX, 30);

  // 统一设置字体
  ctx.font = "16px Arial";

  // 从 formData 中获取订单编号并绘制在标题下方，距离左侧 20 边距
  const orderNumber = convertValue(formData.orderNumber);
  const orderNumberText = `编号: ${orderNumber}`;
  // 修改 x 坐标为 20，添加 20 像素的左侧边距
  ctx.fillText(orderNumberText, 30, 55);

  // 绘制客户名称和日期，添加前缀，在新的一行
  const clientName = convertValue(formData.clientName);
  const formattedClientName = `客户名称: ${clientName}`;
  const date = convertValue(formData.date);
  const formattedDate = `日期: ${date}`;
  const dateWidth = ctx.measureText(formattedDate).width;
  ctx.fillText(formattedClientName, 10 + 20, 80);
  ctx.fillText(formattedDate, canvasWidth - dateWidth - 10 - 20, 80);

  let yOffset = 110; // 初始 Y 偏移量调整，给新布局留出空间
  const cellHeight = 40;
  // 表头
  const headers = [
    "发货基地",
    "品类名称",
    "单位",
    "规格",
    "出库数量",
    "单价",
    "金额",
    "重量",
    "包装箱",
    "备注",
  ];

  // 设置表格内容字体为 16px
  ctx.font = "16px Arial";

  // 绘制边框
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  // 绘制列边框
  let xOffset = 10;
  headers.forEach((_, index) => {
    ctx.moveTo(xOffset, yOffset);
    ctx.lineTo(
      xOffset,
      yOffset + cellHeight * (formData.orderItems.length + 3)
    );
    xOffset += columnWidths[index];
  });
  // 绘制最后一列的右边框
  ctx.moveTo(xOffset, yOffset);
  ctx.lineTo(xOffset, yOffset + cellHeight * (formData.orderItems.length + 3));

  // 绘制行边框
  for (let i = 0; i <= formData.orderItems.length + 3; i++) {
    const y = yOffset + i * cellHeight;
    ctx.moveTo(10, y);
    ctx.lineTo(10 + columnWidths.reduce((acc, width) => acc + width, 0), y);
  }
  ctx.stroke();

  // 绘制表头文字，让文字在框内垂直居中
  xOffset = 10;
  headers.forEach((header, index) => {
    ctx.fillText(header, xOffset + 5, yOffset + cellHeight / 2 + 5);
    xOffset += columnWidths[index];
  });
  yOffset += cellHeight;

  // 绘制订单内容，让文字在框内垂直居中
  formData.orderItems.forEach((item) => {
    const text = [
      convertValue(formData.base),
      convertValue(item.categoryName),
      convertValue(item.unit),
      convertValue(item.size),
      convertValue(item.quantity),
      convertValue(item.price),
      convertValue(item.amount),
      convertValue(item.weight),
      convertValue(item.boxName),
      convertValue(item.remark),
    ];
    xOffset = 10;
    text.forEach((textItem, idx) => {
      ctx.fillText(textItem, xOffset + 5, yOffset + cellHeight / 2 + 5);
      xOffset += columnWidths[idx];
    });
    yOffset += cellHeight;
  });

  // 添加空白行
  yOffset += cellHeight;

  // 计算合计数
  let totalQuantity = 0;
  let totalAmount = 0;
  let totalWeight = 0;
  formData.orderItems.forEach((item) => {
    totalQuantity += Number(convertValue(item.quantity)) || 0;
    totalAmount += Number(convertValue(item.amount)) || 0;
    totalWeight += Number(convertValue(item.weight)) || 0;
  });

  // 绘制合计行
  xOffset = 10;
  const totalText = [
    "合计", // 在第一列显示 "合计" 两字
    "", "", "",
    totalQuantity.toString(),
    "",
    totalAmount.toString(),
    totalWeight.toString(),
    "", ""
  ];
  totalText.forEach((textItem, idx) => {
    ctx.fillText(textItem, xOffset + 5, yOffset + cellHeight / 2 + 5);
    xOffset += columnWidths[idx];
  });

  // 添加额外 20px 边距
  yOffset += cellHeight + 20; 

  // 计算制单人和业务信息的位置
  yOffset += 20; // 新增 20px 边距
  const makerText = `制单人: ${convertValue(formData.maker)}`;
  const businessText = `业务: ${convertValue(formData.business)}`;

  ctx.font = "16px Arial";
  ctx.fillText(makerText, 20, yOffset);

  const businessWidth = ctx.measureText(businessText).width;
  ctx.fillText(businessText, canvasWidth - businessWidth - 20, yOffset);

  // 调整画布高度以确保内容全部显示
  canvasHeight = yOffset + 20;
  const newCanvas = createCanvas(canvasWidth, canvasHeight);
  const newCtx = newCanvas.getContext("2d");
  newCtx.fillStyle = "white";
  newCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  newCtx.drawImage(canvas, 0, 0);

  try {
    // 将画布内容转换为 Base64 字符串
    const base64Data = newCanvas.toDataURL("image/png").split(";base64,").pop();
    return base64Data;
  } catch (error) {
    throw new Error(`图片转换为 Base64 失败: ${error.message}`);
  }
}

// 导出函数
module.exports = generateOrderImage;
