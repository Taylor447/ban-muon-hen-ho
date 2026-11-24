/**
 * match.js — Bạn Muốn Hẹn Hò Simulator
 * Module ghép đôi: tính tương thích, quản lý hảo cảm, và cơ chế bật/tắt đèn.
 *
 * Cách dùng (ES Module):
 *   import { createNPC, MatchEngine, runQuickTest } from './match.js';
 *
 * Cách dùng (browser <script type="module"> hoặc console):
 *   Gọi window.BMHHTest.runAll() sau khi load file.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// HẰNG SỐ & CẤU HÌNH
// ─────────────────────────────────────────────────────────────────────────────

/** Giới hạn điểm tổng tương thích */
const SCORE_MAX = 100;
const SCORE_MIN = 0;

/**
 * Trọng số từng thành phần điểm (tổng = 85, 15 còn lại dành cho chemistry).
 * Thay đổi các con số này để "cân bằng" độ khó game.
 */
const WEIGHTS = {
  hobbies:       20,   // Sở thích chung
  values:        25,   // Giá trị sống
  personality:   20,   // Tính cách
  future:        20,   // Kỳ vọng tương lai
  chemistry:     15,   // Yếu tố duyên số (ngẫu nhiên có biên độ)
};

/** Điểm phạt khi vi phạm deal-breaker */
const DEAL_BREAKER_PENALTY = 35;

/**
 * Bảng ngưỡng quyết định của NPC (dựa trên pickiness 0–100).
 * confirmed: NPC chắc chắn bật đèn.
 * hesitant:  NPC lưỡng lự — có xác suất bật đèn.
 * refused:   NPC tắt đèn.
 */
const LIGHT_THRESHOLDS = {
  confirmed: 72,   // S_total >= confirmed → chắc chắn bật
  hesitant:  48,   // hesitant <= S_total < confirmed → lưỡng lự
  // S_total < hesitant → từ chối
};

/** Xác suất bật đèn trong vùng lưỡng lự (tuyến tính 20%–80%) */
const HESITANT_PROB_MIN = 0.20;
const HESITANT_PROB_MAX = 0.80;

/** Xác suất NPC đổi ý sau khi đã có quyết định sơ bộ (tạo drama) */
const CHANGE_MIND_PROB = 0.12;

// ─────────────────────────────────────────────────────────────────────────────
// ENUM & KIỂU DỮ LIỆU (JSDoc)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'huongngoai'|'huongnoi'} PersonalityIntrovert
 * @typedef {'langman'|'thucte'} PersonalityRomantic
 * @typedef {'truyenthong'|'hientai'} PersonalityTradition
 * @typedef {'tramtinh'|'haiphuoc'} PersonalityHumor
 *
 * @typedef {Object} PersonalityAxes
 * @property {number} introvert    -2 (hướng nội thuần) → +2 (hướng ngoại thuần)
 * @property {number} romantic     -2 (thực tế) → +2 (lãng mạn)
 * @property {number} tradition    -2 (hiện đại) → +2 (truyền thống)
 * @property {number} humor        -2 (trầm tính) → +2 (hài hước)
 *
 * @typedef {Object} NPC
 * @property {string}          id
 * @property {string}          name
 * @property {number}          age
 * @property {string}          job
 * @property {string}          hometown
 * @property {string[]}        hobbies        - Danh sách sở thích (thẻ tag)
 * @property {string[]}        coreValues     - Giá trị sống quan trọng nhất
 * @property {PersonalityAxes} personality    - 4 trục tính cách −2..+2
 * @property {string[]}        futureGoals    - Kỳ vọng tương lai
 * @property {string[]}        dealBreakers   - Điều tuyệt đối không chấp nhận
 * @property {number}          pickiness      - Độ khó tính 0–100 (ảnh hưởng ngưỡng bật đèn)
 * @property {string[]}        preferredTags  - Gu người chơi lý tưởng (tags)
 * @property {Object}          dialogues      - Ngân hàng thoại theo tình huống
 *
 * @typedef {Object} PlayerProfile
 * @property {string}          name
 * @property {number}          age
 * @property {string[]}        hobbies
 * @property {string[]}        coreValues
 * @property {PersonalityAxes} personality
 * @property {string[]}        futureGoals
 * @property {string[]}        chosenTags     - Tags người chơi tự mô tả
 *
 * @typedef {'confirmed'|'hesitant'|'refused'} LightDecision
 *
 * @typedef {Object} MatchResult
 * @property {number}        totalScore
 * @property {Object}        breakdown      - Chi tiết từng thành phần điểm
 * @property {boolean}       dealBreakerHit - Có vi phạm deal-breaker không
 * @property {string[]}      hitDealBreakers
 * @property {LightDecision} npcDecisionRaw  - Quyết định trước khi "đổi ý"
 * @property {boolean}       npcLightOn      - Quyết định cuối cùng của NPC
 * @property {string}        npcDialogue     - Câu thoại NPC khi công bố kết quả
 * @property {string}        mcComment       - Bình luận của MC
 */

// ─────────────────────────────────────────────────────────────────────────────
// NPC FACTORY & DỮ LIỆU MẪU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo một NPC với giá trị mặc định có thể ghi đè.
 * @param {Partial<NPC>} overrides
 * @returns {NPC}
 */
