const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 예시 API
app.get('/api/budgets', (req, res) => {
  res.json([{ name: '식비', amount: 20000 }, { name: '교통', amount: 10000 }]);
});

// 정적 파일
const path = require('path');
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});