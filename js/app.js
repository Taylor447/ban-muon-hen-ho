/**
 * app.js — Bạn Muốn Hẹn Hò Simulator
 * Điều phối màn hình, quản lý âm thanh, hiệu ứng, lịch sử và 4 kết cục.
 */

// =============================================================================
// 1. TRẠNG THÁI TOÀN CỤC CỦA GAME (GLOBAL STATE)
// =============================================================================
const gameState = {
  // Hồ sơ người chơi
  player: {
    name: "Hoàng Long",
    age: 26,
    gender: "Nam",
    hometown: "TP.HCM",
    job: "Chuyên viên thiết kế",
    personality: ["Vui vẻ", "Chân thành"],
    hobbies: ["Nấu ăn", "Nghe nhạc"],
    gift: "🌹 Bó hoa hồng sáp thơm tự làm"
  },
  // Khách mời đang ghép đôi
  currentGuest: null,
  // Vòng chơi: 1 -> 4
  currentRound: 1,
  // Tấm rèm (đóng: false, mở: true)
  curtainOpened: false,
  // Điểm hảo cảm động (0 - 100%)
  affinity: 50,
  // Quyết định bấm nút
  playerLight: null,
  guestLight: null,
  // Kết quả vòng này
  outcomeKey: null
};

// =============================================================================
// 2. KHỞI TẠO ỨNG DỤNG
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Nạp hồ sơ đã lưu
  loadSavedProfile();

  // 2. Gắn sự kiện các nút chuyển màn hình
  initNavigationEvents();

  // 3. Khởi tạo chức năng chọn tag trong form
  initTagSelectors();

  // 4. Kết xuất danh sách 6 khách mời với chỉ số
  renderGuestsList();

  // 5. Khởi tạo modal cài đặt âm thanh
  initAudioSettingsModal();

  // Bắt sự kiện click bất kỳ trên trang để khởi động AudioContext (tránh bị trình duyệt chặn)
  document.body.addEventListener("click", () => {
    if (window.sound) window.sound.initContext();
  }, { once: true });
});

// =============================================================================
// 3. ĐIỀU HƯỚNG MÀN HÌNH (SCREEN NAVIGATION)
// =============================================================================
function navigateTo(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach(s => s.classList.remove("active"));

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Khởi động nhạc nền nếu ở menu hoặc sân khấu
    if (window.sound && window.sound.bgmEnabled && !window.sound.isPlayingBGM) {
      window.sound.startBGM();
    }
  }
}

function initNavigationEvents() {
  // Menu -> Tạo hồ sơ
  document.getElementById("btn-start-profile")?.addEventListener("click", () => {
    navigateTo("screen-profile");
  });

  // Menu -> Chơi nhanh
  document.getElementById("btn-quick-play")?.addEventListener("click", () => {
    gameState.currentGuest = MOCK_GUESTS[0];
    startStageSession();
  });

  // Menu -> Xem danh sách 6 khách mời
  document.getElementById("btn-view-guests")?.addEventListener("click", () => {
    navigateTo("screen-guests");
  });

  // Menu -> Xem Sổ tay Hẹn Hò
  document.getElementById("btn-view-history")?.addEventListener("click", () => {
    renderMatchHistory();
    navigateTo("screen-history");
  });

  // Header -> Về Menu
  document.getElementById("btn-nav-menu")?.addEventListener("click", () => {
    navigateTo("screen-menu");
  });

  // Hủy form tạo hồ sơ
  document.getElementById("btn-cancel-profile")?.addEventListener("click", () => {
    navigateTo("screen-menu");
  });

  // Quay lại từ danh sách khách mời
  document.getElementById("btn-back-from-guests")?.addEventListener("click", () => {
    navigateTo("screen-menu");
  });

  // Quay lại từ Sổ tay hẹn hò
  document.getElementById("btn-back-from-history")?.addEventListener("click", () => {
    navigateTo("screen-menu");
  });

  // Xóa lịch sử ghép đôi
  document.getElementById("btn-clear-history")?.addEventListener("click", clearMatchHistory);

  // Nộp form tạo hồ sơ
  document.getElementById("profile-form")?.addEventListener("submit", handleProfileSubmit);

  // Màn hình kết quả -> Chơi tiếp với người khác
  document.getElementById("btn-play-again")?.addEventListener("click", () => {
    navigateTo("screen-guests");
  });

  // Màn hình kết quả -> Xem sổ tay
  document.getElementById("btn-view-history-from-result")?.addEventListener("click", () => {
    renderMatchHistory();
    navigateTo("screen-history");
  });

  // Màn hình kết quả -> Về Menu
  document.getElementById("btn-back-menu")?.addEventListener("click", () => {
    navigateTo("screen-menu");
  });
}

