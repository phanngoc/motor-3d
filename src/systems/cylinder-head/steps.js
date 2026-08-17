/**
 * steps.js — Quy trình tháo lắp đầu bò, đúng thứ tự như làm thật.
 *
 * Chạy TIẾN = tháo. Chạy NGƯỢC (nút ↺) = lắp lại. Thứ tự lắp chính là thứ tự
 * tháo đảo ngược, trừ các lưu ý riêng đã ghi trong `tip`.
 *
 * `crank` (độ): nếu có, khi đến bước này piston/trục khuỷu sẽ được đặt về đúng
 * góc đó — dùng để thể hiện "phải đưa về điểm chết trên trước khi tháo".
 */

import { L } from './layout.js';
import { AX } from './parts.js';

const V = L.valves;

/** Vector di chuyển dọc trục xupap, hướng XUỐNG (ra phía buồng đốt). */
const stemDown = (k, d) => [0, -AX[k].ay * d, -AX[k].az * d];

/** Các chi tiết nằm TRONG đầu bò — phải đi theo khi nhấc đầu bò lên. */
const IN_HEAD = ['valve-i', 'valve-e', 'springs-i', 'springs-e', 'retainer-i', 'retainer-e',
  'cotter-i', 'cotter-e', 'valve-guides', 'stem-seals'];

