const express = require("express");
const cors = require("cors"); 
const app = express();

app.use(cors());
app.use(express.json());

// 引入订单路由模块
const orderRoutes = require('./routes/orderRoutes');

// 使用订单路由模块
app.use('/order', orderRoutes);

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
