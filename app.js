document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 상태 변수 정의 및 초기 설정
  // ==========================================================================
  let currentLang = localStorage.getItem('preferredLang') || 'ko';
  
  // 언어별 정보 매핑 (국기 및 단축명)
  const langMeta = {
    ko: { name: 'KO', flag: '🇰🇷' },
    en: { name: 'EN', flag: '🇺🇸' },
    zh: { name: 'ZH', flag: '🇨🇳' },
    ja: { name: 'JA', flag: '🇯🇵' },
    vi: { name: 'VI', flag: '🇻🇳' }
  };

  // ==========================================================================
  // DOM 요소 선택
  // ==========================================================================
  const langBtn = document.getElementById('lang-btn');
  const langSelector = document.getElementById('lang-selector');
  const langOptions = document.querySelectorAll('.lang-option');
  const currentFlagEl = document.getElementById('current-flag');
  const currentLangNameEl = document.getElementById('current-lang-name');
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const timelinePanels = document.querySelectorAll('.timeline-panel');
  
  const packCheckboxes = document.querySelectorAll('.pack-checkbox');
  const progressBar = document.getElementById('progress-bar');
  const checkedCountEl = document.getElementById('checked-count');
  const totalCountEl = document.getElementById('total-count');
  
  const floatingTabs = document.querySelectorAll('.floating-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const mainHeader = document.getElementById('main-header');
  const backToTopBtn = document.getElementById('back-to-top');

  // ==========================================================================
  // 1. 다국어 번역 시스템 (i18n)
  // ==========================================================================
  
  // 객체 내 중첩된 경로(예: "schedule.activities.t1200")로부터 값을 안전하게 추출하는 유틸
  function getNestedTranslation(obj, path) {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  }

  // 화면의 모든 다국어 요소 번역 렌더링
  function applyTranslations(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    document.documentElement.lang = lang;

    // data-i18n 속성을 가진 모든 엘리먼트 순회
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
      const path = el.getAttribute('data-i18n');
      const translation = getNestedTranslation(translations[lang], path);
      
      if (translation) {
        // 타이틀 속성이나 meta 정보인 경우와 분기 처리
        if (el.tagName === 'TITLE') {
          document.title = translation;
        } else {
          // 엘리먼트 내부에 다른 아이콘(i 태그 등)이 보존되어야 하는 구조인지 확인
          const iconEl = el.querySelector('i');
          if (iconEl) {
            // 아이콘 태그가 있다면 텍스트 노드만 변경하거나 아이콘을 앞에 재삽입
            el.innerHTML = '';
            el.appendChild(iconEl);
            el.appendChild(document.createTextNode(' ' + translation));
          } else {
            // 순수 텍스트 영역인 경우
            el.textContent = translation;
          }
        }
      }
    });

    // 헤더 선택기 상태 업데이트
    currentFlagEl.textContent = langMeta[lang].flag;
    currentLangNameEl.textContent = langMeta[lang].name;

    // 드롭다운 옵션들의 active 클래스 갱신
    langOptions.forEach(opt => {
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  // 언어 선택 드롭다운 토글 제어
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langSelector.classList.toggle('open');
  });

  // 빈 화면 클릭 시 언어 드롭다운 닫기
  document.addEventListener('click', () => {
    langSelector.classList.remove('open');
  });

  // 언어 옵션 클릭 이벤트 연동
  langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedLang = option.getAttribute('data-lang');
      applyTranslations(selectedLang);
      langSelector.classList.remove('open');
    });
  });

  // ==========================================================================
  // 2. 일정표 일자별 탭 인터랙션 (일정 탭 내 세부 컨트롤)
  // ==========================================================================
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTab = btn.getAttribute('data-tab');
      
      // 버튼 활성화 토글
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 타임라인 패널 전환
      timelinePanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${selectedTab}-panel`) {
          panel.classList.add('active');
        }
      });
    });
  });

  // ==========================================================================
  // 3. LocalStorage 기반 가방 싸기 체크리스트
  // ==========================================================================
  
  // 체크리스트 상태 계산 및 UI 렌더링
  function updateChecklistProgress() {
    const totalCount = packCheckboxes.length;
    let checkedCount = 0;
    const checklistStates = {};

    packCheckboxes.forEach(cb => {
      const isChecked = cb.checked;
      checklistStates[cb.id] = isChecked;
      
      // 체크 상태에 따라 부모 카드 스타일링 동적 토글
      const itemCard = cb.closest('.checklist-item');
      if (isChecked) {
        checkedCount++;
        itemCard.classList.add('checked');
      } else {
        itemCard.classList.remove('checked');
      }
    });

    // 로컬 스토리지에 상태 저장
    localStorage.setItem('campChecklistStates', JSON.stringify(checklistStates));

    // 개수 및 진행바 업데이트
    checkedCountEl.textContent = checkedCount;
    totalCountEl.textContent = totalCount;
    
    const progressPercent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
    progressBar.style.width = `${progressPercent}%`;
  }

  // 체크리스트 저장된 상태 불러와 복원하기
  function restoreChecklistState() {
    const savedStatesStr = localStorage.getItem('campChecklistStates');
    if (savedStatesStr) {
      try {
        const savedStates = JSON.parse(savedStatesStr);
        packCheckboxes.forEach(cb => {
          if (savedStates[cb.id] !== undefined) {
            cb.checked = savedStates[cb.id];
          }
        });
      } catch (e) {
        console.error('Error parsing checklist states:', e);
      }
    }
    updateChecklistProgress();
  }

  // 체크박스 클릭 감지 이벤트 연결
  packCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateChecklistProgress);
  });

  // ==========================================================================
  // 4. 대주제 탭 라우팅 구조 구현 (하단 퀵 탭 연동)
  // ==========================================================================
  
  function switchMainTab(targetId) {
    // 1. 하단 탭 버튼 활성화 변경
    floatingTabs.forEach(tab => {
      if (tab.getAttribute('data-target') === targetId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 2. 해당하는 주요 탭 콘텐츠만 활성화 (보이기/숨기기)
    tabContents.forEach(content => {
      if (content.id === targetId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // 3. 화면을 맨 위로 쾌적하게 롤백
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // 하단 탭 버튼 클릭 이벤트 바인딩
  floatingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      switchMainTab(targetId);
    });
  });

  // 스크롤 시 헤더 섀도우 처리
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  });

  // '맨 위로' 버튼 활성화
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // ==========================================================================
  // 5. 초기 실행 엔진 구동
  // ==========================================================================
  applyTranslations(currentLang);
  restoreChecklistState();
});
