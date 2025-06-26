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
// 실제 환경에서는 데이터베이스 사용 필수
const budgets = {}; // 연도별 예산을 저장할 객체로 변경

// 회원가입
app.post('/register', (req, res) => {
  const { id, password, name, email, phone, nickname } = req.body; // 프론트엔드 register 요청의 body와 일치시킴
  if (users.find(user => user.id === id)) { // username 대신 id로 변경
    return res.status(409).json({ message: '이미 존재하는 아이디입니다.' }); // error 대신 message로 변경
  }
  users.push({ id, password, name, email, phone, nickname: nickname || '' });
  res.status(201).json({ message: '회원가입 완료' }); // 201 Created 상태 코드 사용
});

// 로그인
app.post('/login', (req, res) => {
  const { id, password } = req.body; // username 대신 id로 변경
  const user = users.find(u => u.id === id && u.password === password);
  if (!user) {
    return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' }); // 메시지 구체화
  }
  res.json({ 
    message: '로그인 성공',
    token: 'dummy-token-for-' + user.id,  // 실제 인증 필요 시 JWT로 교체 가능, 사용자 ID 포함
    user: {
      name: user.name, // name 필드 추가
      nickname: user.nickname || ''
    }
  });
});

// 예산 추가 또는 업데이트
// POST 요청으로 특정 연도의 월별 예산 전체를 저장하거나 업데이트
app.post('/api/budgets', (req, res) => {
  const { year, budgets: newBudgets } = req.body; // { year: 2024, budgets: { 1: 100000, 2: 200000, ... } }
  
  if (!year || !newBudgets) {
    return res.status(400).json({ message: '연도와 예산 데이터가 필요합니다.' });
  }

  budgets[year] = newBudgets; // 해당 연도의 예산 데이터를 통째로 업데이트
  res.status(200).json({ message: `${year}년 예산이 성공적으로 저장되었습니다.` }); // 200 OK 상태 코드
});

// 특정 연도 예산 조회 (프론트엔드에서 요청하는 '/api/budgets/${year}'에 해당)
app.get('/api/budgets/:year', (req, res) => {
  const year = req.params.year;
  const yearBudgets = budgets[year];

  if (!yearBudgets || Object.keys(yearBudgets).length === 0) {
    // 해당 연도의 예산이 없을 경우 404 및 JSON 메시지 반환
    return res.status(404).json({ message: `${year}년의 예산 데이터를 찾을 수 없습니다.` });
  }
  res.json(yearBudgets);
});

// 예산 삭제 (이전 로직과 동일, 필요하다면 유지)
app.delete('/api/budgets/:id', (req, res) => {
  const id = req.params.id; // 이 ID는 어떤 것을 의미하는지 프론트엔드와 맞춰야 함
  // 현재 budgets 객체 구조상 단일 ID로 예산을 삭제하기 어려움 (월별/연도별로 저장되므로)
  // 이 엔드포인트는 연도별/월별 예산 삭제 로직에 맞게 수정 필요
  res.status(501).json({ message: '이 엔드포인트는 아직 구현되지 않았습니다 (또는 재설계 필요).' });
});

// 모든 정의되지 않은 경로에 대한 404 처리 (맨 마지막에 위치)
app.use((req, res) => {
  res.status(404).json({ message: '요청하신 리소스를 찾을 수 없습니다.' });
});


app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});