function createNPC(overrides = {}) {
  const defaults = {
    id:          `npc_${Date.now()}`,
    name:        'Ứng viên',
    age:         25,
    job:         'Nhân viên văn phòng',
    hometown:    'Hà Nội',
    hobbies:     [],
    coreValues:  [],
    personality: { introvert: 0, romantic: 0, tradition: 0, humor: 0 },
    futureGoals: [],
    dealBreakers:[],
    pickiness:   60,
    preferredTags: [],
    dialogues: {
      greeting:       'Chào mọi người, em rất vui được tham gia chương trình!',
      acceptLight:    'Em quyết định bật đèn! Mong anh/chị cho em cơ hội!',
      refuseLight:    'Xin lỗi, em nghĩ chúng ta chưa thực sự hợp nhau.',
      hesitantLight:  'Em... em vẫn còn đang suy nghĩ lắm...',
      dealBreakerHit: 'Thật ra điều đó với em là rất quan trọng và khó bỏ qua.',
      highChemistry:  'Em cảm giác hôm nay có duyên với anh/chị thật!',
    },
  };
  return { ...defaults, ...overrides, personality: { ...defaults.personality, ...(overrides.personality || {}) } };
}

/** 6 NPC mẫu đa dạng để test và demo */
const SAMPLE_NPCS = [
  createNPC({
    id: 'npc_linh',
    name: 'Nguyễn Thị Linh',
    age: 24,
    job: 'Giáo viên tiểu học',
    hometown: 'Huế',
    hobbies: ['nấu ăn', 'đọc sách', 'nghe nhạc', 'cắm hoa'],
    coreValues: ['gia đình', 'trung thực', 'bình yên', 'trách nhiệm'],
    personality: { introvert: -1, romantic: 2, tradition: 1, humor: 0 },
    futureGoals: ['lập gia đình', 'có nhà riêng', 'nuôi con cái ngoan'],
    dealBreakers: ['nghiện game', 'không muốn có con', 'thiếu trung thực'],
    pickiness: 58,
    preferredTags: ['ổn định', 'hiền lành', 'chịu khó'],
    dialogues: {
      greeting:       'Dạ em chào mọi người! Em từ Huế vô nên còn hồi hộp lắm ạ hehe~',
      acceptLight:    'Em bật đèn! Em nghĩ chúng mình có nhiều điểm chung lắm đó!',
      refuseLight:    'Em xin lỗi... em chưa cảm thấy sẵn sàng. Mong anh tìm được người phù hợp hơn.',
      hesitantLight:  'Trời ơi em không biết nữa... tim em đang loạn hết rồi!',
      dealBreakerHit: 'Điều đó thật sự là rào cản lớn với em, em không thể không nghĩ đến...',
      highChemistry:  'Chú Tư ơi, em nghĩ hôm nay em bị mất hồn rồi chú ơi!',
    },
  }),
  createNPC({
    id: 'npc_minh',
    name: 'Trần Văn Minh',
    age: 28,
    job: 'Kỹ sư phần mềm',
    hometown: 'Đà Nẵng',
    hobbies: ['chạy bộ', 'du lịch', 'chơi nhạc cụ', 'cà phê sáng'],
    coreValues: ['tự do', 'phát triển bản thân', 'thành thật', 'tôn trọng'],
    personality: { introvert: 0, romantic: 1, tradition: -1, humor: 1 },
    futureGoals: ['du lịch khắp Đông Nam Á', 'khởi nghiệp', 'kết hôn muộn'],
    dealBreakers: ['kiểm soát quá mức', 'không có chí tiến thủ', 'thích ở nhà quá'],
    pickiness: 70,
    preferredTags: ['năng động', 'độc lập', 'thích khám phá'],
    dialogues: {
      greeting:       'Chào cả nhà! Anh đến đây với tâm thế khá thoải mái, không áp lực nha!',
      acceptLight:    'Bật đèn! Thẳng thắn mà nói, hôm nay anh thấy thật sự connected.',
      refuseLight:    'Xin lỗi nhé... anh nghĩ chúng ta có hướng đi khác nhau quá.',
      hesitantLight:  'Anh đang... cân nhắc đây. Cho anh 3 giây nữa nha!',
      dealBreakerHit: 'Anh khá coi trọng điều này, nếu không hợp thì khó lòng lắm.',
      highChemistry:  'Chị Mai ơi, hôm nay sao chị ghép hay vậy, anh thấy có gì đó rất đặc biệt!',
    },
  }),
  createNPC({
    id: 'npc_huong',
    name: 'Lê Thị Hương',
    age: 26,
    job: 'Bác sĩ nội trú',
    hometown: 'TP.HCM',
    hobbies: ['xem phim', 'yoga', 'nấu ăn healthy', 'thiện nguyện'],
    coreValues: ['sức khỏe', 'gia đình', 'cân bằng cuộc sống', 'yêu thương'],
    personality: { introvert: -1, romantic: 1, tradition: 0, humor: -1 },
    futureGoals: ['lấy chồng trước 30', 'mở phòng khám riêng', 'có 2 con'],
    dealBreakers: ['hút thuốc', 'uống rượu nhiều', 'không tôn trọng phụ nữ'],
    pickiness: 75,
    preferredTags: ['có trách nhiệm', 'lành mạnh', 'cởi mở'],
    dialogues: {
      greeting:       'Chào anh chị và khán giả! Em Hương, bác sĩ tương lai, hôm nay đến với hi vọng lớn!',
      acceptLight:    'Em bật đèn với tất cả sự chân thành của mình!',
      refuseLight:    'Em suy nghĩ kỹ rồi... và em nghĩ chưa phải lúc. Rất tiếc.',
      hesitantLight:  'Trời... đây là quyết định khó nhất từ hồi em học y đến giờ!',
      dealBreakerHit: 'Em làm trong ngành y nên sức khỏe là ưu tiên số một, điều này em không thể thỏa hiệp.',
      highChemistry:  'Chị Mai ơi, em hồi hộp như trước ca mổ đầu tiên vậy chị ơi!',
    },
  }),
  createNPC({
    id: 'npc_tuan',
    name: 'Phạm Quốc Tuấn',
    age: 30,
    job: 'Đầu bếp nhà hàng',
    hometown: 'Cần Thơ',
    hobbies: ['ẩm thực', 'câu cá', 'nghe bolero', 'làm vườn'],
    coreValues: ['gia đình', 'đơn giản', 'bình dị', 'thực tế'],
    personality: { introvert: -2, romantic: 0, tradition: 2, humor: 2 },
    futureGoals: ['mở quán ăn gia đình', 'về quê xây nhà', 'lập gia đình sớm'],
    dealBreakers: ['coi thường lao động chân tay', 'quá chú trọng vật chất', 'không thích miền Tây'],
    pickiness: 50,
    preferredTags: ['thực tế', 'giản dị', 'thích nấu ăn'],
    dialogues: {
      greeting:       'Chào bà con! Anh Tuấn đây, đến từ miền Tây sông nước! Cởi ra nha, đừng ngại!',
      acceptLight:    'Bật đèn liền! Anh thích rõ ràng, không ưa vòng vèo!',
      refuseLight:    'Thôi thật lòng mà nói, anh nghĩ chắc chưa hợp. Không sao, duyên số mà!',
      hesitantLight:  'Ờ... anh đang nghĩ... nè, anh cũng khó nói lắm!',
      dealBreakerHit: 'Anh người miền Tây, anh coi trọng sự mộc mạc, nếu không hợp cái này thì khó lắm nghe.',
      highChemistry:  'Chú Tư ơi, hôm nay chú mai mối hay quá trời, anh chịu liền!',
    },
  }),
  createNPC({
    id: 'npc_bich',
    name: 'Võ Thị Bích',
    age: 27,
    job: 'Marketing Manager',
    hometown: 'Hà Nội',
    hobbies: ['du lịch', 'mua sắm', 'chụp ảnh', 'bar & chill', 'gym'],
    coreValues: ['tự do', 'tham vọng', 'hiện đại', 'bình đẳng'],
    personality: { introvert: 2, romantic: -1, tradition: -2, humor: 1 },
    futureGoals: ['thăng tiến sự nghiệp', 'có thể không muốn con sớm', 'sống độc lập'],
    dealBreakers: ['tư tưởng gia trưởng', 'muốn vợ ở nhà', 'ganh tị với sự nghiệp của em'],
    pickiness: 80,
    preferredTags: ['thành đạt', 'hiện đại', 'tôn trọng bình đẳng'],
    dialogues: {
      greeting:       'Hi mọi người! Em đến đây với 50% hi vọng và 50% tò mò, thẳng thắn thế thôi!',
      acceptLight:    'Okay, em bật đèn — và tin em, em không dễ bật đâu nhé!',
      refuseLight:    'Sorry, em thấy chưa phù hợp. Em thẳng tính, hi vọng mọi người hiểu.',
      hesitantLight:  'Ugh, em ghét phải nói câu này... nhưng em thật sự chưa chắc.',
      dealBreakerHit: 'Em làm đến level manager rồi, bạn đời phải tôn trọng điều đó, không thương lượng được.',
      highChemistry:  'Chị Mai, chị thấy không, hôm nay em có vibe rồi đó!',
    },
  }),
  createNPC({
    id: 'npc_nam',
    name: 'Nguyễn Hoàng Nam',
    age: 29,
    job: 'Giảng viên đại học',
    hometown: 'Nha Trang',
    hobbies: ['đọc sách', 'cờ vua', 'chạy bộ', 'viết lách', 'nấu ăn'],
    coreValues: ['trí tuệ', 'trung thực', 'ổn định', 'phát triển', 'gia đình'],
    personality: { introvert: -1, romantic: 1, tradition: 0, humor: 0 },
    futureGoals: ['học tiến sĩ', 'xây dựng gia đình ấm cúng', 'đi dạy ở nước ngoài'],
    dealBreakers: ['thiếu tôn trọng học thức', 'nói dối', 'sống vô mục tiêu'],
    pickiness: 65,
    preferredTags: ['học vấn', 'mục tiêu', 'nghiêm túc'],
    dialogues: {
      greeting:       'Xin chào! Anh đến đây với tâm thế nghiêm túc tìm người bạn đời thực sự.',
      acceptLight:    'Anh bật đèn — và anh đã cân nhắc kỹ lưỡng trước khi làm vậy.',
      refuseLight:    'Anh xin lỗi... anh nghĩ chúng ta có những giá trị chưa thực sự tương đồng.',
      hesitantLight:  'Anh đang phân tích... đây là bài toán khó nhất anh gặp từ trước đến nay!',
      dealBreakerHit: 'Với anh, trí thức và sự thành thật là nền tảng, thiếu một trong hai rất khó tiếp tục.',
      highChemistry:  'Thú thật là anh không hay bày tỏ cảm xúc, nhưng hôm nay anh thấy rất khác.',
    },
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────

/** Kẹp giá trị trong [min, max] */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/** Số ngẫu nhiên [min, max] (bao gồm cả hai đầu, nguyên) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Số ngẫu nhiên [0, 1) */
const rand = () => Math.random();

/**
 * Đếm số phần tử chung giữa 2 mảng chuỗi (không phân biệt hoa/thường).
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
function countCommon(a, b) {
  const setB = new Set(b.map(x => x.toLowerCase()));
  return a.filter(x => setB.has(x.toLowerCase())).length;
}

/**
 * Tính độ tương đồng giữa 2 trục tính cách (mỗi trục −2..+2).
 * Kết quả là điểm trong [0, 1].
 * @param {PersonalityAxes} p1
 * @param {PersonalityAxes} p2
 * @returns {number}
 */
function personalitySimilarity(p1, p2) {
  const axes = ['introvert', 'romantic', 'tradition', 'humor'];
  const maxDiffPerAxis = 4; // |−2 − (+2)| = 4
  const totalMaxDiff = maxDiffPerAxis * axes.length;
  const totalDiff = axes.reduce((sum, ax) => sum + Math.abs((p1[ax] || 0) - (p2[ax] || 0)), 0);
  return 1 - totalDiff / totalMaxDiff;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE TÍNH ĐIỂM TƯƠNG THÍCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính toàn bộ điểm tương thích giữa người chơi và NPC.
 *
 * @param {NPC}            npc
 * @param {PlayerProfile}  player
 * @param {number}         affinityBonus - Điểm thưởng từ hảo cảm (0–20), do màn trò chuyện tích lũy
 * @returns {MatchResult}
 */
function calcCompatibility(npc, player, affinityBonus = 0) {
  const breakdown = {};

  // ── 1. Sở thích chung ────────────────────────────────────────────────────
  const sharedHobbies = countCommon(npc.hobbies, player.hobbies);
  const maxHobbies    = Math.max(npc.hobbies.length, player.hobbies.length, 1);
  const hobbyRatio    = sharedHobbies / maxHobbies; // 0..1
  breakdown.hobbies   = Math.round(hobbyRatio * WEIGHTS.hobbies);

  // ── 2. Giá trị sống ──────────────────────────────────────────────────────
  const sharedValues  = countCommon(npc.coreValues, player.coreValues);
  const maxValues     = Math.max(npc.coreValues.length, player.coreValues.length, 1);
  const valueRatio    = sharedValues / maxValues;
  breakdown.values    = Math.round(valueRatio * WEIGHTS.values);

  // ── 3. Tính cách ─────────────────────────────────────────────────────────
  const pSim              = personalitySimilarity(npc.personality, player.personality);
  breakdown.personality   = Math.round(pSim * WEIGHTS.personality);

  // ── 4. Kỳ vọng tương lai ────────────────────────────────────────────────
  const sharedFuture  = countCommon(npc.futureGoals, player.futureGoals);
  const maxFuture     = Math.max(npc.futureGoals.length, player.futureGoals.length, 1);
  const futureRatio   = sharedFuture / maxFuture;
  breakdown.future    = Math.round(futureRatio * WEIGHTS.future);

  // ── 5. Chemistry (ngẫu nhiên có biên độ) ─────────────────────────────────
  // Phân phối: trung tâm ở 50% weight, lệch ±40%
  const chemBase          = WEIGHTS.chemistry * 0.5;
  const chemVariance      = WEIGHTS.chemistry * 0.4;
  const chemRaw           = chemBase + (rand() * 2 - 1) * chemVariance;
  breakdown.chemistry     = Math.round(clamp(chemRaw, 0, WEIGHTS.chemistry));

  // ── 6. Thưởng hảo cảm từ hội thoại ──────────────────────────────────────
  breakdown.affinity      = clamp(Math.round(affinityBonus), 0, 20);

  // ── 7. Kiểm tra deal-breaker ─────────────────────────────────────────────
  const hitDealBreakers = npc.dealBreakers.filter(db =>
    player.chosenTags.some(tag => tag.toLowerCase() === db.toLowerCase()) ||
    player.hobbies.some(h => h.toLowerCase().includes(db.toLowerCase()))
  );
  const dealBreakerHit = hitDealBreakers.length > 0;
  breakdown.dealBreakerPenalty = dealBreakerHit ? -DEAL_BREAKER_PENALTY : 0;

  // ── 8. Thưởng tag gu ─────────────────────────────────────────────────────
  const sharedPreferred   = countCommon(npc.preferredTags, player.chosenTags || []);
  breakdown.preferredTags = Math.min(sharedPreferred * 4, 10); // tối đa 10 điểm thưởng

  // ── Tổng ─────────────────────────────────────────────────────────────────
  const raw = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const totalScore = clamp(Math.round(raw), SCORE_MIN, SCORE_MAX);

  return { totalScore, breakdown, dealBreakerHit, hitDealBreakers };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUẢN LÝ THANH HẢO CẢM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo object quản lý thanh hảo cảm trong một tập chơi.
 * Hảo cảm thay đổi theo câu trả lời của người chơi (gọi updateAffinity()).
 *
 * @param {NPC} npc - NPC đang tương tác
 * @returns {AffinityTracker}
 */
function createAffinityTracker(npc) {
  let current = 0;      // Điểm hảo cảm tích lũy: 0–20
  const history = [];   // Log từng lần cập nhật

  /**
   * Danh sách tùy chọn trả lời mẫu và ảnh hưởng điểm hảo cảm.
   * Trong game thực, danh sách này lấy từ questions.js.
   * @type {AnswerOption[]}
   * @typedef {Object} AnswerOption
   * @property {string} text
   * @property {number} delta   - Thay đổi điểm hảo cảm (âm = giảm)
   * @property {string[]} tags  - Tags hành vi (ảnh hưởng chemistry log)
   */

  return {
    /** Điểm hảo cảm hiện tại (0–20) */
    get value() { return current; },

    /** Phần trăm thanh hảo cảm (0–100%) */
    get percent() { return Math.round((current / 20) * 100); },

    /** Toàn bộ lịch sử thay đổi */
    get log() { return [...history]; },

    /**
     * Cập nhật điểm hảo cảm sau khi người chơi chọn một câu trả lời.
     * @param {number} delta        - Thay đổi điểm (có thể âm)
     * @param {string} reason       - Mô tả ngắn gọn lý do (để log & UI)
     * @param {string} [mcComment]  - Lời bình của MC kèm theo
     * @returns {{ current: number, delta: number, reason: string, mcComment: string }}
     */
    updateAffinity(delta, reason = '', mcComment = '') {
      const before = current;
      current = clamp(current + delta, 0, 20);
      const entry = {
        before,
        after:    current,
        delta:    current - before,
        reason,
        mcComment,
        timestamp: Date.now(),
      };
      history.push(entry);
      return entry;
    },

    /**
     * Reset hảo cảm (dùng khi bắt đầu tập mới với NPC khác).
     */
    reset() {
      current = 0;
      history.length = 0;
    },

    /** Nhận xét tổng thể về chuỗi hảo cảm để hiển thị sau tập */
    summary() {
      if (current >= 16) return { level: 'rực rỡ',    emoji: '🌹', text: 'Hảo cảm bùng cháy dữ dội!' };
      if (current >= 11) return { level: 'tốt',       emoji: '😊', text: 'Hai bạn có nhiều duyên cớ.' };
      if (current >= 6)  return { level: 'bình thường', emoji: '😐', text: 'Chưa thực sự nổi bật.' };
      return                     { level: 'lạnh nhạt', emoji: '🥶', text: 'Hầu như chưa có giao thoa.' };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CƠ CHẾ BẬT/TẮT ĐÈN CỦA NPC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Xác định quyết định bật/tắt đèn của NPC dựa trên tổng điểm.
 * Bao gồm cơ chế do dự, đổi ý và deal-breaker override.
 *
 * @param {NPC}    npc
 * @param {number} totalScore       - Điểm tương thích 0–100
 * @param {boolean} dealBreakerHit  - Có vi phạm deal-breaker không
 * @returns {{ decision: LightDecision, lightOn: boolean, dialogue: string, changedMind: boolean }}
 */
function npcLightDecision(npc, totalScore, dealBreakerHit) {
  // Deal-breaker luôn ghi đè — NPC tắt đèn dù điểm bao nhiêu
  if (dealBreakerHit) {
    return {
      decision:    'refused',
      lightOn:     false,
      dialogue:    npc.dialogues.dealBreakerHit,
      changedMind: false,
    };
  }

  // Điều chỉnh ngưỡng theo độ khó tính của NPC:
  // pickiness 60 = ngưỡng chuẩn, mỗi +5 trên/dưới 60 dịch ngưỡng ±2
  const delta = Math.round(((npc.pickiness - 60) / 5) * 2);
  const thresholdConfirm  = LIGHT_THRESHOLDS.confirmed + delta;
  const thresholdHesitant = LIGHT_THRESHOLDS.hesitant  + delta;

  /** @type {LightDecision} */
  let decision;
  /** @type {boolean} */
  let lightOn;

  if (totalScore >= thresholdConfirm) {
    decision = 'confirmed';
    lightOn  = true;
  } else if (totalScore >= thresholdHesitant) {
    decision = 'hesitant';
    // Xác suất bật đèn tuyến tính trong vùng lưỡng lự
    const range      = thresholdConfirm - thresholdHesitant;
    const progress   = (totalScore - thresholdHesitant) / range;
    const prob       = HESITANT_PROB_MIN + progress * (HESITANT_PROB_MAX - HESITANT_PROB_MIN);
    lightOn          = rand() < prob;
  } else {
    decision = 'refused';
    lightOn  = false;
  }

  // Cơ chế "đổi ý" (drama) — xác suất nhỏ đảo ngược quyết định
  const changedMind = rand() < CHANGE_MIND_PROB;
  if (changedMind) {
    lightOn = !lightOn;
  }

  // Chọn thoại phù hợp
  let dialogue;
  if (!lightOn) {
    dialogue = npc.dialogues.refuseLight;
  } else if (decision === 'hesitant') {
    dialogue = changedMind
      ? npc.dialogues.acceptLight  // đổi ý → bật
      : npc.dialogues.hesitantLight;
  } else {
    dialogue = npc.dialogues.acceptLight;
  }

  if (totalScore >= 85 && lightOn) dialogue = npc.dialogues.highChemistry + ' ' + npc.dialogues.acceptLight;

  return { decision, lightOn, dialogue, changedMind };
}

// ─────────────────────────────────────────────────────────────────────────────
// LỜI BÌNH CỦA MC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo lời bình của Chú Tư Duyên và Chị Mai Hạnh theo kết quả tập.
 * @param {number}  totalScore
 * @param {boolean} playerLightOn
 * @param {boolean} npcLightOn
 * @param {boolean} dealBreakerHit
 * @returns {{ tuDuyen: string, maiHanh: string }}
 */
function getMCComments(totalScore, playerLightOn, npcLightOn, dealBreakerHit) {
  const bothOn   = playerLightOn && npcLightOn;
  const noneOn   = !playerLightOn && !npcLightOn;
  const onlyPlayer = playerLightOn && !npcLightOn;
  const onlyNPC    = !playerLightOn && npcLightOn;

  if (dealBreakerHit) {
    return {
      tuDuyen:  '🎤 Chú Tư: Ối trời ơi! Trật chìa rồi bà con ơi! Có điều "không thể thương lượng" xuất hiện kìa!',
      maiHanh:  '🌸 Mai Hạnh: Mình vẫn tin rằng mỗi cuộc gặp gỡ là một bài học quý. Cảm ơn hai bạn đã dũng cảm!',
    };
  }
  if (bothOn) {
    if (totalScore >= 80) {
      return {
        tuDuyen:  '🎤 Chú Tư: TRỜI ĐẤT ƠI! Ghép đôi hoàn hảo! Chú mà không khóc là chú không phải người!',
        maiHanh:  '🌸 Mai Hạnh: Chúc mừng hai bạn! Duyên trời se thật rồi đây — mình tin hai bạn sẽ hạnh phúc!',
      };
    }
    return {
      tuDuyen:  '🎤 Chú Tư: Ây ya! Cả hai cùng bật đèn! Chú Tư hôm nay làm ăn được rồi! Bà con vỗ tay nào!',
      maiHanh:  '🌸 Mai Hạnh: Thật tuyệt vời! Hẹn hò thành công! Mình chúc hai bạn có những kỷ niệm đẹp bên nhau nhé!',
    };
  }
  if (noneOn) {
    return {
      tuDuyen:  '🎤 Chú Tư: Ờ thôi... hai bạn văn minh quá, ai cũng lịch sự không bật đèn. Hẹn tập sau nhen!',
      maiHanh:  '🌸 Mai Hạnh: Không sao cả, duyên chưa đến thì mình chờ. Cảm ơn hai bạn đã thành thật với chính mình!',
    };
  }
  if (onlyPlayer) {
    return {
      tuDuyen:  '🎤 Chú Tư: Ối! Người chơi bật đèn rồi mà NPC lại tắt! Khán giả thấy tim anh vỡ chưa?!',
      maiHanh:  '🌸 Mai Hạnh: Đừng buồn nhé bạn, can đảm bật đèn là điều đáng trân trọng lắm rồi!',
    };
  }
  // onlyNPC
  return {
    tuDuyen:  '🎤 Chú Tư: Trời ơi NPC bật đèn mà người chơi lại tắt! Chú Tư xỉu giúp không được!',
    maiHanh:  '🌸 Mai Hạnh: Hành trình tìm kiếm tình yêu cần thời gian, bạn ơi. Mình ủng hộ quyết định của bạn!',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH ENGINE — LỚP ĐIỀU PHỐI CHÍNH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MatchEngine điều phối toàn bộ một tập chơi:
 * khởi tạo, cập nhật hảo cảm theo màn hình, và tính kết quả cuối.
 *
 * @example
 * const engine = new MatchEngine(SAMPLE_NPCS[0], playerProfile);
 * engine.updateAffinity(+5, 'Chọn câu hỏi thú vị qua rèm');
 * engine.updateAffinity(-3, 'Nhắc đến điều NPC không thích');
 * const result = engine.finalize(playerLightOn);
 * console.log(result);
 */
class MatchEngine {
  /**
   * @param {NPC}           npc
   * @param {PlayerProfile} player
   */
  constructor(npc, player) {
    this.npc     = npc;
    this.player  = player;
    this.tracker = createAffinityTracker(npc);
    this._finalized = false;
  }

  /** Điểm hảo cảm hiện tại (0–20) */
  get affinityValue()   { return this.tracker.value; }

  /** Phần trăm thanh hảo cảm */
  get affinityPercent() { return this.tracker.percent; }

  /**
   * Cập nhật hảo cảm sau một lựa chọn của người chơi.
   * @param {number} delta
   * @param {string} reason
   * @param {string} [mcComment]
   */
  updateAffinity(delta, reason, mcComment = '') {
    if (this._finalized) {
      console.warn('[MatchEngine] Tập đã kết thúc, không cập nhật hảo cảm thêm được.');
      return null;
    }
    return this.tracker.updateAffinity(delta, reason, mcComment);
  }

  /**
   * Kết thúc tập chơi và trả về MatchResult đầy đủ.
   * @param {boolean} playerLightOn - Người chơi có bật đèn không
   * @returns {MatchResult & { npcLightOn: boolean, bothOn: boolean, mcComments: Object, affinitySummary: Object }}
   */
  finalize(playerLightOn) {
    if (this._finalized) {
      console.warn('[MatchEngine] Tập đã được finalize rồi.');
      return this._lastResult;
    }
    this._finalized = true;

    // Tính điểm tương thích
    const { totalScore, breakdown, dealBreakerHit, hitDealBreakers } =
      calcCompatibility(this.npc, this.player, this.tracker.value);

    // Quyết định của NPC
    const { decision, lightOn: npcLightOn, dialogue: npcDialogue, changedMind } =
      npcLightDecision(this.npc, totalScore, dealBreakerHit);

    // Lời bình MC
    const mcComments = getMCComments(totalScore, playerLightOn, npcLightOn, dealBreakerHit);

    this._lastResult = {
      // ── Điểm ──────────────────────────────────────────────────────────────
      totalScore,
      breakdown,
      dealBreakerHit,
      hitDealBreakers,

      // ── Quyết định ────────────────────────────────────────────────────────
      playerLightOn,
      npcDecisionRaw: decision,
      npcLightOn,
      npcChangedMind: changedMind,
      bothOn:         playerLightOn && npcLightOn,

      // ── Thoại ─────────────────────────────────────────────────────────────
      npcDialogue,
      mcComments,

      // ── Hảo cảm ───────────────────────────────────────────────────────────
      affinityLog:     this.tracker.log,
      affinitySummary: this.tracker.summary(),
    };

    return this._lastResult;
  }

  /** Xuất trạng thái hiện tại để lưu vào localStorage (mid-session save) */
  toSaveState() {
    return {
      npcId:         this.npc.id,
      affinityValue: this.tracker.value,
      affinityLog:   this.tracker.log,
      finalized:     this._finalized,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HÀM TEST NHANH TRONG CONSOLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chạy một tập ghép đôi nhanh trong console.
 * @param {Partial<PlayerProfile>} [playerOverride]
 * @param {string}                 [npcId]           - ID NPC (mặc định: ngẫu nhiên)
 * @param {boolean}                [playerLightOn]   - Mặc định: ngẫu nhiên
 */
function runQuickTest(playerOverride = {}, npcId = null, playerLightOn = null) {
  console.group('🎬 BMHH Quick Test');

  // Chọn NPC
  const npc = npcId
    ? SAMPLE_NPCS.find(n => n.id === npcId) || SAMPLE_NPCS[0]
    : SAMPLE_NPCS[randInt(0, SAMPLE_NPCS.length - 1)];

  // Người chơi mặc định
  const player = {
    name:        'Người chơi test',
    age:          26,
    hobbies:     ['đọc sách', 'nấu ăn', 'du lịch'],
    coreValues:  ['gia đình', 'trung thực', 'tự do'],
    personality: { introvert: 0, romantic: 1, tradition: 0, humor: 1 },
    futureGoals: ['lập gia đình', 'ổn định công việc'],
    chosenTags:  ['hiền lành', 'thực tế', 'năng động'],
    ...playerOverride,
  };

  console.log(`👤 NPC: ${npc.name} (${npc.job}, ${npc.hometown})`);
  console.log(`🎮 Người chơi: ${player.name}`);

  // Khởi tạo engine
  const engine = new MatchEngine(npc, player);

  // Giả lập 5 lượt tương tác qua rèm
  const interactions = [
    { delta: +4,  reason: 'Hỏi câu hỏi trúng sở thích NPC',           mcComment: 'Chú Tư: Ừa câu này hay đó!' },
    { delta: +3,  reason: 'Trả lời về gia đình rất chân thành',        mcComment: 'Chị Mai: Thật xúc động!' },
    { delta: -2,  reason: 'Lỡ nói điều NPC không thích',              mcComment: 'Chú Tư: Ối, trật rồi bạn ơi!' },
    { delta: +5,  reason: 'Món quà tặng trùng gu NPC',                mcComment: 'Chị Mai: Duyên số mà!' },
    { delta: +2,  reason: 'Câu trả lời tình huống tài chính khéo léo', mcComment: 'Chú Tư: Khôn vừa vừa thôi nhen!' },
  ];

  console.log('\n📊 Diễn biến hảo cảm:');
  interactions.forEach((intr, i) => {
    const update = engine.updateAffinity(intr.delta, intr.reason, intr.mcComment);
    console.log(
      `  Lượt ${i + 1}: ${intr.delta > 0 ? '+' : ''}${intr.delta} → ${update.after}/20`,
      `| ${intr.reason}`
    );
  });

  console.log(`\n❤️  Hảo cảm cuối: ${engine.affinityValue}/20 (${engine.affinityPercent}%)`);

  // Người chơi quyết định
  const pLight = playerLightOn !== null ? playerLightOn : rand() > 0.4;
  console.log(`\n💡 Người chơi: ${pLight ? '✅ BẬT ĐÈN' : '❌ TẮT ĐÈN'}`);

  // Kết quả
  const result = engine.finalize(pLight);

  console.log('\n🎯 KẾT QUẢ TẬP PHÁT SÓNG:');
  console.table({
    'Điểm Sở thích':     result.breakdown.hobbies,
    'Điểm Giá trị sống': result.breakdown.values,
    'Điểm Tính cách':    result.breakdown.personality,
    'Điểm Kỳ vọng':      result.breakdown.future,
    'Chemistry':         result.breakdown.chemistry,
    'Hảo cảm':           result.breakdown.affinity,
    'Tag gu':            result.breakdown.preferredTags,
    'Deal-breaker':      result.breakdown.dealBreakerPenalty,
    'TỔNG':              result.totalScore,
  });

  if (result.dealBreakerHit) {
    console.warn(`💥 Deal-breaker: ${result.hitDealBreakers.join(', ')}`);
  }

  console.log(`\n🔮 NPC: ${result.npcLightOn ? '✅ BẬT ĐÈN' : '❌ TẮT ĐÈN'}`,
    result.npcChangedMind ? '(⚡ Đổi ý phút chót!)' : '');
  console.log(`💬 "${result.npcDialogue}"`);

  const outcome = result.bothOn ? '💑 GHÉP ĐÔI THÀNH CÔNG!'
    : result.playerLightOn && !result.npcLightOn ? '💔 Chỉ người chơi bật đèn'
    : !result.playerLightOn && result.npcLightOn  ? '😮 Chỉ NPC bật đèn'
    : '🤝 Cả hai tắt đèn lịch sự';
  console.log(`\n🏆 ${outcome}`);

  console.log(`\n${result.mcComments.tuDuyen}`);
  console.log(`${result.mcComments.maiHanh}`);
  console.log(`\n${result.affinitySummary.emoji} Hảo cảm: ${result.affinitySummary.text}`);

  console.groupEnd();
  return result;
}

/**
 * Chạy toàn bộ 6 NPC mẫu và in bảng tổng kết.
 */
function runFullTest() {
  console.group('🎪 BMHH Full Test — 6 NPC');
  const player = {
    name:        'Nguyễn Test',
    age:          26,
    hobbies:     ['đọc sách', 'nấu ăn', 'du lịch', 'chạy bộ'],
    coreValues:  ['gia đình', 'trung thực', 'ổn định'],
    personality: { introvert: -1, romantic: 1, tradition: 0, humor: 1 },
    futureGoals: ['lập gia đình', 'có nhà riêng'],
    chosenTags:  ['hiền lành', 'thực tế', 'có trách nhiệm'],
  };

  const summary = SAMPLE_NPCS.map(npc => {
    const engine = new MatchEngine(npc, player);
    engine.updateAffinity(randInt(0, 8), 'Hội thoại mô phỏng');
    const result = engine.finalize(rand() > 0.4);
    return {
      NPC:            npc.name,
      Điểm:           result.totalScore,
      'NPC bật đèn':  result.npcLightOn ? '✅' : '❌',
      'Người chơi':   result.playerLightOn ? '✅' : '❌',
      'Kết quả':      result.bothOn ? '💑 Ghép đôi' : '—',
      'Deal-breaker': result.dealBreakerHit ? '💥' : '',
    };
  });

  console.table(summary);
  console.groupEnd();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT (ES Module & browser global)
// ─────────────────────────────────────────────────────────────────────────────

// ES Module export
export {
  // Dữ liệu
  SAMPLE_NPCS,
  WEIGHTS,
  LIGHT_THRESHOLDS,

  // Factory & utilities
  createNPC,
  createAffinityTracker,
  countCommon,
  personalitySimilarity,

  // Core logic
  calcCompatibility,
  npcLightDecision,
  getMCComments,

  // Engine chính
  MatchEngine,

  // Test
  runQuickTest,
  runFullTest,
};

// Browser global (khi load bằng <script> thường, không phải module)
if (typeof window !== 'undefined') {
  window.BMHHMatch = {
    SAMPLE_NPCS,
    createNPC,
    createAffinityTracker,
    calcCompatibility,
    npcLightDecision,
    getMCComments,
    MatchEngine,
  };

  // Shortcut test trong console
  window.BMHHTest = {
    quick:  (overrides, npcId, light) => runQuickTest(overrides, npcId, light),
    full:   ()                        => runFullTest(),
    runAll: () => { runFullTest(); return runQuickTest(); },
  };

  console.info(
    '%c🌹 BMHH match.js loaded!\n' +
    '%cGọi BMHHTest.quick() để test 1 tập, BMHHTest.full() để test tất cả NPC.',
    'font-size:14px;color:#e91e8c;font-weight:bold;',
    'font-size:12px;color:#666;'
  );
}