// =============================================================================
// 4. QUẢN LÝ CÀI ĐẶT ÂM THANH (AUDIO SETTINGS MODAL)
// =============================================================================
function initAudioSettingsModal() {
  const modal = document.getElementById("modal-settings");
  const openBtn = document.getElementById("btn-open-settings");
  const closeBtn = document.getElementById("btn-close-settings");

  const toggleBGM = document.getElementById("toggle-bgm");
  const toggleSFX = document.getElementById("toggle-sfx");
  const sliderVolume = document.getElementById("slider-volume");
  const volumeText = document.getElementById("volume-val-text");

  // Đồng bộ trạng thái hiện tại từ sound system
  if (window.sound) {
    if (toggleBGM) toggleBGM.checked = window.sound.bgmEnabled;
    if (toggleSFX) toggleSFX.checked = window.sound.sfxEnabled;
    if (sliderVolume) sliderVolume.value = Math.round(window.sound.volume * 100);
    if (volumeText) volumeText.innerText = `${Math.round(window.sound.volume * 100)}%`;
  }

  // Mở / Đóng modal
  openBtn?.addEventListener("click", () => modal.classList.add("active"));
  closeBtn?.addEventListener("click", () => modal.classList.remove("active"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  // Sự kiện thay đổi cài đặt
  toggleBGM?.addEventListener("change", (e) => {
    window.sound?.toggleBGM(e.target.checked);
  });

  toggleSFX?.addEventListener("change", (e) => {
    window.sound?.toggleSFX(e.target.checked);
  });

  sliderVolume?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    if (volumeText) volumeText.innerText = `${val}%`;
    window.sound?.setVolume(val / 100);
  });

  // Nút thử âm thanh
  document.getElementById("btn-test-chime")?.addEventListener("click", () => {
    window.sound?.playChime();
  });
  document.getElementById("btn-test-applause")?.addEventListener("click", () => {
    window.sound?.playApplause(1.5);
  });
}

// =============================================================================
// 5. HỒ SƠ NGƯỜI CHƠI (PROFILE & LOCALSTORAGE)
// =============================================================================
function loadSavedProfile() {
  try {
    const saved = localStorage.getItem("bmhh_player_profile");
    if (saved) {
      gameState.player = JSON.parse(saved);
      document.getElementById("p-name").value = gameState.player.name || "Hoàng Long";
      document.getElementById("p-age").value = gameState.player.age || 26;
      document.getElementById("p-gender").value = gameState.player.gender || "Nam";
      document.getElementById("p-hometown").value = gameState.player.hometown || "TP.HCM";
      document.getElementById("p-job").value = gameState.player.job || "Chuyên viên thiết kế";
    }
  } catch (e) {
    console.warn("Lỗi đọc profile từ localStorage:", e);
  }
}

function initTagSelectors() {
  const setupGroup = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener("click", (e) => {
      const tag = e.target.closest(".selectable-tag");
      if (!tag) return;
      tag.classList.toggle("selected");
    });
  };
  setupGroup("personality-tags");
  setupGroup("hobbies-tags");
}

