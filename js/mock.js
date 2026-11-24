/**
 * mock.js — Dữ liệu giả lập cho khung game Bạn Muốn Hẹn Hò
 * Bổ sung chỉ số tính cách, giá trị sống và câu hỏi tương tác chi tiết.
 */

// 6 khách mời đại diện cho các tính cách và vùng miền khác nhau
const MOCK_GUESTS = [
  {
    id: "npc_1",
    name: "Nguyễn Thị Linh",
    age: 24,
    gender: "Nữ",
    job: "Giáo viên tiểu học",
    hometown: "Huế",
    avatar: "👩‍🏫",
    tagline: "Cô giáo xứ Huế hiền thục, tìm bến đỗ bình yên",
    hobbies: ["Nấu ăn", "Đọc sách", "Cắm hoa", "Nghe nhạc Trịnh"],
    personality: "Dịu dàng, truyền thống, chu đáo",
    idealType: "Chàng trai chân thành, yêu thương gia đình, có chí tiến thủ",
    dealBreaker: "Nghiện game, gia trưởng",
    // Các chỉ số nhân vật (thang điểm 0 - 100)
    stats: {
      romance: 85,      // Lãng mạn
      tradition: 90,    // Truyền thống
      practicality: 70, // Thực tế
      humor: 50         // Hài hước
    },
    pickiness: 60, // Độ khó tính khi bấm nút (60/100)
    greeting: "Dạ em chào chú Tư, chị Mai Hạnh và anh bên kia rèm. Em run quá à..."
  },
  {
    id: "npc_2",
    name: "Trần Văn Minh",
    age: 28,
    gender: "Nam",
    job: "Kỹ sư phần mềm",
    hometown: "Đà Nẵng",
    avatar: "👨‍💻",
    tagline: "Lập trình viên đam mê xê dịch, sống tích cực",
    hobbies: ["Chạy bộ", "Chơi guitar", "Du lịch bụi", "Cà phê sáng"],
    personality: "Hài hước, năng động, cởi mở",
    idealType: "Cô gái tự tin, yêu đời và thích cùng nhau đi khám phá",
    dealBreaker: "Kiểm soát quá mức, thụ động",
    stats: {
      romance: 75,
      tradition: 40,
      practicality: 80,
      humor: 90
    },
    pickiness: 65,
    greeting: "Chào hai MC và bạn gái xinh đẹp bên kia rèm! Anh sẵn sàng rồi nha!"
  },
  {
    id: "npc_3",
    name: "Lê Thị Hương",
    age: 26,
    gender: "Nữ",
    job: "Bác sĩ nội trú",
    hometown: "TP.HCM",
    avatar: "👩‍⚕️",
    tagline: "Nữ bác sĩ trẻ giàu tình thương, hướng về tương lai",
    hobbies: ["Yoga", "Nấu ăn healthy", "Tình nguyện", "Xem phim tài liệu"],
    personality: "Điềm tĩnh, chín chắn, thấu cảm",
    idealType: "Người đàn ông biết lắng nghe, sống lành mạnh và có trách nhiệm",
    dealBreaker: "Hút thuốc, bê tha nhậu nhẹt",
    stats: {
      romance: 70,
      tradition: 65,
      practicality: 90,
      humor: 60
    },
    pickiness: 75,
    greeting: "Chào mọi người ạ! Hương hy vọng hôm nay sẽ tìm được tri kỷ cùng tần số."
  },
  {
    id: "npc_4",
    name: "Phạm Quốc Tuấn",
    age: 30,
    gender: "Nam",
    job: "Đầu bếp nhà hàng",
    hometown: "Cần Thơ",
    avatar: "👨‍🍳",
    tagline: "Trai miền Tây thiệt thà, nấu ăn ngon hết sẩy",
    hobbies: ["Ẩm thực Nam Bộ", "Câu cá", "Nghe bolero", "Làm vườn"],
    personality: "Mộc mạc, thật thà, hào sảng",
    idealType: "Bạn nữ giản dị, biết vun vén, chịu thương chịu khó",
    dealBreaker: "Chê bai miền Tây, coi thường lao động",
    stats: {
      romance: 60,
      tradition: 85,
      practicality: 85,
      humor: 80
    },
    pickiness: 50,
    greeting: "Dạ Tuấn chào chú Tư, chị Hạnh! Anh đem cả tấm lòng miền Tây lên đây nè!"
  },
  {
    id: "npc_5",
    name: "Võ Thị Bích",
    age: 27,
    gender: "Nữ",
    job: "Marketing Manager",
    hometown: "Hà Nội",
    avatar: "👩‍💼",
    tagline: "Quý cô hiện đại, độc lập và bản lĩnh",
    hobbies: ["Tập gym", "Du lịch quốc tế", "Thời trang", "Đọc sách kinh doanh"],
    personality: "Tự tin, quyết đoán, sắc sảo",
    idealType: "Bạn nam có sự nghiệp vững vàng, tư duy cởi mở và tôn trọng bạn đời",
    dealBreaker: "Tư tưởng gia trưởng, an phận thủ thường",
    stats: {
      romance: 65,
      tradition: 30,
      practicality: 95,
      humor: 75
    },
    pickiness: 80,
    greeting: "Hi mọi người! Em Bích đây, mong hôm nay sẽ gặp được một người đủ thú vị."
  },
  {
    id: "npc_6",
    name: "Nguyễn Hoàng Nam",
    age: 29,
    gender: "Nam",
    job: "Giảng viên đại học",
    hometown: "Nha Trang",
    avatar: "👨‍🏫",
    tagline: "Thầy giáo trẻ thích cuộc sống bình dị và tri thức",
    hobbies: ["Chơi cờ vua", "Viết lách", "Chạy bộ", "Pha trà đạo"],
    personality: "Tri thức, ân cần, nghiêm túc",
    idealType: "Cô gái dịu dàng, coi trọng học vấn và sự chung thủy",
    dealBreaker: "Thiếu trung thực, không tôn trọng tri thức",
    stats: {
      romance: 80,
      tradition: 70,
      practicality: 75,
      humor: 60
    },
    pickiness: 65,
    greeting: "Xin chào hai MC và bạn gái. Rất mong có được một cuộc gặp gỡ ý nghĩa."
  }
];

