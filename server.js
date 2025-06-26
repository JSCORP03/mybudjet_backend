const express = require('express');
const path = require('path');
const app = express();

// 루트 경로 접속 시 index.html 직접 응답
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});