function handleProfileSubmit(e) {
  e.preventDefault();

  const personalityTags = Array.from(
    document.querySelectorAll("#personality-tags .selectable-tag.selected")
  ).map(el => el.dataset.val || el.innerText.trim());

  const hobbiesTags = Array.from(
    document.querySelectorAll("#hobbies-tags .selectable-tag.selected")
  ).map(el => el.dataset.val || el.innerText.trim());

  gameState.player = {
    name: document.getElementById("p-name").value.trim() || "Người chơi",
    age: parseInt(document.getElementById("p-age").value, 10) || 25,
    gender: document.getElementById("p-gender").value,
    hometown: document.getElementById("p-hometown").value.trim() || "Việt Nam",
    job: document.getElementById("p-job").value.trim() || "Tự do",
    personality: personalityTags.length > 0 ? personalityTags : ["Vui vẻ", "Chân thành"],
    hobbies: hobbiesTags.length > 0 ? hobbiesTags : ["Nấu ăn", "Nghe nhạc"],
    gift: document.getElementById("p-gift").value
  };

  try {
    localStorage.setItem("bmhh_player_profile", JSON.stringify(gameState.player));
  } catch (err) {
    console.warn("Lỗi lưu localStorage:", err);
  }

  navigateTo("screen-guests");
}

// =============================================================================
// 6. HIỂN THỊ DANH SÁCH 6 KHÁCH MỜI KÈM CHỈ SỐ NHÂN VẬT
// =============================================================================
function renderGuestsList() {
  const container = document.getElementById("guests-container");
  if (!container) return;
  container.innerHTML = "";

  MOCK_GUESTS.forEach(guest => {
    const card = document.createElement("div");
    card.className = "guest-card";
    card.innerHTML = `
      <div class="guest-avatar-row">
        <div class="guest-avatar">${guest.avatar}</div>
        <div class="guest-info">
          <h4>${guest.name} (${guest.age}t)</h4>
          <div class="guest-meta">${guest.job} • ${guest.hometown}</div>
        </div>
      </div>
      <div class="guest-tagline">"${guest.tagline}"</div>

      <!-- Chỉ số nhân vật trực quan -->
      <div class="guest-stats-box">
        <div><strong>❤️ Lãng mạn:</strong> ${guest.stats.romance}% | <strong>🎋 Truyền thống:</strong> ${guest.stats.tradition}%</div>
        <div><strong>💼 Thực tế:</strong> ${guest.stats.practicality}% | <strong>😄 Hài hước:</strong> ${guest.stats.humor}%</div>
        <div style="color: #d90429; font-size: 0.72rem; margin-top: 2px;">
          <strong>⚡ Tối kỵ (Deal-breaker):</strong> ${guest.dealBreaker}
        </div>
      </div>

      <div class="guest-hobbies">
        ${guest.hobbies.map(h => `<span class="hobby-pill">${h}</span>`).join("")}
      </div>

      <button class="btn btn-primary btn-select-guest" data-id="${guest.id}" style="margin-top: auto; padding: 10px 16px; font-size: 0.9rem;">
        🌹 Chọn ghép đôi
      </button>
    `;

    card.querySelector(".btn-select-guest").addEventListener("click", () => {
      gameState.currentGuest = guest;
      startStageSession();
    });

    container.appendChild(card);
  });
}

// =============================================================================
// 7. ĐIỀU PHỐI SÂN KHẤU (STAGE ENGINE & VÒNG CHƠI)
// =============================================================================
function startStageSession() {
  if (!gameState.currentGuest) {
    gameState.currentGuest = MOCK_GUESTS[0];
  }

  // Khởi tạo các trạng thái ban đầu
  gameState.currentRound = 1;
  gameState.curtainOpened = false;
  gameState.playerLight = null;
  gameState.guestLight = null;
  gameState.affinity = 50; // Bắt đầu ở mức 50%

  // Cập nhật bục người chơi
  document.getElementById("stage-player-name").innerText = gameState.player.name;
  document.getElementById("stage-player-avatar").innerText = gameState.player.gender === "Nữ" ? "👩" : "🧑";

  // Cập nhật bục khách mời (giấu mặt sau rèm)
  document.getElementById("stage-guest-name").innerText = "Ứng viên giấu mặt";
  document.getElementById("stage-guest-avatar").innerText = "❓";

  // Tắt đèn tín hiệu
  document.getElementById("player-light").classList.remove("on");
  document.getElementById("guest-light").classList.remove("on");

  // Đóng rèm
  const curtain = document.getElementById("stage-curtain");
  curtain.classList.remove("opened");

  // Cập nhật thanh nhiệt kế rung động
  updateAffinityDisplay();

  // Chuyển sang màn hình sân khấu
  navigateTo("screen-stage");
  renderStageRound();
}