export const STEPS = [
  {
    title: 'Tháo bugi',
    detail: 'Tháo trước tiên vì (a) tránh làm nứt sứ khi va chạm trong lúc tháo, '
      + '(b) mất nén giúp xoay trục khuỷu bằng tay rất nhẹ để tìm điểm chết trên.',
    tool: 'Tuýp bugi 16 mm + cần nối',
    warn: 'Thổi sạch bụi quanh chân bugi trước khi tháo, đừng để bụi rơi vào buồng đốt',
    focus: 'spark-plug',
    view: [0.9, 0.35, 0.25],
    moves: [{ part: 'spark-plug', d: [48, 25, 0] }],
  },
  {
    title: 'Tháo 2 nắp che cò',
    detail: 'Hai nắp tròn trên nắp đầu bò. Mở ra là thấy ngay 2 cò mổ và vít điều chỉnh. '
      + 'Nhờ đó cho phép căn khe hở nhiệt mà không phải tháo gì thêm.',
    tool: 'Tuốc-nơ-vít dẹt lớn hoặc chìa khoá chuyên dụng',
    tip: 'Giữ lại o-ring, kiểm tra còn đàn hồi không',
    focus: 'tappet-caps',
    view: [0.35, 0.85, 0.4],
    moves: [{ part: 'tappet-caps', d: [0, 34, 0] }],
  },
  {
    title: 'Đưa piston về ĐIỂM CHẾT TRÊN cuối kỳ nén',
    detail: 'Xoay trục khuỷu (qua nắp lỗ trục cơ bên trái) đến khi dấu "T" trên bánh đà '
      + 'trùng dấu cố định, VÀ cả hai cò mổ đều lỏng — lỏng cả hai là dấu hiệu '
      + 'chắc chắn đang ở cuối kỳ NÉN chứ không phải cuối kỳ XẢ.',
    tool: 'Tuýp 14 mm quay trục khuỷu · đèn pin',
    warn: 'Chỉ xoay theo đúng chiều quay của máy, không xoay ngược',
    tip: 'Nếu chỉ một cò lỏng: xoay thêm trọn 1 vòng trục khuỷu (360°)',
    crank: 360,
    focus: 'cam-sprocket',
    view: [-0.75, 0.4, 0.55],
    moves: [],
  },
  {
    title: 'Căn khe hở nhiệt xupap (nếu chỉ bảo dưỡng)',
    detail: `Nới đai ốc chặn, xoay vít điều chỉnh sao cho lá căn ${L.lash.intake} mm `
      + 'vào vừa khít — kéo ra có lực ma sát nhẹ. Giữ vít, siết lại đai ốc chặn, '
      + 'rồi ĐO LẠI vì siết đai ốc thường làm vít xê dịch.',
    tool: 'Lá căn (feeler gauge) 0,05 mm · tuốc-nơ-vít · chìa khoá 8 mm',
    warn: 'Khe hở quá NHỎ nguy hiểm hơn quá lớn: xupap không đóng kín -> cháy xupap',
    tip: 'Đo khi máy NGUỘI hoàn toàn (dưới 35 °C)',
    crank: 360,
    focus: 'rocker-i',
    view: [0.3, 0.75, 0.6],
    moves: [],
  },
  {
    title: 'Tháo 4 bu lông nắp đầu bò',
    detail: 'Nới đều đối xứng. Bu lông ngắn, ren vào nhôm mỏng — nới từng chút một.',
    tool: 'Tuýp 10 mm',
    torque: 'Khi lắp: ≈ 10 N·m',
    focus: 'cover-bolts',
    view: [0.4, 0.8, 0.45],
    moves: [{ part: 'cover-bolts', d: [0, 44, 0] }],
  },
  {
    title: 'Nhấc nắp đầu bò + gioăng',
    detail: 'Nhấc thẳng lên. Nếu dính gioăng thì lấy búa cao su gõ NHẸ vào gân mép, '
      + 'không bao giờ nảy bằng tua-vít vào mặt lắp (xước mặt lắp = rỉ nhớt vĩnh viễn).',
    tool: 'Búa cao su',
    tip: 'Kiểm gioăng: chai cứng hoặc biến dạng thì thay mới',
    focus: 'head-cover',
    view: [0.5, 0.6, 0.6],
    moves: [
      { part: 'head-cover', d: [0, 62, 0] },
      { part: 'cover-gasket', d: [0, 54, 0] },
    ],
  },
  {
    title: 'Nới bộ căng dây cam',
    detail: 'Nén lò xo căng và khoá cóc lại (hoặc tháo hẳn bộ căng ra). Dây cam phải LỎNG '
      + 'mới rút được nhông cam. Đây là bước dễ bỏ sót nhất.',
    tool: 'Tuốc-nơ-vít · tuýp 8 mm',
    warn: 'Bỏ qua bước này sẽ làm méo răng nhông hoặc kéo bật dây cam khi cố rút',
    focus: 'tensioner',
    view: [-0.35, 0.35, 0.87],
    moves: [{ part: 'tensioner', d: [0, 0, 52] }],
  },
  {
    title: 'Tháo 2 bu lông + rút nhông cam ra khỏi trục cam',
    detail: 'GIỮ DÂY CAM: luôn dùng một đoạn dây kẽm hoặc dây thép buộc treo dây cam '
      + 'lại trước khi rút nhông. Nếu dây cam tụt xuống lốc máy thì phải tách cả '
      + 'lốc máy để lấy — công việc lớn hơn gấp nhiều lần.',
    tool: 'Tuýp 8 mm · dây kẽm treo dây cam',
    warn: 'TUYỆT ĐỐI không để dây cam rơi xuống lốc máy',
    tip: 'Đánh dấu chiều lắp của nhông trước khi tháo',
    focus: 'cam-sprocket',
    view: [-0.85, 0.35, 0.4],
    moves: [{ part: 'cam-sprocket', d: [-66, 0, 0] }],
  },
  {
    title: 'Rút 2 trục cò mổ',
    detail: 'Rút ngang theo trục. Trục thường chặt: bắt một bu lông vào đầu có ren rồi kéo, '
      + 'hoặc dùng búa giật nhỏ. Ghi nhớ trục nào của bên nạp / bên xả.',
    tool: 'Bu lông kéo (slide hammer) hoặc kìm mỏ nhọn',
    tip: 'Đánh dấu NẠP / XẢ ngay khi rút ra — hai trục có thể mòn khác nhau',
    focus: 'rocker-shaft-i',
    view: [0.85, 0.4, 0.35],
    moves: [
      { part: 'rocker-shaft-i', d: [76, 0, 0] },
      { part: 'rocker-shaft-e', d: [76, 6, 0] },
    ],
  },
  {
    title: 'Lấy 2 cò mổ ra',
    detail: 'Sau khi rút trục, cò mổ rời tự do. Kiểm tra mặt tiếp xúc vấu cam: '
      + 'phải bóng đều, không lõm thành rãnh. Kiểm lỗ bạc cò mổ không bị ô-van.',
    tool: 'Tay',
    tip: 'Đặt riêng theo cặp NẠP / XẢ, đừng trộn',
    focus: 'rocker-i',
    view: [0.55, 0.65, 0.5],
    moves: [
      { part: 'rocker-i', d: [0, 42, 24] },
      { part: 'rocker-e', d: [0, 42, -24] },
    ],
  },
  {
    title: 'Rút trục cam',
    detail: 'Rút ngang ra khỏi 2 vách ổ đỡ. Kiểm tra: độ nâng vấu (đo bằng panme, so với '
      + 'giới hạn trong sổ tay), bề mặt vấu không bong tróc, cổ trục không xước.',
    tool: 'Tay · panme để kiểm độ nâng vấu',
    tip: 'Đo chiều cao vấu từ đỉnh đến mặt đối diện — mòn > 0,15 mm thì thay',
    focus: 'camshaft',
    view: [0.8, 0.45, 0.4],
    moves: [{ part: 'camshaft', d: [92, 0, 0] }],
  },
  {
    title: 'Nới và tháo 4 bu lông đầu bò',
    detail: 'NỚI theo hình CHÉO, chia 2–3 lượt, mỗi lượt nới đều từng chút. Nới lệch tay '
      + 'một bu lông trước sẽ làm mặt lắp nhôm bị cong vĩnh viễn.',
    tool: 'Tuýp 12 mm · cần lực khi lắp',
    torque: 'Khi lắp: ≈ 24 N·m, siết 2 lượt theo hình chéo',
    warn: 'Sai thứ tự = cong mặt lắp = hở gioăng đầu bò lắp lại vẫn rỉ',
    focus: 'head-bolts',
    view: [0.45, 0.7, 0.55],
    moves: [{ part: 'head-bolts', d: [0, 74, 0] }],
  },
  {
    title: 'Nhấc đầu bò ra khỏi xy-lanh',
    detail: 'Đầu bò đi ra thành một khối cùng với xupap, lò xo, ống dẫn hướng nằm bên trong. '
      + 'Nếu dính gioăng thì gõ nhẹ búa cao su vào bệ tản nhiệt, không nảy mặt lắp.',
    tool: 'Búa cao su',
    warn: 'Che miệng xy-lanh bằng giẻ sạch ngay — đừng để vật lạ rơi vào buồng đốt',
    tip: 'Để ngửa đầu bò trên giẻ sạch, tránh để mặt lắp tiếp đất bẩn',
    focus: 'head',
    view: [0.6, 0.5, 0.6],
    moves: [
      { part: 'head', d: [0, 118, 0] },
      ...IN_HEAD.map((p) => ({ part: p, d: [0, 118, 0] })),
    ],
  },
  {
    title: 'Tháo gioăng đầu bò',
    detail: 'Gioăng này BẮT BUỘC thay mới. Cạo sạch vết gioăng cũ trên cả hai mặt lắp '
      + 'bằng dao cạo nhựa hoặc gỗ, không dùng dao thép.',
    tool: 'Dao cạo nhựa · dung môi làm sạch',
    warn: 'Không bao giờ dùng lại gioăng đầu bò cũ',
    tip: 'Kiểm độ phẳng mặt lắp bằng thước lá + lá căn khi đã làm sạch',
    focus: 'head-gasket',
    view: [0.5, 0.45, 0.7],
    moves: [{ part: 'head-gasket', d: [0, 24, 0] }],
  },
  {
    title: 'Nén lò xo · lấy 2 nửa móng gà',
    detail: 'Đặt vam nén lò xo (valve spring compressor) ép đĩa chặn xuống đến khi 2 nửa '
      + 'móng gà rời lỏng, dùng đầu từ hoặc kìm gắp lấy ra. Đây là bước đòi nhiều '
      + 'kiên nhẫn nhất của cả quy trình.',
    tool: 'Vam nén lò xo xupap · đầu từ',
    warn: 'Móng gà rất nhỏ và rất dễ bay mất — làm trong khay, không làm trên sàn',
    tip: 'Lắp lại: bôi một lớp nhớt mỏng lên rãnh để móng gà dính tạm vào thân xupap',
    focus: 'cotter-i',
    view: [0.4, 0.55, 0.72],
    moves: [
      { part: 'cotter-i', d: [26, 30, 14] },
      { part: 'cotter-e', d: [-26, 30, -14] },
    ],
  },
  {
    title: 'Tháo đĩa chặn + 2 lò xo',
    detail: 'Nhả vam, lấy đĩa chặn rồi 2 lò xo (trong và ngoài). Đo chiều dài tự do của '
      + 'từng lò xo và so với giới hạn; lò xo yếu là nguyên nhân âm thầm gây mất nén '
      + 'ở vòng tua cao.',
    tool: 'Thước cặp',
    tip: 'Lò xo có đầu khép vòng (mặt phẳng) lắp hướng XUỐNG phía đầu bò',
    focus: 'springs-i',
    view: [0.4, 0.5, 0.75],
    moves: [
      { part: 'retainer-i', d: [0, 34, 10] },
      { part: 'retainer-e', d: [0, 34, -10] },
      { part: 'springs-i', d: [0, 58, 16] },
      { part: 'springs-e', d: [0, 58, -16] },
    ],
  },
  {
    title: 'Rút xupap ra khỏi ống dẫn hướng',
    detail: 'Rút xupap về phía buồng đốt. Nếu kéo không ra: thân xupap có thể bị đóng muội '
      + 'hoặc quăn phần trên rãnh móng gà — làm sạch rồi rút, KHÔNG gõ mạnh (thân xupap '
      + 'cong là bỏ cả xupap).',
    tool: 'Tay · giấy nhám mịn làm sạch thân',
    warn: 'Đánh dấu NẠP / XẢ. Lắp lại sai chỗ là hỏng ngay lần nổ đầu tiên',
    tip: 'Kiểm độ đảo thân xupap và độ rỗ mặt vát trước khi quyết định xoáy lại hay thay',
    focus: 'valve-i',
    view: [0.45, 0.25, 0.85],
    moves: [
      { part: 'valve-i', d: stemDown('intake', 88) },
      { part: 'valve-e', d: stemDown('exhaust', 88) },
    ],
  },
  {
    title: 'Tháo phớt thân xupap · kiểm ống dẫn hướng',
    detail: 'Phớt thân xupap thay mới mỗi lần tháo. Ống dẫn hướng chỉ thay khi đo khe hở '
      + 'thân–ống vượt giới hạn: phải ép nóng (đốt đầu bò ~130 °C) và sau khi ép '
      + 'BẮT BUỘC doa lại bệ xupap cho đồng tâm.',
    tool: 'Kìm · đồng hồ so (đo khe hở) · dụng cụ ép ống dẫn hướng',
    warn: 'Thay ống dẫn hướng mà không doa lại bệ xupap = xupap không bao giờ kín',
    tip: 'Đến đây đầu bò đã rời hoàn toàn: đến lúc làm sạch muội than và kiểm độ phẳng',
    focus: 'stem-seals',
    view: [0.4, 0.4, 0.82],
    moves: [
      { part: 'stem-seals', d: [0, 42, 0] },
      { part: 'valve-guides', d: [0, 56, 0] },
    ],
  },
];
