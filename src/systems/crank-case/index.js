/**
 * Hệ thống 03 — Trục khuỷu & lốc máy.
 */

export default {
  mode: 'doc',
  slug: 'crank-case',
  doc: {
    lead: 'Lốc máy là "khung xương" của cả động cơ: nó đỡ trục khuỷu, hộp số, ly hợp và '
      + 'chứa nhớt. Muốn vào đến trục khuỷu thì bắt buộc phải tách lốc máy — đây là '
      + 'công việc lớn nhất, và cũng là công việc dễ làm sai nhất.',

    theory: [
      {
        h: 'Trục khuỷu RỜI (built-up crankshaft) — đặc điểm quyết định mọi thứ',
        p: [
          'Xe máy 1 xy-lanh nhỏ không dùng trục khuỷu liền khối với tay biên tháo được như '
          + 'ở ô tô. Thay vào đó: hai nửa má khuỷu được <b>ép nóng</b> vào chốt khuỷu, và tay biên '
          + 'cùng ổ bi kim nằm kẹt trong đó. Cả khối thành một chi tiết không tách được bằng tay.',
          '<b>Hậu quả thực tế:</b> nếu ổ bi đầu to tay biên mòn, bạn <b>không thể thay riêng</b> '
          + 'bạc hay tay biên — phải thay cả trục khuỷu, hoặc đưa ra xưởng chuyên ép lại. '
          + 'Đây là lý do tiếng gõ dưới máy lại là một chẩn đoán đắt tiền.',
        ],
      },
      {
        h: 'Vì sao trục khuỷu phải được cân bằng',
        p: [
          'Khối lượng piston + tay biên chuyển động lên xuống sinh lực quán tính đổi dấu '
          + 'mỗi nửa vòng. Má khuỷu có đối trọng (counterweight) để trung hoà một phần lực đó.',
          'Động cơ 1 xy-lanh <b>không thể cân bằng hoàn toàn</b> — chỉ cân bằng được khoảng '
          + '50–70% lực quán tính bậc 1. Phần còn lại chính là độ rung bạn cảm thấy ở tay lái. '
          + 'Đó là đặc tính, không phải lỗi.',
        ],
      },
      {
        h: 'Ổ bi cầu và vì sao phải ép nóng',
        p: [
          'Trục khuỷu quay trên 2 ổ bi cầu ép vào 2 nửa lốc máy. Ổ bi lắp kiểu <b>ép chặt</b> '
          + '(interference fit): đường kính trong ổ bi nhỏ hơn cổ trục một chút.',
          'Vì vậy không thể đóng búa vào — cách đúng là làm nóng nửa lốc máy bằng nhôm '
          + '(~90–110 °C, nhôm giãn nhiều hơn thép) hoặc làm lạnh ổ bi, rồi trục tự vào. '
          + 'Đóng búa vào ổ bi làm mòn vết bi (brinelling) — ổ bi sẽ kẹn sau vài trăm km.',
        ],
      },
      {
        h: 'Phớt chặn nhớt: hai chiếc quyết định xe có rỉ nhớt hay không',
        p: [
          'Một phớt ở đầu trục khuỷu bên trái (phía mâm lửa / bánh đà), một bên phải (phía bộ nồi). '
          + 'Cả hai làm việc ở tốc độ quay cao và tiếp xúc trực tiếp với nhớt áp suất.',
          'Phớt phải lắp <b>đúng chiều</b>: lò xo vòng (garter spring) hướng vào phía CÓ NHỚT. '
          + 'Lắp ngược thì phớt không ép vào trục khi áp suất tăng -> rỉ ngay.',
        ],
      },
      {
        h: 'Tách lốc máy: nguyên tắc vàng',
        p: [
          '<b>Chỉ được tách bằng bu lông kéo (case splitter), không được nảy hay đóng.</b> '
          + 'Hai nửa lốc máy có mặt lắp chính xác tính bằng phần trăm milimet, không có gioăng giấy — '
          + 'chỉ phủ keo làm kín. Một vết nảy bằng tua-vít trên mặt lắp là rỉ nhớt vĩnh viễn.',
          'Trước khi tách: đếm và ghi lại vị trí TỪNG bu lông (chúng khác chiều dài nhau) '
          + 'về một tờ giấy bố trí theo đúng hình dạng lốc máy.',
        ],
      },
    ],

    specs: [
      ['Kiểu trục khuỷu', 'Trục khuỷu rời, ép nóng, tay biên không tháo được'],
      ['Số ổ đỡ', '2 ổ bi cầu (trái + phải)'],
      ['Độ đảo trục khuỷu', '≤ 0,03 mm (đo trên 2 mũi chống tâm)'],
      ['Độ đảo radial đầu to tay biên', '≤ 0,05 mm'],
      ['Khe hở dọc trục đầu to tay biên', '0,10–0,40 mm'],
      ['Lực siết bu lông lốc máy', '≈ 10–12 N·m (M6) — siết theo hình xoắn từ trong ra'],
      ['Dung tích nhớt', '≈ 0,8 L (thay định kỳ), 0,9 L (khi tháo cả động cơ)'],
      ['Làm kín 2 nửa lốc máy', 'Keo làm kín dạng lỏng, KHÔNG dùng gioăng giấy'],
    ],

    parts: [
      { name: 'Nửa lốc máy trái', nameEn: 'Left crankcase half', qty: 1,
        material: 'Hợp kim nhôm đúc áp lực',
        spec: 'Chứa ổ đỡ trục khuỷu trái, đường dây cam, ổ đỡ trục số',
        fn: 'Đỡ trục khuỷu và trục hộp số; tạo khoang các-te chứa nhớt.',
        fail: 'Xước mặt lắp (do nảy bằng tua-vít) -> rỉ nhớt không khắc phục được bằng keo. '
          + 'Trượt ren bu lông -> phải ta-rô lại hoặc cấy ren.' },
      { name: 'Nửa lốc máy phải', nameEn: 'Right crankcase half', qty: 1,
        material: 'Hợp kim nhôm đúc áp lực',
        spec: 'Chứa ổ đỡ phải, khoang ly hợp, bơm nhớt',
        fn: 'Như trên, phía này chứa bộ nồi và bơm nhớt.', fail: 'Như trên.' },
      { name: 'Trục khuỷu (nguyên bộ với tay biên)', nameEn: 'Crankshaft assembly', qty: 1,
        material: 'Thép rèn, má khuỷu + chốt khuỷu ép nóng',
        spec: 'Bán kính khuỷu 27,8 mm (hành trình 55,6 mm)',
        fn: 'Biến chuyển động thẳng của piston thành chuyển động quay; dẫn động dây cam, '
          + 'bơm nhớt, bộ nồi và mâm lửa.',
        fail: 'Mòn ổ bi đầu to -> gõ nặng. Cong trục (độ đảo > 0,03 mm) -> rung mạnh. '
          + 'Cả hai trường hợp đều phải thay/ép lại cả bộ.' },
      { name: 'Ổ bi cầu đỡ trục khuỷu (2)', nameEn: 'Crankshaft main bearings', qty: 2,
        material: 'Thép ổ bi', spec: 'Lắp ép chặt vào lốc máy',
        fn: 'Đỡ trục khuỷu, chịu cả lực hướng kính và một phần lực dọc trục.',
        fail: 'Kẹn/lỏng -> tiếng ru đều theo tốc độ. Thay bằng cách hâm nóng lốc máy, '
          + 'không đóng búa.' },
      { name: 'Phớt chặn nhớt trái', nameEn: 'Left crank seal', qty: 1,
        material: 'Cao su NBR + khung thép + lò xo vòng',
        spec: 'Lò xo vòng hướng vào phía có nhớt',
        fn: 'Chặn nhớt không rỉ ra khoang mâm lửa.',
        fail: 'Rỉ nhớt vào mâm lửa -> ướt cuộn điện, lửa yếu, xe khó nổ.' },
      { name: 'Phớt chặn nhớt phải', nameEn: 'Right crank seal', qty: 1,
        material: 'Cao su NBR + khung thép',
        fn: 'Chặn nhớt phía bộ nồi.', fail: 'Rỉ nhớt ra vỏ ly hợp.' },
      { name: 'Nhông dẫn động dây cam (trên trục khuỷu)', nameEn: 'Cam drive sprocket', qty: 1,
        material: 'Thép tôi', spec: '14 răng (nhông cam 28 răng -> tỉ số 2:1)',
        fn: 'Nguồn dẫn động trục cam.',
        fail: 'Mòn răng -> dây cam nhảy răng, lệch pha phối khí.' },
      { name: 'Bánh đà / rôto mâm lửa', nameEn: 'Flywheel / rotor', qty: 1,
        material: 'Thép + nam châm vĩnh cửu gắn trong',
        spec: 'Lắp côn + then bán nguyệt, đai ốc siết ≈ 55 N·m',
        fn: 'Giữ quán tính cho trục khuỷu quay đều giữa các kỳ, đồng thời là rôto của '
          + 'máy phát điện và là vòng chỉ thị điểm chết trên (dấu "T").',
        fail: 'Then bán nguyệt bị cắt -> lệch góc đánh lửa, xe nổ dội hoặc không nổ. '
          + 'Lỗ côn bị rỗ -> bánh đà lắc, phải thay.' },
      { name: 'Then bán nguyệt (2–3)', nameEn: 'Woodruff keys', qty: 3,
        material: 'Thép', spec: 'Rất nhỏ, dễ mất',
        fn: 'Truyền momen và ĐỊNH VỊ GÓC cho bánh đà / nhông.',
        fail: 'Bỏ sót hoặc bị cắt -> sai pha đánh lửa hoặc pha phối khí. '
          + 'Kiểm tra then trước khi kết luận "hỏng CDI".' },
      { name: 'Bu lông lốc máy (nhiều chiếc, khác chiều dài)', nameEn: 'Crankcase bolts', qty: 10,
        material: 'Thép', spec: 'M6, chiều dài khác nhau tuỳ vị trí',
        fn: 'Ép 2 nửa lốc máy. Siết theo hình xoắn từ trong ra ngoài, 2 lượt.',
        fail: 'Lắp sai chiều dài -> bu lông dài xuyên qua mặt lắp hoặc bu lông ngắn không đủ ren. '
          + 'Bố trí bu lông trên giấy theo hình lốc máy để không lẫn.' },
      { name: 'Chốt dẫn hướng lốc máy (2)', nameEn: 'Case dowel pins', qty: 2,
        material: 'Thép',
        fn: 'Định vị 2 nửa lốc máy chính xác với nhau — bu lông chỉ giữ chặt.',
        fail: 'Thiếu -> 2 nửa lệch, trục khuỷu và trục số bị kéo cong.' },
      { name: 'Lọc lưới nhớt (ở các-te)', nameEn: 'Oil strainer screen', qty: 1,
        material: 'Lưới thép',
        fn: 'Chặn mảnh kim loại lớn trước khi nhớt vào bơm.',
        fail: 'Tắc -> bơm hút không được -> tụt áp suất nhớt. Vệ sinh mỗi lần tách máy.' },
    ],

    steps: [
      { title: 'Tháo động cơ ra khỏi khung xe',
        detail: 'Xả nhớt, tháo ống xả, bộ hoà khí/cổ góp, dây điện, dây công-tắc-tơ, '
          + 'dây ga, bàn đạp số, sên (tháo nhông trước). Rồi tháo 3–4 bu lông treo máy.',
        tool: 'Bộ tuýp · con đội hoặc gỗ kê máy',
        warn: 'Đỡ động cơ trước khi tháo bu lông treo cuối cùng — máy ~25 kg' },
      { title: 'Tháo đầu bò + xy-lanh + piston',
        detail: 'Toàn bộ hệ thống 01 và 02.', tip: 'Xem trang 01 và 02' },
      { title: 'Tháo nửa vỏ bên phải: bộ nồi (ly hợp)',
        detail: 'Tháo vỏ ly hợp, đai ốc bộ nồi, bộ nồi trước/sau, bánh răng sơ cấp. '
          + 'Chi tiết ở hệ thống 04.',
        tool: 'Vam giữ bộ nồi · tuýp lớn (thường 24–39 mm)',
        warn: 'Đai ốc bộ nồi rất chặt và có thể là ren ngược — kiểm tra trước khi nới' },
      { title: 'Tháo nửa vỏ bên trái: mâm lửa + bánh đà',
        detail: 'Tháo vỏ trái, cuộn stator, rồi dùng vam RÚT bánh đà ra khỏi côn.',
        tool: 'Vam rút bánh đà (bắt buộc) · vam giữ bánh đà',
        warn: 'KHÔNG được nảy hoặc đóng ngang vào bánh đà — sẽ làm cong trục khuỷu',
        tip: 'Lấy then bán nguyệt ra ngay và cho vào túi riêng' },
      { title: 'Tháo bơm nhớt và bộ dẫn động bơm',
        detail: 'Chi tiết ở hệ thống 06. Tháo trước khi tách lốc máy vì bơm nằm trong khoang phải.',
        tool: 'Tuýp 8 mm' },
      { title: 'Tháo cơ cấu sang số (trống số, càng cua)',
        detail: 'Chi tiết ở hệ thống 05. Một số chi tiết của cơ cấu sang số phải ra trước khi '
          + 'tách được lốc máy.',
        tip: 'Chụp ảnh vị trí càng cua trước khi tháo' },
      { title: 'Đếm và bố trí toàn bộ bu lông lốc máy',
        detail: 'Vẽ hình lốc máy trên một tờ bìa, đâm lỗ và cắm đúng bu lông vào đúng vị trí. '
          + 'Chúng khác chiều dài nhau.',
        warn: 'Đây là bước bị bỏ qua nhiều nhất và là nguyên nhân phổ biến nhất của "lắp lại bị rỉ nhớt"' },
      { title: 'TÁCH LỐC MÁY bằng bu lông kéo',
        detail: 'Bắt dụng cụ tách (case splitter) vào đầu trục khuỷu, vặn đều cho hai nửa rời ra. '
          + 'Trục khuỷu sẽ đi theo một nửa — thường là nửa trái.',
        tool: 'Bộ vam tách lốc máy',
        warn: 'TUYỆT ĐỐI không nảy tua-vít hoặc đóng búa vào mép mặt lắp. '
          + 'Một vết nảy = rỉ nhớt không sửa được bằng keo' },
      { title: 'Rút trục khuỷu ra khỏi ổ bi',
        detail: 'Hâm nóng vùng ổ bi của nửa lốc máy (~90–110 °C) bằng súng nhiệt, trục sẽ '
          + 'tụt ra dễ dàng. Nếu phải dùng lực là nhiệt chưa đủ.',
        tool: 'Súng nhiệt hoặc bếp điện · găng tay chịu nhiệt',
        warn: 'Không dùng đèn khò (đèn hàn) — đốt cháy nhôm cục bộ và biến dạng ổ đỡ',
        tip: 'Nhỏ nước lên bề mặt: sôi lăn tăn là khoảng 100 °C' },
      { title: 'Kiểm tra trục khuỷu',
        detail: 'Đặt trục lên 2 mũi chống tâm hoặc 2 khối V, đo độ đảo bằng đồng hồ so. '
          + 'Đo khe hở radial và axial của đầu to tay biên.',
        tool: 'Đồng hồ so + chân đế từ · khối V',
        tip: 'Độ đảo > 0,03 mm hoặc radial > 0,05 mm -> thay/ép lại trục khuỷu' },
      { title: 'Thay ổ bi và phớt',
        detail: 'Ép ổ bi mới vào lốc máy ĐÃ HÂM NÓNG, ép từ ngoài vào và chỉ đẩy vào vòng '
          + 'NGOÀI của ổ bi. Phớt lắp sau, lò xo vòng hướng vào phía có nhớt.',
        tool: 'Bộ cốc ép ổ bi (bearing driver) · súng nhiệt',
        warn: 'Ép lực qua vòng TRONG của ổ bi làm mòn vết bi -> ổ bi kẹn sau vài trăm km' },
      { title: 'Làm sạch mặt lắp · vệ sinh lưới lọc nhớt',
        detail: 'Cạo hết keo cũ bằng dao cạo nhựa. Mặt lắp phải sạch, khô, không dầu. '
          + 'Vệ sinh lưới lọc nhớt ở các-te.',
        tool: 'Dao cạo nhựa · dung môi làm sạch · khí nén',
        warn: 'Không dùng giấy nhám trên mặt lắp lốc máy' },
      { title: 'Bôi keo làm kín · ghép 2 nửa · siết theo hình xoắn',
        detail: 'Bôi một lớp keo làm kín MỎNG và LIÊN TỤC (loại dành cho lốc máy, vd '
          + 'Three Bond 1215 / Hondabond). Lắp 2 chốt dẫn hướng. Ghép và siết tay tất cả '
          + 'bu lông, sau đó siết lực theo hình xoắn từ trong ra ngoài, 2 lượt.',
        torque: '≈ 10–12 N·m (M6), 2 lượt theo hình xoắn',
        warn: 'Keo quá nhiều sẽ tràn vào trong và bít đường nhớt',
        tip: 'Sau khi ghép, xoay trục khuỷu bằng tay — phải nhẹ và đều. Nếu chạn ở đâu, '
          + 'tháo ra kiểm lại chứ đừng siết tiếp' },
    ],

    symptoms: [
      { sign: 'Tiếng gõ nặng, trầm ở dưới máy, rõ khi tải',
        cause: 'Ổ bi kim đầu to tay biên mòn/vỡ.',
        fix: 'Tháo xy-lanh, lắc đầu to tay biên theo phương hướng kính. Có độ lắc = thay trục khuỷu.' },
      { sign: 'Tiếng ru đều, tăng theo tốc độ, không theo tải',
        cause: 'Ổ bi cầu đỡ trục khuỷu kẹn hoặc lỏng.',
        fix: 'Nghe bằng tua-vít dài áp vào vỏ máy 2 bên. Xác nhận khi tách máy.' },
      { sign: 'Rung mạnh bất thường ở một vòng tua nhất định',
        cause: 'Trục khuỷu cong (độ đảo lớn) — thường sau một lần bó máy hoặc đóng búa vào bánh đà.',
        fix: 'Đo độ đảo trục khuỷu. > 0,03 mm thì phải ép lại.' },
      { sign: 'Rỉ nhớt dọc đường ghép 2 nửa lốc máy',
        cause: 'Keo làm kín bị già · mặt lắp bị nảy xước trong lần sửa trước · siết sai lực/thứ tự.',
        fix: 'Tách lại, kiểm độ phẳng mặt lắp, bôi keo mới. Vết nảy sâu thì phải gia công lại mặt lắp.' },
      { sign: 'Rỉ nhớt ra vùng mâm lửa, lửa yếu, khó nổ',
        cause: 'Phớt chặn nhớt trái hỏng (hoặc lắp ngược lò xo vòng).',
        fix: 'Thay phớt; lắp lò xo vòng hướng vào phía có nhớt.' },
      { sign: 'Xe không nổ / nổ dội sau khi thay CDI, bugi, cuộn lửa',
        cause: 'Then bán nguyệt của bánh đà bị cắt -> bánh đà lệch góc -> sai thời điểm đánh lửa.',
        fix: 'Tháo bánh đà kiểm then. Đây là nguyên nhân hay bị bỏ qua nhất.' },
    ],

    related: ['piston-cylinder', 'clutch', 'gearbox', 'lubrication', 'ignition-electric'],
  },
};