/**
 * Cập nhật thanh nhiệt kế rung động
 */
function updateAffinityDisplay() {
  gameState.affinity = Math.max(0, Math.min(100, gameState.affinity));
  const fill = document.getElementById("affinity-bar-fill");
  const text = document.getElementById("affinity-percent-text");

  if (fill) fill.style.width = `${gameState.affinity}%`;
  if (text) text.innerText = `${gameState.affinity}%`;
}

function renderStageRound() {
  const round = gameState.currentRound;
  const guest = gameState.currentGuest;

  // Cập nhật stepper
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (!stepEl) continue;
    stepEl.classList.remove("active", "done");
    if (i < round) stepEl.classList.add("done");
    else if (i === round) stepEl.classList.add("active");
  }

  // Cập nhật thoại 2 MC
  updateMCDialogues(round);

  const box = document.getElementById("interaction-box");
  if (!box) return;

  if (round === 1) renderRound1Greeting(box, guest);
  else if (round === 2) renderRound2QA(box, guest);
  else if (round === 3) renderRound3Reveal(box, guest);
  else if (round === 4) renderRound4Decision(box, guest);
}

function updateMCDialogues(round) {
  const tuBubble = document.getElementById("mc-tu-bubble");
  const maiBubble = document.getElementById("mc-mai-bubble");
  const lines = MOCK_MC_LINES[`round${round}`] || MOCK_MC_LINES.round1;

  if (tuBubble) tuBubble.innerText = lines.tuDuyen;
  if (maiBubble) maiBubble.innerText = lines.maiHanh;
}

// -----------------------------------------------------------------------------
// VÒNG 1: CHÀO SÂN QUA RÈM
// -----------------------------------------------------------------------------
function renderRound1Greeting(box, guest) {
  box.innerHTML = `
    <div class="interaction-title">
      <span>🎭 Vòng 1: Chào sân & Giới thiệu qua bức rèm đỏ</span>
    </div>
    <div style="background: #fdf2f4; border-radius: 8px; padding: 12px; margin-bottom: 14px; border-left: 3px solid var(--primary-pink);">
      <strong style="color: var(--primary-red);">Lời chào từ bên kia rèm:</strong>
      <div style="font-style: italic; margin-top: 4px; color: #333;">"${guest.greeting}"</div>
    </div>

    <div style="margin-bottom: 12px;">
      <label style="font-size: 0.85rem; font-weight: 700; color: #495057;">Chọn cách chào đáp lại:</label>
      <div class="qa-options" style="margin-top: 8px;">
        <button class="qa-btn selected" onclick="handleGreetingChoice(this, 10)">
          🌸 "Chào bạn và 2 MC! Mình rất vui được có duyên gặp gỡ hôm nay." (+10% hảo cảm)
        </button>
        <button class="qa-btn" onclick="handleGreetingChoice(this, 15)">
          😄 "Chào bạn bên kia rèm! Chú Tư ơi hôm nay con mang trọn tấm lòng tới đây nè!" (+15% hảo cảm)
        </button>
        <button class="qa-btn" onclick="handleGreetingChoice(this, -5)">
          😐 "Chào bạn, mình hy vọng bạn không làm mình thất vọng." (-5% hảo cảm)
        </button>
      </div>
    </div>

    <button class="btn btn-primary" onclick="proceedToNextRound()" style="margin-top: 10px;">
      Tiếp tục: Sang vòng Hỏi đáp ➡
    </button>
  `;
}

function handleGreetingChoice(btn, delta) {
  const siblings = btn.parentElement.querySelectorAll(".qa-btn");
  siblings.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");

  gameState.affinity += delta;
  updateAffinityDisplay();
}

