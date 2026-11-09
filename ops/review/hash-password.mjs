// 운영자 비밀번호 해시 만들기 — 결과를 환경변수 OPS_PASSWORD_HASH 에 넣는다(저장소에 커밋하지 않는다).
//   node ops/review/hash-password.mjs '<비밀번호>'
import { hashPassword } from './auth.mjs';

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error('12자 이상 비밀번호를 인자로 주세요.');
  process.exit(64);
}
console.log(hashPassword(pw));
