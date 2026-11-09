// 검토 대기열 보조 스크립트: 메시지 복사, 발행 확인. 서버로 보내는 요청은 폼 제출뿐이다.
document.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('[data-copy]');
  if (copyBtn) {
    const ta = document.getElementById(copyBtn.dataset.copy);
    try {
      await navigator.clipboard.writeText(ta.value);
    } catch {
      // http(내부망) 등 클립보드 API 를 못 쓰는 환경
      ta.select();
      document.execCommand('copy');
    }
    copyBtn.textContent = '복사됨';
  }
});
document.addEventListener('submit', (e) => {
  const btn = e.submitter || e.target.querySelector('[data-confirm]');
  if (btn && btn.dataset.confirm && !window.confirm(btn.dataset.confirm)) e.preventDefault();
});
