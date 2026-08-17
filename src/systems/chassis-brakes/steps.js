/**
 * steps.js — Trình tự tháo khung, treo và phanh (lắp lại = chạy ngược).
 *
 * Sắp theo thứ tự làm thật: bảo dưỡng phanh và sên trước (việc thường xuyên), rồi
 * mới tới bánh xe, treo, và cuối cùng là cụm lái.
 */

export const STEPS = [
  {
    title: 'ĐO TRƯỚC KHI THÁO: độ võng sên và độ lún treo',
    detail: 'Ba số đo khi xe còn nguyên: (1) độ võng sên ở GIỮA NHỊP, đo với xe đứng trên bánh và '
      + 'có người ngồi; (2) độ lún tĩnh trước và sau — chênh lệch giữa lúc kê bánh không tải và '
      + 'lúc có người ngồi; (3) độ rơ bạc cổ, bằng cách kê bánh trước lên và lắc càng theo chiều '
      + 'trước–sau.',
    tool: 'Thước lá dài · dây rút làm mốc',
    warn: 'Độ võng sên phải đo ở đúng vị trí hãng chỉ định. Đo ở vị trí khác cho số khác — vì '
      + 'khoảng cách nhông–trục bánh thay đổi theo hành trình treo.',
    focus: 'chain',
    view: [0.3, 0.14, 0.94],
    moves: [],
  },
  {
    title: 'Tháo chân phanh và thanh kéo phanh sau',
    detail: 'Nới đai ốc điều chỉnh ở đầu thanh kéo. Ghi lại số vòng để lắp lại đúng hành trình '
      + 'tự do như cũ.',
    tool: 'Kìm · tuýp 10',
    focus: 'brake-arm',
    moves: [
      { part: 'brake-arm', d: [60, -40, 60] },
      { part: 'brake-pedal', d: [80, -60, 0] },
    ],
  },
  {
    title: 'Tháo bánh sau — kiểm mòn nhông, sên, dĩa cùng lúc',
    detail: 'Nới trục bánh sau và hai đai ốc căng sên, đẩy bánh về trước để sên rời khỏi dĩa. '
      + 'Kiểm cả BỘ BA: sên kéo lên khỏi dĩa được quá nửa chiều cao răng là sên đã giãn; răng '
      + 'nhông/dĩa vẹt thành lưỡi liềm là mòn.',
    tool: 'Tuýp 19 · tuýp 14 · con đội',
    warn: 'THAY CẢ BỘ nhông–sên–dĩa. Lắp sên mới vào nhông cũ thì sên mới mòn nhanh gấp mấy lần.',
    focus: 'rear-wheel',
    moves: [
      { part: 'rear-wheel', d: [0, -30, 300] },
      { part: 'rear-sprocket', d: [-60, -30, 300] },
      { part: 'brake-drum', d: [90, -20, 300] },
    ],
  },
  {
    title: 'Tháo hai má phanh sau — má DẪN luôn mòn nhanh hơn',
    detail: 'Bung hai lò xo hồi, lấy cặp má ra. So bề dày hai má: má DẪN (má được ma sát kéo thêm '
      + 'vào lòng trống) luôn mòn nhanh hơn má BỊ. Đó không phải lỗi lắp — đó là hệ quả của tự '
      + 'cường hoá.',
    tool: 'Kìm mỏ nhọn',
    warn: 'Lắp ngược chiều má thì mất hết tự cường hoá, phanh yếu hẳn mà nhìn ngoài không thấy gì '
      + 'khác. Chú ý chiều cam đội và vị trí lò xo.',
    focus: 'brake-shoes',
    view: [0.82, 0.2, 0.53],
    moves: [{ part: 'brake-shoes', d: [110, 0, 260] }],
  },
  {
    title: 'Tháo hai giảm chấn sau và gắp sau',
    detail: 'Đỡ gắp sau trước khi tháo bu lông trục gắp. Lắc gắp theo phương NGANG để kiểm bạc '
      + 'trục — có độ lắc ngang là bạc đã mòn, và đó là nguyên nhân "xe bơi khi vào cua".',
    tool: 'Tuýp 14 · tuýp 17 · gỗ kê',
    warn: 'Thay giảm chấn theo CẶP, không thay một bên — hai bên khác độ cứng làm xe lệch.',
    focus: 'swingarm',
    moves: [
      { part: 'rear-shock', d: [110, 60, 90] },
      { part: 'swingarm', d: [0, -80, 340] },
    ],
  },
  {
    title: 'Tháo nhông trước',
    detail: 'Nhông trước nằm sau nắp che bên trái. Đây là chi tiết mòn nhanh nhất trong bộ ba vì '
      + 'nó nhỏ nhất nên mỗi răng chịu tải lớn nhất và quay nhanh nhất.',
    tool: 'Tuýp 14 · kìm tháo phe',
    focus: 'front-sprocket',
    moves: [{ part: 'front-sprocket', d: [-120, 0, 0] }],
  },
  {
    title: 'Tháo kẹp phanh trước và ống dầu',
    detail: 'Tháo kẹp phanh khỏi ống phuộc TRƯỚC khi tháo bánh. Kiểm ắc kẹp phanh có trượt tự do — '
      + 'ắc kẹt làm má mòn lệch và phanh không nhả hết.',
    tool: 'Tuýp 12 · khoá dầu 10',
    warn: 'KHÔNG bóp tay phanh sau khi đã tháo đĩa ra — pít-tông sẽ bung khỏi kẹp. Chèn một miếng '
      + 'gỗ vào chỗ đĩa.',
    focus: 'brake-caliper',
    view: [0.72, 0.24, -0.65],
    moves: [
      { part: 'brake-caliper', d: [-80, 40, -40] },
      { part: 'brake-hose', d: [-40, 60, -60] },
    ],
  },
  {
    title: 'Tháo bánh trước và đĩa phanh',
    detail: 'Đo bề dày đĩa ở nhiều điểm — mòn không đều là dấu hiệu ắc kẹp phanh kẹt. Đo độ đảo '
      + 'bằng đồng hồ so nếu tay bóp bị giật theo vòng quay.',
    tool: 'Tuýp 19 · tuýp 8 · panme',
    focus: 'front-wheel',
    moves: [
      { part: 'front-wheel', d: [0, -40, -320] },
      { part: 'brake-disc', d: [-70, -30, -320] },
    ],
  },
  {
    title: 'Tháo càng trước — kiểm ty phuộc và nhớt phuộc',
    detail: 'Nới hai bu lông kẹp trên chảng ba rồi rút ống phuộc xuống. Trước khi tháo rời, ấn '
      + 'mạnh ống phuộc rồi thả: phải trả về và DỪNG, không được dội lên xuống. Dội là hết nhớt '
      + 'phuộc hoặc mất giảm chấn.',
    tool: 'Tuýp 12 · tuýp 14',
    warn: 'Rà ngón tay dọc ty phuộc tìm vết rỗ. Chính vết rỗ cắt phớt, nên lắp ty rỗ vào phớt mới '
      + 'thì vài trăm km sau lại chảy nhớt.',
    focus: 'fork-outer',
    moves: [
      { part: 'fork-outer', d: [0, -180, -140] },
      { part: 'fork-inner', d: [0, -60, -260] },
      { part: 'fork-spring', d: [0, 60, -300] },
    ],
  },
  {
    title: 'Tháo cụm lái và bạc cổ',
    detail: 'Tháo ghi đông, chảng ba trên, rồi đai ốc cổ. Đỡ chảng ba dưới khi rút ra — bi rời sẽ '
      + 'rơi nếu là loại bi rời. Kiểm vòng đua bi: rỗ THÀNH RÃNH ở vị trí đi thẳng là bình thường '
      + 'với xe cũ (xe đi thẳng phần lớn thời gian) và phải thay cả bộ.',
    tool: 'Khoá cổ · búa cao su · vam đóng bạc',
    warn: 'Siết bạc cổ là việc tinh: chặt quá thì lái nặng và rỗ nhanh, lỏng quá thì lắc đầu ở '
      + 'tốc độ cao. Siết tới khi hết rơ rồi nới lại một chút cho quay êm.',
    focus: 'steering',
    view: [0.5, 0.42, -0.76],
    moves: [
      { part: 'steering', d: [0, 220, -120] },
      { part: 'head-bearings', d: [0, 120, -220] },
    ],
  },
  {
    title: 'Còn lại khung sườn — kiểm nứt và độ thẳng',
    detail: 'Kiểm quanh tai treo máy, quanh ống cổ và quanh tai trục gắp sau — ba chỗ chịu tải lớn '
      + 'nhất. Sau tai nạn, đo đường chéo giữa các điểm gá để phát hiện khung vặn.',
    tool: 'Đèn soi · thước dây · bàn cân khung (nếu có)',
    warn: 'Khung móp hoặc vặn không sửa được bằng cân vành hay đổi phuộc. Xe sẽ luôn "ăn" một bên.',
    focus: 'frame',
    moves: [
      { part: 'footpegs', d: [140, -60, 0] },
      { part: 'brake-lever-assy', d: [90, 90, -90] },
      { part: 'frame', d: [0, 160, 0] },
    ],
  },
];
