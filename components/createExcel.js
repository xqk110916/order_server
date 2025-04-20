const express = require("express");
const ExcelJS = require("exceljs");
const cors = require("cors"); // 处理跨域
const app = express();

app.use(cors());
app.use(express.json());

// 定义边框样式
const borderStyle = {
  style: 'thin',
  color: { argb: 'FF000000' }
};

// 生成Excel的路由
app.post("/generate-excel", async (req, res) => {
  console.log("Received request:", req.body);
  try {
    const requiredFields = [
      "clientName",
      "date",
      "base",
      "product",
      "spec",
      "quantity",
      "unitPrice",
      "kg",
      "count",
      "package",
      "remarks",
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).send(`缺少必要字段: ${field}`);
      }
    }

    const {
      clientName,
      date,
      base,
      product,
      spec,
      quantity,
      unitPrice,
      kg,
      count,
      package: packageType,
      remarks,
    } = req.body;

    // 创建Excel工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("销售出库单");
    console.log("Excel workbook and worksheet created successfully");

    // 设置标题行（合并单元格A1:J1）
    worksheet.mergeCells("A1:J1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "河南同发农产品有限公司销售出库单";
    titleCell.font = { name: "Arial", size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };
    // 给标题行添加边框
    titleCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };

    // 客户名称和日期（第二行）
    const clientNameCell = worksheet.getCell("A2");
    clientNameCell.value = "客户名称：";
    clientNameCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: { style: 'none' }
    };
    const clientValueCell = worksheet.getCell("B2");
    clientValueCell.value = clientName;
    clientValueCell.border = {
      top: borderStyle,
      left: { style: 'none' },
      bottom: borderStyle,
      right: { style: 'none' }
    };
    const dateLabelCell = worksheet.getCell("I2");
    dateLabelCell.value = "日期：";
    dateLabelCell.border = {
      top: borderStyle,
      left: { style: 'none' },
      bottom: borderStyle,
      right: { style: 'none' }
    };
    const dateValueCell = worksheet.getCell("J2");
    dateValueCell.value = date;
    dateValueCell.border = {
      top: borderStyle,
      left: { style: 'none' },
      bottom: borderStyle,
      right: borderStyle
    };

    // 表头（第四行）
    const headers = [
      "发货基地",
      "名称",
      "规格",
      "出库数量",
      "单价",
      "金额",
      "公斤/kg",
      "枚数",
      "包装箱",
      "备注",
    ];
    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
      const cell = worksheet.getCell(`${colLetter}3`);
      cell.value = header;
      cell.border = {
        top: borderStyle,
        left: borderStyle, // 给所有表头单元格添加左边框
        bottom: borderStyle,
        right: index === headers.length - 1 ? borderStyle : borderStyle // 最后一列添加右边框，其他列也添加右边框
      };
    });
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "DDDDDD" },
    };

    // 数据行（从第五行开始）
    const rowIndex = 4;
    worksheet.getRow(rowIndex).height = 25;

    worksheet.getCell(`A${rowIndex}`).value = base;
    worksheet.getCell(`B${rowIndex}`).value = product;
    worksheet.getCell(`C${rowIndex}`).value = spec;
    worksheet.getCell(`D${rowIndex}`).value = Number(quantity);
    worksheet.getCell(`E${rowIndex}`).value = Number(unitPrice);
    worksheet.getCell(`F${rowIndex}`).value =
      Number(quantity) * Number(unitPrice);
    worksheet.getCell(`G${rowIndex}`).value = kg;
    worksheet.getCell(`H${rowIndex}`).value = count;
    worksheet.getCell(`I${rowIndex}`).value = packageType;
    worksheet.getCell(`J${rowIndex}`).value = remarks;

    // 给数据行添加边框
    for (let col = 0; col < 10; col++) {
      const colLetter = String.fromCharCode(65 + col);
      const cell = worksheet.getCell(`${colLetter}${rowIndex}`);
      cell.border = {
        top: borderStyle,
        left: col === 0 ? borderStyle : borderStyle,
        bottom: borderStyle,
        right: col === 9 ? borderStyle : borderStyle
      };
    }

    // 插入两行空白行
    const blankRowStart = rowIndex + 1;
    const blankRowEnd = blankRowStart + 1;
    for (let row = blankRowStart; row <= blankRowEnd; row++) {
      for (let col = 0; col < 10; col++) {
        const colLetter = String.fromCharCode(65 + col);
        const cell = worksheet.getCell(`${colLetter}${row}`);
        // 给空白行添加边框
        cell.border = {
          top: borderStyle,
          left: col === 0 ? borderStyle : borderStyle,
          bottom: borderStyle,
          right: col === 9 ? borderStyle : borderStyle
        };
      }
    }

    // 合计行（插入空白行后重新计算位置）
    const totalRow = blankRowEnd + 1;
    // 处理合并单元格 A 到 C 列
    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    const totalLabelCell = worksheet.getCell(`A${totalRow}`);
    totalLabelCell.value = "合计";
    totalLabelCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };

    // 处理 D 列，设置下边框
    const dCell = worksheet.getCell(`D${totalRow}`);
    dCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };

    // 处理 E 列
    const paidLabelCell = worksheet.getCell(`E${totalRow}`);
    paidLabelCell.value = "实收货款";
    paidLabelCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };

    // 处理 F 列
    const paidValueCell = worksheet.getCell(`F${totalRow}`);
    paidValueCell.value = quantity * unitPrice;
    paidValueCell.border = {
      top: borderStyle,
      left: borderStyle,
      bottom: borderStyle,
      right: borderStyle
    };

    // 填充剩余未处理单元格的边框，确保整行完整
    const remainingCols = ['G', 'H', 'I', 'J'];
    remainingCols.forEach((col) => {
      const cell = worksheet.getCell(`${col}${totalRow}`);
      cell.border = {
        top: borderStyle,
        left: borderStyle,
        bottom: borderStyle,
        right: col === 'J' ? borderStyle : borderStyle
      };
    });

    // 格式化列宽
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // 生成文件流
    const buffer = await workbook.xlsx.writeBuffer();
    console.log("Excel buffer generated successfully");

    const encodedFileName = encodeURIComponent("测试222.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodedFileName}"`
    );
    res.send(buffer);
    console.log("Response sent successfully", buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("生成Excel失败，请检查输入内容。");
  }
});

// 启动服务
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
