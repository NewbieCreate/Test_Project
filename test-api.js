const axios = require("axios");

const API_BASE_URL = "http://localhost:3001";

async function testAPI() {
  console.log("🚀 API 테스트 시작...\n");

  try {
    // 1. 데이터베이스 연결 테스트
    console.log("1️⃣ 데이터베이스 연결 테스트...");
    const connectionTest = await axios.get(
      `${API_BASE_URL}/header/test/connection`
    );
    console.log("✅ 연결 성공:", connectionTest.data);
    console.log("");

    // 2. 테스트 사용자 생성
    console.log("2️⃣ 테스트 사용자 생성...");
    const createUser = await axios.get(
      `${API_BASE_URL}/header/test/create-user`
    );
    console.log("✅ 사용자 생성 성공:", createUser.data);
    console.log("");

    // 3. 생성된 사용자 정보 조회
    const userId = createUser.data.data.idx;
    console.log(`3️⃣ 사용자 정보 조회 (idx: ${userId})...`);
    const userData = await axios.get(`${API_BASE_URL}/header/${userId}`);
    console.log("✅ 사용자 정보:", userData.data);
    console.log("");

    // 4. 존재하지 않는 사용자 조회 테스트
    console.log("4️⃣ 존재하지 않는 사용자 조회 테스트 (idx: 999)...");
    const notFoundUser = await axios.get(`${API_BASE_URL}/header/999`);
    console.log("✅ 결과:", notFoundUser.data);
    console.log("");

    console.log("🎉 모든 테스트 완료!");
  } catch (error) {
    console.error("❌ 테스트 실패:", error.response?.data || error.message);
  }
}

testAPI();
