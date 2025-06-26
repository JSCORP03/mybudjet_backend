const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// 예시 사용자 정보 (임시 DB 역할)
const users = [];
const budgets = [];

// 회원가입
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(user => user.username === username)) {
    return res.status(409).json({ error: '이미 존재하는 사용자입니다.' });
  }
  users.push({ username, password });
  res.json({ message: '회원가입 완료' });
});

// 로그인
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: '로그인 실패' });
  }
  res.json({ message: '로그인 성공' });
});

// 예산 목록 조회
app.get('/api/budgets', (req, res) => {
  res.json(budgets);
});

// 예산 추가
app.post('/api/budgets', (req, res) => {
  const budget = req.body;
  budgets.push(budget);
  res.json({ message: '예산 추가 완료' });
});

// 예산 삭제
app.delete('/api/budgets/:id', (req, res) => {
  const id = req.params.id;
  const index = budgets.findIndex(b => b.id == id);
  if (index !== -1) {
    budgets.splice(index, 1);
    res.json({ message: '삭제 완료' });
  } else {
    res.status(404).json({ error: '예산 항목 없음' });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});