// -----------------------------------------------------------------------------
// VÒNG 2: HỎI ĐÁP QUA RÈM
// -----------------------------------------------------------------------------
function renderRound2QA(box, guest) {
  const q = MOCK_QUESTIONS[0];

  box.innerHTML = `
    <div class="interaction-title">
      <span>💬 Vòng 2: Trò chuyện & Tìm hiểu quan điểm</span>
    </div>
    <div style="background: #fff0f3; border-radius: 8px; padding: 14px; margin-bottom: 14px; border: 1px solid #ffd6e0;">
      <div style="font-weight: 700; color: var(--primary-red); margin-bottom: 6px;">
        ❓ Câu hỏi của Chú Tư & Chị Mai Hạnh:
      </div>
      <div style="font-size: 0.95rem; color: #222;">"${q.question}"</div>
    </div>

    <div style="margin-bottom: 14px;">
      <label style="font-size: 0.85rem; font-weight: 700; color: #495057;">Câu trả lời của bạn:</label>
      <div class="qa-options" style="margin-top: 8px;">
        ${q.options.map((opt, idx) => `
          <button class="qa-btn ${idx === 0 ? 'selected' : ''}" onclick="handleQAChoice(this, ${opt.delta}, '${opt.mc}')">
            👉 ${opt.text} (${opt.delta > 0 ? '+' : ''}${opt.delta}%)
          </button>
        `).join("")}
      </div>
    </div>

    <button class="btn btn-primary" onclick="proceedToNextRound()" style="margin-top: 10px;">
      Tiếp tục: Kéo rèm gặp mặt ➡
    </button>
  `;
}

function handleQAChoice(btn, delta, mcNote) {
  const siblings = btn.parentElement.querySelectorAll(".qa-btn");
  siblings.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");

  gameState.affinity += delta;
  updateAffinityDisplay();

  // Nhắc khéo của MC
  const tuBubble = document.getElementById("mc-tu-bubble");
  if (tuBubble) tuBubble.innerText = `Chú Tư: "${mcNote}"`;
}

// -----------------------------------------------------------------------------
// VÒNG 3: KÉO RÈM GẶP MẶT TRỰC TIẾP
// -----------------------------------------------------------------------------
function renderRound3Reveal(box, guest) {
  // Phát âm thanh tiếng kéo rèm
  if (window.sound) window.sound.playCurtainWhoosh();

  // Kéo rèm
  const curtain = document.getElementById("stage-curtain");
  if (curtain) curtain.classList.add("opened");

  // Lộ diện khách mời
  document.getElementById("stage-guest-avatar").innerText = guest.avatar;
  document.getElementById("stage-guest-name").innerText = guest.name;

  // Thưởng hảo cảm khi tặng quà
  gameState.affinity += 10;
  updateAffinityDisplay();

  box.innerHTML = `
    <div class="interaction-title">
      <span>✨ Vòng 3: Kéo rèm gặp mặt & Trao quà</span>
    </div>
    <div style="text-align: center; padding: 14px; background: #fff5f7; border-radius: 8px; margin-bottom: 14px;">
      <div style="font-size: 2.2rem; margin-bottom: 6px;">${guest.avatar}</div>
      <h3 style="color: var(--primary-red); margin-bottom: 4px;">${guest.name} (${guest.age} tuổi)</h3>
      <p style="font-size: 0.85rem; color: #666;">${guest.job} • Đến từ ${guest.hometown}</p>
      <div style="margin-top: 10px; font-style: italic; color: #444;">
        🎁 Bạn đã trao tặng: <strong>${gameState.player.gift}</strong>
      </div>
      <p style="margin-top: 8px; font-size: 0.9rem; color: #2b9348; font-weight: 600;">
        "${guest.name} đón nhận món quà với ánh mắt rạng rỡ!" (+10% hảo cảm)
      </p>
    </div>

    <button class="btn btn-primary" onclick="proceedToNextRound()" style="margin-top: 10px; width: 100%;">
      Tiếp tục: Đến giây phút quyết định bấm nút ⏰
    </button>
  `;
}

// -----------------------------------------------------------------------------
// VÒNG 4: GIÂY PHÚT QUYẾT ĐỊNH BẬT / TẮT ĐÈN
// -----------------------------------------------------------------------------
function renderRound4Decision(box, guest) {
  box.innerHTML = `
    <div class="interaction-title" style="justify-content: center; font-size: 1.1rem;">
      <span>⏱ Giờ phút quyết định: Bạn có muốn hẹn hò?</span>
    </div>
    <p style="text-align: center; font-size: 0.9rem; color: #555; margin-bottom: 16px;">
      3... 2... 1... Hãy lắng nghe nhịp đập con tim và nhấn nút định mệnh!
    </p>

    <div class="decision-controls">
      <button class="btn-light-on" onclick="handleDecision(true)">
        💖 BẬT ĐÈN HẸN HÒ
      </button>
      <button class="btn-light-off" onclick="handleDecision(false)">
        🖤 Tắt đèn lịch sự
      </button>
    </div>
  `;

  // Hiệu ứng đếm ngược âm thanh
  if (window.sound) {
    window.sound.playBeep(false);
    setTimeout(() => window.sound?.playBeep(false), 900);
    setTimeout(() => window.sound?.playBeep(true), 1800);
  }
}

