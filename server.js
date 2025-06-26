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
    token: 'dummy-token-for-' + user.id,  
    user: {
      name: user.name,
      nickname: user.nickname || ''
    }
  });
});

// 예산 추가 또는 업데이트
app.post('/api/budgets', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const { year, budgets: newBudgets } = req.body;
  
  if (!year || !newBudgets) {
    return res.status(400).json({ message: '연도와 예산 데이터가 필요합니다.' });
  }

  budgets[year] = newBudgets; 
  res.status(200).json({ message: `${year}년 예산이 성공적으로 저장되었습니다.` });
});

// 특정 연도 예산 조회
app.get('/api/budgets/:year', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const year = req.params.year;
  const yearBudgets = budgets[year];

  if (!yearBudgets || Object.keys(yearBudgets).length === 0) {
    return res.status(200).json({}); 
  }
  res.json(yearBudgets);
});

// 지출 추가 또는 업데이트
app.post('/api/expenses', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const { date, amount } = req.body; 
  if (!date || amount === undefined || amount === null) {
    return res.status(400).json({ message: '날짜와 지출 금액이 필요합니다.' });
  }

  const [year, month, day] = date.split('-').map(Number); 

  if (!expenses[year]) expenses[year] = {};
  if (!expenses[year][month]) expenses[year][month] = {};
  
  expenses[year][month][day] = amount; 
  res.status(200).json({ message: `${date} 지출이 성공적으로 기록되었습니다.`, expense: amount });
});

// 특정 월의 지출 조회
app.get('/api/expenses/:year/:month', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const year = Number(req.params.year);
  const month = Number(req.params.month);

  const monthExpenses = (expenses[year] && expenses[year][month]) ? expenses[year][month] : {};
  res.json(monthExpenses);
});

// ▼▼▼ [추가된 부분] 예산 초기화 엔드포인트 ▼▼▼

// 특정 연도/월 예산 초기화 또는 연도 전체 초기화
app.delete('/api/budgets/:year/:month?', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }

  const year = Number(req.params.year);
  const month = req.params.month ? Number(req.params.month) : 0; // 월이 없으면 0으로 처리 (전체 월 초기화)

  if (month === 0) { // 특정 연도 전체 예산 초기화
    if (budgets[year]) {
      delete budgets[year];
      // 해당 연도 지출도 함께 초기화 (필요시)
      if (expenses[year]) {
        delete expenses[year];
      }
      return res.status(200).json({ message: `${year}년의 모든 예산 및 지출이 초기화되었습니다.` });
    } else {
      return res.status(404).json({ message: `${year}년의 예산을 찾을 수 없습니다.` });
    }
  } else { // 특정 월 예산 초기화
    if (budgets[year] && budgets[year][month]) {
      budgets[year][month] = 0; // 해당 월의 예산을 0으로 설정
      // 해당 월의 지출도 함께 초기화 (필요시)
      if (expenses[year] && expenses[year][month]) {
        delete expenses[year][month]; // 해당 월의 모든 지출 삭제
      }
      return res.status(200).json({ message: `${year}년 ${month}월 예산 및 지출이 초기화되었습니다.` });
    } else if (budgets[year] && !budgets[year][month]) {
      return res.status(200).json({ message: `${year}년 ${month}월 예산은 이미 설정되지 않았습니다.` }); // 이미 없으면 성공
    } else {
      return res.status(404).json({ message: `${year}년의 예산을 찾을 수 없습니다.` });
    }
  }
});

// 모든 예산 및 지출 데이터 전체 초기화
app.delete('/api/budgets/all', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer dummy-token-for-')) { 
    return res.status(401).json({ message: '인증되지 않았습니다.' });
  }
  
  // 모든 데이터 초기화
  for (const key in budgets) {
    delete budgets[key];
  }
  for (const key in expenses) {
    delete expenses[key];
  }

  res.status(200).json({ message: '모든 예산 및 지출 데이터가 성공적으로 초기화되었습니다.' });
});
// ▲▲▲ [추가된 부분] 예산 초기화 엔드포인트 ▲▲▲


// 모든 정의되지 않은 경로에 대한 404 처리 (맨 마지막에 위치)
app.use((req, res) => {
  res.status(404).json({ message: '요청하신 리소스를 찾을 수 없습니다.' });
});


app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});