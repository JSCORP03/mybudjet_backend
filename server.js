// .env 파일 로드 (가장 중요! .env 파일이 백엔드 프로젝트 루트에 있어야 함)
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // Mongoose 추가

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// ▼▼▼ MongoDB Atlas 데이터베이스 연결 ▼▼▼
// MONGODB_URI는 .env 파일에서 로드됨
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공!'))
  .catch(err => console.error('MongoDB 연결 실패:', err));

// ▼▼▼ Mongoose 스키마 및 모델 정의 ▼▼▼

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 사용자 ID, 필수, 중복 불가
  password: { type: String, required: true }, // 비밀번호, 필수
  name: { type: String, required: true }, // 이름, 필수
  email: { type: String, required: true }, // 이메일, 필수
  phone: { type: String, required: true }, // 전화번호, 필수
  nickname: { type: String, default: '' }, // 별명, 선택사항 (기본값 빈 문자열)
});
const User = mongoose.model('User', userSchema); // User 모델 생성

// 예산 스키마 정의
const budgetSchema = new mongoose.Schema({
  userId: { // 어떤 유저의 예산인지 연결 (User 모델의 ObjectId 참조)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  year: { type: Number, required: true }, // 예산이 적용되는 연도, 필수
  monthlyBudgets: { // 월별 예산을 저장하는 Map (key: 월(문자열), value: 금액(숫자))
    type: Map, 
    of: Number, 
    default: {} // 기본값 빈 객체
  },
});
// userId와 year를 복합 인덱스로 설정하여 특정 유저의 특정 연도 예산은 하나만 존재하도록 보장
budgetSchema.index({ userId: 1, year: 1 }, { unique: true }); 
const Budget = mongoose.model('Budget', budgetSchema); // Budget 모델 생성


// 지출 스키마 정의
const expenseSchema = new mongoose.Schema({
  userId: { // 어떤 유저의 지출인지 연결 (User 모델의 ObjectId 참조)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: String, required: true }, // 지출이 발생한 날짜 ("YYYY-M-D" 형식), 필수
  amount: { type: Number, required: true }, // 지출 금액, 필수
});
// userId와 date를 복합 인덱스로 설정하여 특정 유저의 특정 날짜 지출은 하나만 존재하도록 보장
expenseSchema.index({ userId: 1, date: 1 }, { unique: true });
const Expense = mongoose.model('Expense', expenseSchema); // Expense 모델 생성

// 더미 인증 미들웨어 (실제 JWT로 교체될 부분)
// 요청 헤더에서 토큰을 추출하고, 더미 토큰이라면 userId를 req.userId에 할당
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer [token]" 형식에서 토큰만 추출
    if (token == null) return res.status(401).json({ message: '인증 토큰이 필요합니다.' });

    // 여기서는 더미 토큰 검증 로직을 사용 (실제 JWT에서는 jwt.verify 함수 사용)
    // 토큰이 'dummy-token-for-유저_ObjectID' 형식이라고 가정
    if (!token.startsWith('Bearer dummy-token-for-')) { // 'Bearer ' 접두사도 확인
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    // 'Bearer dummy-token-for-' 부분 이후의 문자열이 실제 userId라고 가정
    req.userId = token.substring('Bearer dummy-token-for-'.length); // userId 추출
    next(); // 다음 미들웨어 또는 라우트 핸들러로 이동
};

// ▼▼▼ 회원가입 라우트 ▼▼▼
app.post('/register', async (req, res) => {
  const { id, password, name, email, phone, nickname } = req.body;
  try {
    // 이미 존재하는 아이디인지 DB에서 확인
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
    }
    // 새 사용자 생성 및 DB에 저장
    const newUser = new User({ id, password, name, email, phone, nickname: nickname || '' });
    await newUser.save();
    res.status(201).json({ message: '회원가입 완료' }); // 201 Created 응답
  } catch (error) {
    console.error('회원가입 실패:', error);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 로그인 라우트 ▼▼▼
app.post('/login', async (req, res) => {
  const { id, password } = req.body;
  try {
    // DB에서 사용자 ID와 비밀번호 일치 여부 확인 (비밀번호 암호화 시 여기 수정 필요)
    const user = await User.findOne({ id, password }); 
    if (!user) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
    // 로그인 성공 시 더미 토큰과 사용자 정보 반환
    res.json({ 
      message: '로그인 성공',
      token: 'Bearer dummy-token-for-' + user._id, // 실제 사용자 ObjectId를 토큰에 포함 (프론트엔드 Bearer 접두사 맞춤)
      user: {
        name: user.name,
        nickname: user.nickname || ''
      }
    });
  } catch (error) {
    console.error('로그인 실패:', error);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 예산 추가 또는 업데이트 라우트 ▼▼▼
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능
app.post('/api/budgets', authenticateToken, async (req, res) => {
  const { year, budgets: newBudgets } = req.body;
  const userId = req.userId; // authenticateToken 미들웨어에서 추출한 userId

  if (!year || !newBudgets) {
    return res.status(400).json({ message: '연도와 예산 데이터가 필요합니다.' });
  }

  try {
    // findOneAndUpdate: userId와 year가 일치하는 문서를 찾거나, 없으면 새로 생성 (upsert: true)
    await Budget.findOneAndUpdate(
      { userId, year },
      { $set: { monthlyBudgets: newBudgets } }, // monthlyBudgets 필드를 새 데이터로 교체
      { upsert: true, new: true } // 없으면 새로 만들고, 업데이트된 문서를 반환
    );
    res.status(200).json({ message: `${year}년 예산이 성공적으로 저장되었습니다.` });
  } catch (error) {
    console.error('예산 저장 실패:', error);
    res.status(500).json({ message: '예산 저장 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 특정 연도 예산 조회 라우트 ▼▼▼
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능
app.get('/api/budgets/:year', authenticateToken, async (res, req) => { // 매개변수 순서 수정: req, res
  const year = Number(req.params.year);
  const userId = req.userId;

  try {
    const budgetDoc = await Budget.findOne({ userId, year });
    if (!budgetDoc) {
      return res.status(200).json({}); // 해당 연도 예산이 없으면 빈 객체 반환 (프론트엔드 오류 방지)
    }
    // Mongoose Map 객체를 일반 JavaScript 객체로 변환하여 전송 (클라이언트는 Map을 직접 처리 못함)
    res.json(budgetDoc.monthlyBudgets); 
  } catch (error) {
    console.error('예산 조회 실패:', error);
    res.status(500).json({ message: '예산 조회 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 지출 추가 또는 업데이트 라우트 ▼▼▼
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능
app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { date, amount } = req.body; // date: "YYYY-M-D" 형식, amount: 숫자
  const userId = req.userId;

  if (!date || amount === undefined || amount === null) {
    return res.status(400).json({ message: '날짜와 지출 금액이 필요합니다.' });
  }

  try {
    // findOneAndUpdate: userId와 date가 일치하는 문서를 찾거나, 없으면 새로 생성 (upsert: true)
    const updatedExpense = await Expense.findOneAndUpdate(
      { userId, date },
      { $set: { amount } }, // amount 필드를 업데이트
      { upsert: true, new: true } // 없으면 새로 만들고, 업데이트된 문서를 반환
    );
    res.status(200).json({ message: `${date} 지출이 성공적으로 기록되었습니다.`, expense: updatedExpense.amount });
  } catch (error) {
    console.error('지출 기록 실패:', error);
    res.status(500).json({ message: '지출 기록 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 특정 월의 지출 조회 라우트 ▼▼▼
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능
app.get('/api/expenses/:year/:month', authenticateToken, async (req, res) => {
  const year = Number(req.params.year);
  const month = Number(req.params.month);
  const userId = req.userId;

  // 정규식을 사용하여 해당 연도-월로 시작하는 모든 date 필드 검색
  const regex = new RegExp(`^${year}-${month}-`);

  try {
    const monthExpensesDocs = await Expense.find({ 
      userId, 
      date: { $regex: regex } // 정규식으로 해당 월의 모든 지출 검색
    });

    const monthExpenses = {};
    // 검색된 문서들을 순회하며 { '일': 금액 } 형태로 변환
    monthExpensesDocs.forEach(doc => {
      const day = Number(doc.date.split('-')[2]); // 날짜 문자열에서 '일' 부분 추출
      monthExpenses[day] = doc.amount;
    });

    res.json(monthExpenses);
  } catch (error) {
    console.error('지출 조회 실패:', error);
    res.status(500).json({ message: '지출 조회 중 오류가 발생했습니다.' });
  }
});

// ▼▼▼ 예산 초기화 엔드포인트 (DB 연동 버전) ▼▼▼
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능

// 특정 연도/월 예산 초기화 또는 연도 전체 예산 및 지출 초기화
app.delete('/api/budgets/:year/:month?', authenticateToken, async (req, res) => {
  const year = Number(req.params.year);
  // req.params.month가 제공되면 숫자로 변환하고, 없으면 0으로 처리 (0은 '전체 월'을 의미)
  const month = req.params.month ? Number(req.params.month) : 0; 
  const userId = req.userId;

  try {
    if (month === 0) { // '지정 초기화' 버튼에서 월을 선택하지 않은 경우 (연도 전체 초기화)
      // 해당 유저의 특정 연도 예산 문서 삭제
      await Budget.deleteOne({ userId, year });
      // 해당 유저의 특정 연도에 해당하는 모든 지출 문서 삭제 (예: 2024-1-1 ~ 2024-12-31)
      await Expense.deleteMany({ userId, date: new RegExp(`^${year}-`) }); 
      return res.status(200).json({ message: `${year}년의 모든 예산 및 지출이 초기화되었습니다.` });
    } else { // '지정 초기화' 버튼에서 특정 월을 선택한 경우
      // 해당 유저의 특정 연도 예산 문서를 찾아서
      const budgetDoc = await Budget.findOne({ userId, year });
      if (budgetDoc) {
        // 해당 월의 예산 금액을 0으로 설정하고 문서 저장
        budgetDoc.monthlyBudgets.set(String(month), 0); 
        await budgetDoc.save(); 
      }
      // 해당 유저의 특정 월에 해당하는 모든 지출 문서 삭제 (예: 2024-6-1 ~ 2024-6-30)
      await Expense.deleteMany({ userId, date: new RegExp(`^${year}-${month}-`) }); 
      
      return res.status(200).json({ message: `${year}년 ${month}월 예산 및 지출이 초기화되었습니다.` });
    }
  } catch (error) {
    console.error('예산/지출 초기화 실패:', error);
    res.status(500).json({ message: '예산/지출 초기화 중 오류가 발생했습니다.' });
  }
});

// 모든 예산 및 지출 데이터 전체 초기화 라우트 (현재 로그인된 유저의 모든 데이터)
// authenticateToken 미들웨어를 사용하여 인증된 사용자만 접근 가능
app.delete('/api/budgets/all', authenticateToken, async (req, res) => {
  const userId = req.userId; // authenticateToken 미들웨어에서 추출한 userId

  try {
    // 해당 유저의 모든 예산 문서 삭제
    await Budget.deleteMany({ userId }); 
    // 해당 유저의 모든 지출 문서 삭제
    await Expense.deleteMany({ userId }); 
    res.status(200).json({ message: '모든 예산 및 지출 데이터가 성공적으로 초기화되었습니다.' });
  } catch (error) {
    console.error('전체 예산/지출 초기화 실패:', error);
    res.status(500).json({ message: '전체 예산/지출 초기화 중 오류가 발생했습니다.' });
  }
});


// 모든 정의되지 않은 경로에 대한 404 처리 (맨 마지막에 위치)
app.use((req, res) => {
  res.status(404).json({ message: '요청하신 리소스를 찾을 수 없습니다.' });
});

// 서버 리스닝
app.listen(PORT, () => {
  console.log(`서버 실행 중! 포트: ${PORT}`);
});