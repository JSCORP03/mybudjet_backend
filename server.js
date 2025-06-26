// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 서빙 (필요시)
app.use(express.static('public'));

// 간단한 API 예시
app.get('/api/hello', (req, res) => {
  res.json({ message: '안녕 재상!' });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});
