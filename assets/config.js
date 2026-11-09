// 배포 설정 — 운영자가 값을 채운다(docs/OPEN_QUESTIONS.md).
// 비어 있으면: 공유 버튼 비활성, 채널 추가 버튼 비활성. 개인정보·추적 관련 값은 두지 않는다.
export default {
  /** 카카오 디벨로퍼스 JS 앱 키 */
  KAKAO_JS_KEY: '',
  /** 카카오 JS SDK 주소(정확한 버전 고정) + SRI 해시 — 키를 받으면 함께 채운다 */
  KAKAO_SDK_URL: 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js',
  KAKAO_SDK_INTEGRITY: '',
  /** 카카오톡 채널 홈 (예: https://pf.kakao.com/_xxxxx) */
  KAKAO_CHANNEL_URL: '',
  /** 공용 사이트 주소(끝 / 포함). 비우면 현재 origin 을 쓴다 */
  SITE_URL: '',
  /** 공유 고정 썸네일(절대 URL, 1200×600 권장). 비우면 텍스트형 공유 */
  SHARE_THUMB_URL: '',
  /** 사업자 정보 페이지 */
  BUSINESS_INFO_URL: 'https://bluem-partners.com/',
};
