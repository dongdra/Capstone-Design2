const fs = require('fs-extra');
const path = require('path');
const connection = require('../db/db');  // db.js에서 MySQL 연결 불러오기

// 유저 폴더 생성 함수
async function createUserFolder(userId) {
  const userFolder = path.join(__dirname, 'users', userId);

  try {
    await fs.ensureDir(userFolder);
    console.log('유저 폴더 생성 완료:', userFolder);
  } catch (err) {
    console.error('폴더 생성 오류:', err);
  }
}

// 폴더와 DB 불일치 상태 처리 함수
async function handleFolderDiscrepancies(del_dir) {
  const userFolderBase = path.join(__dirname, 'users');
  const tempFolder = path.join(__dirname, 'temp_user');

  try {
    // DB에서 모든 유저 UUID 가져오기
    const dbUserIds = await getDbUserIds();

    // 폴더 목록 가져오기
    const folderUserIds = await fs.readdir(userFolderBase);

    // 폴더는 있지만 DB에 없는 경우 처리
    for (const folderUserId of folderUserIds) {
      if (!dbUserIds.includes(folderUserId)) {
        const folderPath = path.join(userFolderBase, folderUserId);

        if (del_dir === 1) {
          // 폴더 삭제
          await fs.remove(folderPath);
          console.log(`폴더 삭제 완료: ${folderPath}`);
        } else if (del_dir === 0) {
          // 폴더 이동 (temp_user 폴더가 없으면 생성)
          await fs.ensureDir(tempFolder);
          await fs.move(folderPath, path.join(tempFolder, folderUserId), { overwrite: true });
          console.log(`폴더를 temp_user로 이동 완료: ${folderUserId}`);
        }
      }
    }

    // DB에는 있지만 폴더가 없는 경우 처리
    for (const dbUserId of dbUserIds) {
      const userFolder = path.join(userFolderBase, dbUserId);
      if (!fs.existsSync(userFolder)) {
        console.log(`DB에만 존재, 폴더가 없음: ${dbUserId}`);
        // 폴더 생성
        createUserFolder(dbUserId);
      }
    }
  } catch (err) {
    console.error('오류:', err);
  }
}

// DB에서 활성화된 유저 UUID 가져오기
function getDbUserIds() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT id FROM users WHERE status = "active"', (err, results) => {
      if (err) return reject(err);
      const userIds = results.map(row => row.id);
      resolve(userIds);
    });
  });
}

// 폴더 관리 함수 실행 (단독 실행 시)
if (require.main === module) {
  const del_dir = 1; // 1이면 삭제, 0이면 temp_user로 이동
  handleFolderDiscrepancies(del_dir);
}

module.exports = {
  createUserFolder,
  handleFolderDiscrepancies
};