function proceedToNextRound() {
  if (gameState.currentRound < 4) {
    gameState.currentRound += 1;
    renderStageRound();
  }
}

// =============================================================================
// 8. XỬ LÝ QUYẾT ĐỊNH VÀ 4 KẾT THÚC (MULTIPLE ENDINGS)
// =============================================================================
function handleDecision(playerChoice) {
  gameState.playerLight = playerChoice;

  // Tính xác suất NPC bật đèn dựa trên độ hảo cảm và pickiness của NPC
  const guest = gameState.currentGuest;
  const threshold = guest.pickiness || 60;
  // Nếu hảo cảm >= ngưỡng, xác suất bật đèn 85%, nếu thấp hơn thì 30%
  const guestWillLight = gameState.affinity >= threshold
    ? Math.random() < 0.85
    : Math.random() < 0.30;

  gameState.guestLight = guestWillLight;

  // Hiệu ứng âm thanh khi bấm nút
  if (playerChoice && window.sound) {
    window.sound.playChime();
  }

  // Cập nhật đèn trên sân khấu
  if (gameState.playerLight) {
    document.getElementById("player-light").classList.add("on");
  }
  if (gameState.guestLight) {
    document.getElementById("guest-light").classList.add("on");
  }

  // Xác định 1 trong 4 kết cục
  let outcomeKey = "both_off";
  if (gameState.playerLight && gameState.guestLight) {
    outcomeKey = "both_on";
  } else if (gameState.playerLight && !gameState.guestLight) {
    outcomeKey = "player_only";
  } else if (!gameState.playerLight && gameState.guestLight) {
    outcomeKey = "guest_only";
  } else {
    outcomeKey = "both_off";
  }
  gameState.outcomeKey = outcomeKey;

  // Lưu lịch sử tập chơi vào localStorage
  saveMatchHistory({
    guestName: guest.name,
    guestAvatar: guest.avatar,
    guestJob: guest.job,
    guestAge: guest.age,
    playerName: gameState.player.name,
    outcomeKey: outcomeKey,
    affinity: gameState.affinity,
    date: new Date().toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    })
  });

  // Tạm dừng 1.2s tạo kịch tính rồi hiển thị kết quả
  setTimeout(() => {
    showMatchResult();
  }, 1200);
}