// Lời dẫn mẫu của 2 MC cho các vòng
const MOCK_MC_LINES = {
  round1: {
    tuDuyen: "Bà con ơi! Chú Tư Duyên chào mừng mọi người tới Bạn Muốn Hẹn Hò! Hôm nay có khách quý mở hàng nha!",
    maiHanh: "Mai Hạnh xin chào quý khán giả! Tấm rèm đỏ thân thương hôm nay sẽ lại se duyên cho hai trái tim mới nè."
  },
  round2: {
    tuDuyen: "Hai đứa cứ thoải mái hỏi xoáy đáp xoay nha, đừng ngại chú Tư đứng đây dòm ngó nghen!",
    maiHanh: "Đúng rồi đó, hãy hỏi những câu chuyện về cuộc sống, quan niệm hôn nhân để xem có hợp nhau không nhé."
  },
  round3: {
    tuDuyen: "MỘT... HAI... BA... KÉO RÈM! Trời đất ơi đẹp đôi xuất sắc luôn bà con ơi!",
    maiHanh: "Khoảnh khắc được mong chờ nhất đây rồi! Hai bạn hãy bước tới tặng quà và nhìn vào mắt nhau nào."
  },
  round4: {
    tuDuyen: "Tới giờ G rồi! Đặt tay lên nút bấm! Suy nghĩ cho kỹ, 3 giây định mệnh bắt đầu!",
    maiHanh: "Nếu cảm nhận được sự rung động từ con tim, hai bạn đừng ngần ngại trao nhau cơ hội nhé."
  },
  // 4 kết cục
  endings: {
    both_on: {
      badge: "GHÉP ĐÔI THÀNH CÔNG",
      title: "TRÁI TIM ĐÃ CÙNG CHUNG NHỊP ĐẬP!",
      icon: "🎉",
      tuDuyen: "🎤 Chú Tư: TRỜI ĐẤT ƠI BẬT ĐÈN RỒI! Đẹp đôi quá trời đẹp đôi rồi hai đứa ơi! Chú Tư có thiệp cưới ăn nữa rồi bà con ơi!",
      maiHanh: "🌸 Mai Hạnh: Chúc mừng hai bạn! Trái tim đã tìm thấy nhau rồi, Mai Hạnh tin sự chân thành hôm nay sẽ đơm hoa kết trái!"
    },
    player_only: {
      badge: "TRẬT CHÌA PHÚT CHÓT",
      title: "ANH RẤT TỐT NHƯNG EM RẤT TIẾC...",
      icon: "💔",
      tuDuyen: "🎤 Chú Tư: Ối giời ơi! Người chơi bấm đèn cái rụp mà khách mời lại bẽn lẽn tắt đèn! Khán giả thấy đau lòng giùm chưa nè!",
      maiHanh: "🌸 Mai Hạnh: Đừng buồn nhé bạn ơi! Bạn đã rất dũng cảm và chân thật với tình cảm của mình rồi. Duyên lành còn chờ ở phía trước nha!"
    },
    guest_only: {
      badge: "BỎ LỠ LƯƠNG DUYÊN",
      title: "NGƯỜI TÍNH KHÔNG BẰNG DUYÊN TRỜI",
      icon: "😮",
      tuDuyen: "🎤 Chú Tư: Trời ơi là trời! Khách mời bấm đèn rạng rỡ mà người chơi lại tắt cái phụt! Chú Tư đứng hình 5 giây luôn!",
      maiHanh: "🌸 Mai Hạnh: Cảm ơn bạn đã thẳng thắn và không gượng ép cảm xúc. Tình yêu cần sự đồng điệu trọn vẹn từ cả hai phía mà."
    },
    both_off: {
      badge: "TÌNH BẠN TRƯỜNG TỒN",
      title: "VĂN MINH LÀM BẠN TỐT NHA!",
      icon: "🤝",
      tuDuyen: "🎤 Chú Tư: Dạ thưa hai bạn văn minh quá chừng, giữ đèn tắt trong êm đẹp! Không thành đôi thì thành bạn tốt, mai rủ đi cà phê nha!",
      maiHanh: "🌸 Mai Hạnh: Đúng vậy, một cái bắt tay hữu nghị văn minh cũng là một cái kết rất đẹp trên sân khấu hôm nay."
    }
  }
};

