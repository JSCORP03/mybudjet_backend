const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// 예시 사용자 정보 (임시 DB 역할)
const users = [];
// 예시 예산 데이터 (임시 DB 역할)
const budgets = {}; // 연도별 예산을 저장할 객체
// 예시 지출 데이터 (임시 DB 역할)
const expenses = {}; // 일별 지출을 저장할 객체: { '2024': { '1': { '1': 10000, '2': 5000 }, ... } }

// 회원가입
app.post('/register', (req, res) => {
  const { id, password, name, email, phone, nickname } = req.body; 
  if (users.find(user => user.id === id)) {
    return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
  }
  users.push({ id, password, name, email, phone, nickname: nickname || '' });
  res.status(201).json({ message: '회원가입 완료' });
});

// 로그인
app.post('/login', (req, res) => {
  const { id, password } = req.body;
  const user = users.find(u => u.id === id && u.password === password);
  if (!user) {
    return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
  }
  res.json({ 
    message: '로그인 성공',
    token: 'dummy-token-for-' + user.id,  // 실제 인증 필요 시 JWT로 교체 가능, 사용자 ID 포함
    user: {
      name: user.name,
      nickname: user.nickname || ''
    }
  });
});

// 예산 추가 또는 업데이트
// POST 요청으로 특정 연도의 월별 예산 전체를 저장하거나 업데이트
app.post('/api/budgets', (req, res) => {
  // 인증 토큰 확인 (간단한 예시, 실제로는 JWT 미들웨어 사용)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const { year, budgets: newBudgets } = req.body;
  
  if (!year || !newBudgets) {
    return res.status(400).json({ message: '연도와 예산 데이터가 필요합니다.' });
  }

  budgets[year] = newBudgets; // 해당 연도의 예산 데이터를 통째로 업데이트
  res.status(200).json({ message: `${year}년 예산이 성공적으로 저장되었습니다.` });
});

// 특정 연도 예산 조회 (프론트엔드에서 요청하는 '/api/budgets/${year}'에 해당)
app.get('/api/budgets/:year', (req, res) => {
  // 인증 토큰 확인 (간단한 예시)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const year = req.params.year;
  const yearBudgets = budgets[year];

  if (!yearBudgets || Object.keys(yearBudgets).length === 0) {
    // 해당 연도의 예산이 없을 경우 200 OK와 빈 객체 반환
    return res.status(200).json({}); 
  }
  res.json(yearBudgets);
});

// 지출 추가 또는 업데이트
app.post('/api/expenses', (req, res) => {
  // 인증 토큰 확인 (간단한 예시)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const { date, amount } = req.body; // date: "YYYY-M-D" 형식, amount: 숫자
  if (!date || amount === undefined || amount === null) {
    return res.status(400).json({ message: '날짜와 지출 금액이 필요합니다.' });
  }

  const [year, month, day] = date.split('-').map(Number); // 날짜 파싱

  if (!expenses[year]) expenses[year] = {};
  if (!expenses[year][month]) expenses[year][month] = {};
  
  expenses[year][month][day] = amount; // 해당 날짜의 지출 금액 저장
  res.status(200).json({ message: `${date} 지출이 성공적으로 기록되었습니다.`, expense: amount });
});

// 특정 월의 지출 조회
app.get('/api/expenses/:year/:month', (req, res) => {
  // 인증 토큰 확인 (간단한 예시)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const year = Number(req.params.year);
  const month = Number(req.params.month);

  // 해당 연도와 월의 지출 데이터를 반환. 없으면 빈 객체 반환.
  const monthExpenses = (expenses[year] && expenses[year][month]) ? expenses[year][month] : {};
  res.json(monthExpenses);
});


// 예산 삭제 (이전 로직과 동일, 필요하다면 유지)
app.delete('/api/budgets/:id', (req, res) => {
  res.status(501).json({ message: '이 엔드포인트는 아직 구현되지 않았습니다 (또는 재설계 필요).' });
});

// 모든 정의되지 않은 경로에 대한 404 처리 (맨 마지막에 위치)
app.use((req, res) => {
  res.status(404).json({ message: '요청하신 리소스를 찾을 수 없습니다.' });
});


app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});