function showMatchResult() {
  const ending = MOCK_MC_LINES.endings[gameState.outcomeKey];
  const guest = gameState.currentGuest;

  const resIcon = document.getElementById("result-icon");
  const resBadge = document.getElementById("result-badge");
  const resTitle = document.getElementById("result-title");
  const resDesc = document.getElementById("result-desc");
  const avatar1 = document.getElementById("res-avatar-1");
  const avatar2 = document.getElementById("res-avatar-2");
  const heartIcon = document.getElementById("res-heart-icon");
  const statsBox = document.getElementById("result-stats-breakdown");

  avatar1.innerText = gameState.player.gender === "Nữ" ? "👩" : "🧑";
  avatar2.innerText = guest.avatar;

  resIcon.innerText = ending.icon;
  resTitle.innerText = ending.title;
  resBadge.innerText = ending.badge;

  // Cập nhật badge class
  resBadge.className = `result-badge ${gameState.outcomeKey.replace('_', '-')}`;

  // Bảng phân tích chi tiết chỉ số
  statsBox.innerHTML = `
    <table>
      <tr>
        <td><strong>Độ hảo cảm tích lũy:</strong></td>
        <td style="text-align: right; color: var(--primary-red); font-weight: 700;">${gameState.affinity}%</td>
      </tr>
      <tr>
        <td><strong>Người chơi (${gameState.player.name}):</strong></td>
        <td style="text-align: right;">${gameState.playerLight ? '💖 BẬT ĐÈN' : '🖤 TẮT ĐÈN'}</td>
      </tr>
      <tr>
        <td><strong>Khách mời (${guest.name}):</strong></td>
        <td style="text-align: right;">${gameState.guestLight ? '💖 BẬT ĐÈN' : '🖤 TẮT ĐÈN'}</td>
      </tr>
      <tr>
        <td><strong>Quà tặng lưu niệm:</strong></td>
        <td style="text-align: right;">${gameState.player.gift}</td>
      </tr>
    </table>
  `;

  // Lời bình 2 MC
  resDesc.innerHTML = `
    <div style="margin-bottom: 12px; color: #222; font-size: 0.95rem;">${ending.tuDuyen}</div>
    <div style="color: #444; font-size: 0.95rem;">${ending.maiHanh}</div>
  `;

  // Xử lý hiệu ứng âm thanh & hình ảnh theo từng kết thúc
  if (gameState.outcomeKey === "both_on") {
    heartIcon.innerText = "❤️";
    if (window.sound) window.sound.playFanfare();
    if (window.effects) {
      window.effects.launchConfetti(4500);
      window.effects.triggerStageCelebration();
    }
  } else if (gameState.outcomeKey === "player_only") {
    heartIcon.innerText = "💔";
    if (window.sound) window.sound.playSadTune();
  } else if (gameState.outcomeKey === "guest_only") {
    heartIcon.innerText = "🥀";
    if (window.sound) window.sound.playSadTune();
  } else {
    heartIcon.innerText = "🤝";
    if (window.sound) window.sound.playApplause(1.5);
  }

  navigateTo("screen-result");
}

// =============================================================================
// 9. QUẢN LÝ SỔ TAY HẸN HÒ (MATCH HISTORY & LOCALSTORAGE)
// =============================================================================
function saveMatchHistory(record) {
  try {
    const list = getMatchHistory();
    list.unshift(record); // Thêm vào đầu danh sách
    localStorage.setItem("bmhh_match_history", JSON.stringify(list));
  } catch (e) {
    console.warn("Lỗi lưu lịch sử ghép đôi:", e);
  }
}

function getMatchHistory() {
  try {
    const raw = localStorage.getItem("bmhh_match_history");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function clearMatchHistory() {
  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trong Sổ tay Hẹn Hò?")) {
    try {
      localStorage.removeItem("bmhh_match_history");
      renderMatchHistory();
    } catch (e) {
      console.warn("Lỗi xóa lịch sử:", e);
    }
  }
}

function renderMatchHistory() {
  const container = document.getElementById("history-container");
  if (!container) return;

  const history = getMatchHistory();
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-history">
        <div style="font-size: 3rem; margin-bottom: 8px;">📖</div>
        <p>Chưa có tập phát sóng nào được ghi lại.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Hãy bắt đầu ghép đôi cùng một khách mời để ghi dấu kỷ niệm!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(item => {
    let outcomeText = "🤝 Bạn bè";
    let badgeClass = "failed";

    if (item.outcomeKey === "both_on") {
      outcomeText = "💖 Ghép đôi thành công";
      badgeClass = "success";
    } else if (item.outcomeKey === "player_only") {
      outcomeText = "💔 Bạn bật • Khách tắt";
      badgeClass = "player-only";
    } else if (item.outcomeKey === "guest_only") {
      outcomeText = "😮 Bạn tắt • Khách bật";
      badgeClass = "guest-only";
    }

    return `
      <div class="history-item">
        <div class="history-left">
          <div class="history-avatar">${item.guestAvatar}</div>
          <div>
            <div class="history-name">${item.guestName} (${item.guestAge}t) - ${item.guestJob}</div>
            <div class="history-time">📅 ${item.date}</div>
          </div>
        </div>
        <div class="history-right">
          <span class="result-badge ${badgeClass}" style="margin: 0; font-size: 0.75rem;">${outcomeText}</span>
          <span style="font-size: 0.78rem; color: #555;">Hảo cảm: <strong>${item.affinity}%</strong></span>
        </div>
      </div>
    `;
  }).join("");
}