// Câu hỏi vòng hỏi đáp kèm điểm biến động hảo cảm
const MOCK_QUESTIONS = [
  {
    id: "q1",
    question: "Sau giờ làm việc hoặc vào ngày cuối tuần, bạn thích dành thời gian làm gì nhất?",
    options: [
      { text: "Ở nhà nấu một bữa ăn ấm cúng và nghe nhạc thư giãn", delta: 18, mc: "Ấm áp quá chừng!" },
      { text: "Ra ngoài gặp gỡ bạn bè, dạo phố và thử quán cà phê mới", delta: 12, mc: "Năng động và cởi mở nè!" },
      { text: "Xách ba lô lên đi phượt khám phá địa điểm mới", delta: 15, mc: "Thích phiêu lưu ghê ta!" },
      { text: "Chỉ nằm lướt điện thoại một mình trong phòng cả ngày", delta: -10, mc: "Ủa sao thụ động vậy bạn ơi?!" }
    ]
  },
  {
    id: "q2",
    question: "Trong hôn nhân, quan điểm của bạn về việc chia sẻ việc nhà và tài chính thế nào?",
    options: [
      { text: "Vợ chồng cùng làm việc nhà, cùng đóng góp quỹ chung minh bạch", delta: 20, mc: "Bình đẳng và văn minh!" },
      { text: "Ai giỏi kiếm tiền thì lo kinh tế, người kia quán xuyến nhà cửa", delta: 10, mc: "Phân công rõ ràng đó!" },
      { text: "Tiền ai nấy giữ, việc nhà khoán hết cho phụ nữ làm", delta: -25, mc: "Trời ơi tư tưởng cổ hủ quá!" },
      { text: "Linh hoạt hỗ trợ nhau, mệt thì ra ngoài ăn tiệm cho khỏe", delta: 15, mc: "Tâm lý hết sẩy luôn!" }
    ]
  }
];
