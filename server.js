const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // 정적 파일 서빙

// 실제 JSON 응답 라우터 추가
app.get('/api/budgets', (req, res) => {
  res.json([
    { name: '식비', amount: 20000 },
    { name: '교통', amount: 10000 }
  ]);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});