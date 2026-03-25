(function () {
  // ---------- DOM elements ----------
  const timerDisplay = document.getElementById('timerDisplay');
  const modeLabelSpan = document.getElementById('modeLabel');
  const focusTimeDisplay = document.getElementById('focusTimeDisplay');
  const sessionDisplaySpan = document.getElementById('sessionDisplay');
  const startPauseBtn = document.getElementById('startPauseBtn');
  const skipBackBtn = document.getElementById('skipBackBtn');
  const skipForwardBtn = document.getElementById('skipForwardBtn');
  const progressRing = document.getElementById('progressRing');
  const timerCard = document.getElementById('timerCard');
  const settingsBtn = document.getElementById('settingsBtn');
  const modal = document.getElementById('settingsModal');
  const closeModal = document.getElementById('closeModalBtn');
  const saveSettings = document.getElementById('saveSettingsBtn');
  const focusInput = document.getElementById('focusInput');
  const shortInput = document.getElementById('shortInput');
  const longInput = document.getElementById('longInput');
  const sessionsBeforeLongInput = document.getElementById('sessionsBeforeLongInput');
  const modeBtns = document.querySelectorAll('.mode-btn');

  // ---------- Constants & state ----------
  const CIRCUMFERENCE = 2 * Math.PI * 120; // ~753.98
  progressRing.style.strokeDasharray = CIRCUMFERENCE;

  let currentMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
  let timeLeft = 25 * 60; // seconds
  let timerInterval = null;
  let isRunning = false;

  // stats
  let totalFocusMinutes = 0; // accumulated focus minutes
  let completedSessions = 0; // number of finished focus sessions
  let sessionsTarget = 4; // sessions before long break

  // durations (in seconds)
  let durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // ---------- helper functions ----------
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateUI() {
    timerDisplay.textContent = formatTime(timeLeft);
    let totalDuration = durations[currentMode];
    let offset = CIRCUMFERENCE - (timeLeft / totalDuration) * CIRCUMFERENCE;
    if (isNaN(offset)) offset = 0;
    progressRing.style.strokeDashoffset = offset;

    // update header stats
    const hours = Math.floor(totalFocusMinutes / 60);
    const mins = totalFocusMinutes % 60;
    focusTimeDisplay.textContent = `${hours}h ${mins}m`;
    sessionDisplaySpan.textContent = `${completedSessions}/${sessionsTarget}`;

    // mode label
    if (currentMode === 'focus') modeLabelSpan.textContent = 'FOCUS';
    else if (currentMode === 'shortBreak') modeLabelSpan.textContent = 'SHORT BREAK';
    else modeLabelSpan.textContent = 'LONG BREAK';
  }

  function switchMode(mode, resetTimerValue = true) {
    if (isRunning) pauseTimer();
    currentMode = mode;
    if (resetTimerValue) {
      timeLeft = durations[currentMode];
    }
    // update active mode button style
    modeBtns.forEach((btn) => {
      if (btn.dataset.mode === currentMode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    updateUI();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = true;
    timerCard.classList.add('running');
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        // timer finished
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        timerCard.classList.remove('running');
        updatePlayPauseIcon(false);
        handleSessionComplete();
      } else {
        timeLeft--;
        updateUI();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning = false;
    timerCard.classList.remove('running');
    updatePlayPauseIcon(false);
  }

  function resetCurrentTimer() {
    if (isRunning) pauseTimer();
    timeLeft = durations[currentMode];
    updateUI();
    updatePlayPauseIcon(false);
  }

  function handleSessionComplete() {
    // confetti + haptic (optional)
    confettiEffect();
    if (navigator.vibrate) navigator.vibrate(200);

    if (currentMode === 'focus') {
      // focus finished: add minutes to total
      const focusMinutes = durations.focus / 60;
      totalFocusMinutes += focusMinutes;
      completedSessions++;
      updateUI();
      // decide next mode
      if (completedSessions % sessionsTarget === 0) {
        switchMode('longBreak', true);
      } else {
        switchMode('shortBreak', true);
      }
    } else {
      // break finished: back to focus
      switchMode('focus', true);
    }
    // auto stop running state (timer already stopped)
    updatePlayPauseIcon(false);
  }

  function skipForward() {
    if (isRunning) pauseTimer();
    // complete current session artificially
    if (currentMode === 'focus') {
      totalFocusMinutes += durations.focus / 60;
      completedSessions++;
      updateUI();
      if (completedSessions % sessionsTarget === 0) {
        switchMode('longBreak', true);
      } else {
        switchMode('shortBreak', true);
      }
    } else {
      // break skip -> focus
      switchMode('focus', true);
    }
  }

  function skipBack() {
    if (isRunning) pauseTimer();
    resetCurrentTimer();
  }

  function updatePlayPauseIcon(isPlaying) {
    const svg = startPauseBtn.querySelector('svg');
    if (isPlaying) {
      // pause icon (two rectangles)
      svg.innerHTML =
        '<rect x="6" y="4" width="4" height="16" rx="1" stroke="none" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" stroke="none" fill="currentColor"/>';
      svg.setAttribute('viewBox', '0 0 24 24');
    } else {
      // play icon
      svg.innerHTML =
        '<path d="M8 5v14l11-7z" stroke="currentColor" stroke-width="2" fill="none"/>';
      svg.setAttribute('viewBox', '0 0 24 24');
    }
  }

  // confetti burst
  function confettiEffect() {
    for (let i = 0; i < 70; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
      conf.style.animationDuration = 2 + Math.random() * 2 + 's';
      conf.style.width = Math.random() * 8 + 4 + 'px';
      conf.style.height = Math.random() * 12 + 6 + 'px';
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 4000);
    }
  }

  // load settings from localStorage
  function loadStoredSettings() {
    const saved = localStorage.getItem('pomodoroPro');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.focus) durations.focus = data.focus * 60;
        if (data.shortBreak) durations.shortBreak = data.shortBreak * 60;
        if (data.longBreak) durations.longBreak = data.longBreak * 60;
        if (data.sessionsTarget) sessionsTarget = data.sessionsTarget;
        focusInput.value = durations.focus / 60;
        shortInput.value = durations.shortBreak / 60;
        longInput.value = durations.longBreak / 60;
        sessionsBeforeLongInput.value = sessionsTarget;
      } catch (e) {}
    }
    // apply durations to current mode
    if (currentMode === 'focus') timeLeft = durations.focus;
    else if (currentMode === 'shortBreak') timeLeft = durations.shortBreak;
    else timeLeft = durations.longBreak;
    updateUI();
  }

  function saveAllSettings() {
    const newFocus = parseInt(focusInput.value, 10);
    const newShort = parseInt(shortInput.value, 10);
    const newLong = parseInt(longInput.value, 10);
    const newSessions = parseInt(sessionsBeforeLongInput.value, 10);
    if (!isNaN(newFocus) && newFocus > 0) durations.focus = newFocus * 60;
    if (!isNaN(newShort) && newShort > 0) durations.shortBreak = newShort * 60;
    if (!isNaN(newLong) && newLong > 0) durations.longBreak = newLong * 60;
    if (!isNaN(newSessions) && newSessions > 0) sessionsTarget = newSessions;

    localStorage.setItem(
      'pomodoroPro',
      JSON.stringify({
        focus: durations.focus / 60,
        shortBreak: durations.shortBreak / 60,
        longBreak: durations.longBreak / 60,
        sessionsTarget: sessionsTarget,
      })
    );

    // reset current timer according to mode with new durations
    if (currentMode === 'focus') timeLeft = durations.focus;
    else if (currentMode === 'shortBreak') timeLeft = durations.shortBreak;
    else timeLeft = durations.longBreak;
    if (isRunning) pauseTimer();
    updateUI();
    modal.classList.remove('open');
  }

  // ---------- Event listeners ----------
  startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
      updatePlayPauseIcon(true);
    }
  });

  skipBackBtn.addEventListener('click', () => {
    if (isRunning) pauseTimer();
    skipBack();
  });

  skipForwardBtn.addEventListener('click', () => {
    if (isRunning) pauseTimer();
    skipForward();
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === currentMode) return;
      if (isRunning) pauseTimer();
      switchMode(mode, true);
    });
  });

  settingsBtn.addEventListener('click', () => {
    // reflect current durations in modal
    focusInput.value = durations.focus / 60;
    shortInput.value = durations.shortBreak / 60;
    longInput.value = durations.longBreak / 60;
    sessionsBeforeLongInput.value = sessionsTarget;
    modal.classList.add('open');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  saveSettings.addEventListener('click', saveAllSettings);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // keyboard shortcuts: spacebar (start/pause), r (reset current)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      startPauseBtn.click();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (isRunning) pauseTimer();
      resetCurrentTimer();
    }
  });

  // initial load and active mode
  loadStoredSettings();
  switchMode('focus', true);
  updatePlayPauseIcon(false);

  // initial progress update
  updateUI();
})();
