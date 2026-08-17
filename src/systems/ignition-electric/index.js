/**
 * Hệ thống 08 — Đánh lửa & hệ thống điện.
 */

export default {
  mode: 'doc',
  slug: 'ignition-electric',
  doc: {
    lead: 'Hệ thống điện xe số nhỏ gọn đến mức gần như không thể đơn giản hơn: một cuộn dây '
      + 'quanh mâm lửa vừa phát điện vừa báo vị trí trục khuỷu, một hộp CDI, một cuộn lửa. '
      + 'Nhưng chính vì ít chi tiết nên mỗi lần hỏng lại khó đoán — phải đo bằng số, '
      + 'không được thay linh kiện theo phỏng đoán.',

    theory: [
      {
        h: 'CDI: nâng 12 V thành 20.000 V trong hai bước',
        ol: [
          'Cuộn <b>nguồn (exciter coil)</b> trên mâm lửa sinh điện áp xoay chiều ~100–300 V khi '
          + 'nam châm của bánh đà quét qua.',
          'Điện áp này được chỉnh lưu và <b>nạp vào một tụ điện</b> trong hộp CDI.',
          'Cuộn <b>xung (pulser / pick-up coil)</b> phát một xung khi vấu trên bánh đà đi qua — '
          + 'đây là tín hiệu "đúng lúc rồi".',
          'CDI mở <b>thyristor (SCR)</b>, <b>xả toàn bộ tụ điện</b> vào cuộn sơ cấp của cuộn lửa '
          + 'trong vài chục micro-giây.',
          'Cuộn lửa (biến áp có tỉ số ~1:100) biến nó thành 15.000–25.000 V ở cuộn thứ cấp -> '
          + 'phóng qua khe hở bugi.',
        ],
        p: ['Vì là <b>phóng điện từ tụ điện</b> (Capacitor Discharge Ignition), tia lửa rất mạnh '
          + 'và rất ngắn. Khác với hệ thống ma-vít cổ điển (cuộn dây tích năng bằng từ trường), '
          + 'CDI cho tia mạnh ở vòng tua cao nhưng thời gian phóng ngắn hơn.'],
      },
      {
        h: 'Góc đánh lửa sớm và vì sao phải sớm',
        p: [
          'Hoà khí không nổ tức thời — nó cháy lan mất khoảng <b>1–2 mili-giây</b>. Ở 6.000 v/ph, '
          + 'trục khuỷu quay 36° trong 1 ms. Vì vậy phải đánh lửa <b>trước</b> khi piston lên '
          + 'điểm chết trên để áp suất cực đại xảy ra vào đúng lúc piston vừa qua ĐCT (~10–15° sau ĐCT).',
          'Góc sớm tăng theo vòng tua: thường ~10° trước ĐCT ở không tải và ~28–32° trước ĐCT ở '
          + 'vòng tua cao. CDI điện tử tự tính đường cong này.',
        ],
        ul: [
          '<b>Sớm quá</b> -> kích nổ (tiếng "kin kin" khi tải), làm vỡ đỉnh piston. '
          + 'Rất nhanh và rất đắt.',
          '<b>Muộn quá</b> -> mất công suất, máy nóng bất thường, ống xả đỏ (vì còn đang cháy '
          + 'khi xupap xả mở).',
        ],
      },
      {
        h: 'Mâm lửa làm BA việc cùng một lúc',
        ul: [
          '<b>Cuộn sạc (charging coil)</b> — phát điện nạp ắc quy qua bộ tiết chế (regulator/rectifier).',
          '<b>Cuộn nguồn CDI (exciter)</b> — cấp năng cho tụ điện trong CDI.',
          '<b>Cuộn xung (pulser)</b> — báo vị trí trục khuỷu.',
          '<b>Cuộn đèn (lighting coil)</b> — ở một số đời cũ, cấp điện AC trực tiếp cho đèn pha.',
        ],
        p: ['Đó là lý do khi <b>phớt chặn nhớt bên trái rỉ nhớt</b>, nhớt ngấm vào mâm lửa và '
          + 'cùng lúc gây ra: lửa yếu, không sạc được ắc quy, đèn chập chờn. '
          + 'Một nguyên nhân, ba triệu chứng ở ba hệ thống khác nhau.'],
      },
      {
        h: 'Bộ tiết chế (regulator/rectifier) làm hai việc',
        ul: [
          '<b>Chỉnh lưu</b> — biến điện AC từ mâm lửa thành DC để nạp ắc quy.',
          '<b>Ổn định điện áp</b> — cắt bỏ phần vượt ~14,5 V bằng cách <b>ngắn mạch xuống mass</b> '
          + '(kiểu shunt). Phần năng lượng thừa biến thành NHIỆT.',
        ],
        p: ['Vì vậy bộ tiết chế luôn nóng và luôn có cánh tản nhiệt. Nếu lắp ở chỗ không có gió '
          + 'thổi qua, nó sẽ chết sớm. Đó là lỗi lắp đặt phổ biến khi thay thế.'],
      },
      {
        h: 'Đọc màu bugi: dụng cụ chẩn đoán rẻ nhất',
        ul: [
          '<b>Nâu nhạt / xám nhạt</b> — đúng. Hoà khí và nhiệt độ bugi hợp.',
          '<b>Đen muội, khô</b> — hoà khí giàu (lọc gió tắc, choke kẹt, gíc-lơ lớn).',
          '<b>Đen ướt dầu nhớt</b> — nhớt vào buồng đốt (xéc-măng hoặc phớt thân xupap).',
          '<b>Trắng xám, có đốm nóng chảy</b> — nghèo hoặc bugi quá nóng. NGUY HIỂM, dừng ngay.',
          '<b>Điện cực mòn tròn, khe hở rộng</b> — bugi quá hạn sử dụng.',
        ],
      },
    ],

    specs: [
      ['Kiểu đánh lửa', 'CDI (phóng điện từ tụ điện), góc sớm điều khiển điện tử'],
      ['Điện áp thứ cấp', '≈ 15.000–25.000 V'],
      ['Góc đánh lửa ở không tải', '≈ 10° trước ĐCT (tra sổ tay đúng đời)'],
      ['Góc đánh lửa ở vòng tua cao', '≈ 28–32° trước ĐCT'],
      ['Khe hở điện cực bugi', '0,6–0,7 mm'],
      ['Điện trở cuộn sơ cấp cuộn lửa', '≈ 0,1–0,5 Ω'],
      ['Điện trở cuộn thứ cấp cuộn lửa', '≈ 6–15 kΩ (có giắc) — tra sổ tay'],
      ['Điện trở cuộn xung (pulser)', '≈ 50–200 Ω'],
      ['Điện áp sạc ở 5.000 v/ph', '≈ 14,0–15,0 V DC tại cọc ắc quy'],
      ['Ắc quy', '12 V, 3–5 Ah (chì khô hoặc axít-chì)'],
      ['Lực siết bugi', '≈ 12 N·m'],
      ['Lực siết đai ốc bánh đà', '≈ 55 N·m'],
    ],

    parts: [
      { name: 'Bánh đà / rôto mâm lửa', nameEn: 'Flywheel / rotor', qty: 1,
        material: 'Thép + nam châm vĩnh cửu',
        spec: 'Lắp côn + then bán nguyệt; có dấu chỉ thị ĐCT ("T") và dấu đánh lửa ("F")',
        fn: 'Quay nam châm qua các cuộn dây (phát điện) và mang vấu kích cuộn xung (báo vị trí).',
        fail: 'Then bị cắt -> lệch góc -> sai thời điểm đánh lửa. Nam châm yếu (do va đập mạnh '
          + 'hoặc quá nhiệt) -> lửa yếu ở mọi vòng tua.' },
      { name: 'Cuộn dây stator (mâm lửa)', nameEn: 'Stator assembly', qty: 1,
        material: 'Dây đồng quanh lõi thép silic',
        spec: 'Gồm cuộn sạc + cuộn nguồn CDI + cuộn đèn (tuỳ đời)',
        fn: 'Phát điện cho toàn xe.',
        fail: 'Cháy cuộn (mùi khét, đồng đổi màu) -> mất sạc. Ngâm nhớt do phớt rỉ -> giảm cách điện. '
          + 'Đo điện trở từng cuộn VÀ đo cách điện với mass.' },
      { name: 'Cuộn xung (pick-up / pulser)', nameEn: 'Pulse generator coil', qty: 1,
        material: 'Cuộn dây + lõi từ',
        spec: 'Điện trở ≈ 50–200 Ω',
        fn: 'Phát xung định thời cho CDI mỗi khi vấu bánh đà đi qua.',
        fail: 'Đứt/ngắn mạch -> không có lửa HOÀN TOÀN. Khe hở với bánh đà sai -> xung yếu, '
          + 'mất lửa ở vòng tua cao.' },
      { name: 'Hộp CDI', nameEn: 'CDI unit', qty: 1,
        material: 'Mạch điện đổ epoxy trong vỏ nhựa',
        spec: 'Chứa tụ điện, SCR và mạch tính góc sớm',
        fn: 'Tích năng rồi xả đúng lúc vào cuộn lửa; quyết định góc đánh lửa theo vòng tua.',
        fail: 'Chết là mất lửa hoàn toàn. Nhưng <b>trước khi kết luận CDI chết, phải loại trừ '
          + 'cuộn xung, công tắc, giắc cắm và MASS</b> — đây là thứ bị thay oan nhiều nhất.' },
      { name: 'Cuộn lửa (biến áp đánh lửa)', nameEn: 'Ignition coil', qty: 1,
        material: 'Cuộn sơ cấp + thứ cấp quanh lõi thép, đổ nhựa',
        spec: 'Tỉ số vòng ≈ 1 : 100',
        fn: 'Nâng điện áp lên hàng chục nghìn volt.',
        fail: 'Nứt vỏ -> phóng điện ra ngoài (thấy tia xanh trong tối). Đo điện trở sơ cấp '
          + 'và thứ cấp để xác nhận.' },
      { name: 'Dây cao áp + giắc bugi', nameEn: 'HT lead & spark plug cap', qty: 1,
        material: 'Lõi dẫn + cách điện silicone; giắc có điện trở chống nhiễu',
        fn: 'Dẫn cao áp đến bugi.',
        fail: 'Giắc bugi có điện trở nội (~5 kΩ) bị tăng trở theo tuổi -> lửa yếu. '
          + 'Là chi tiết rẻ thường bị bỏ qua khi tìm lỗi mất lửa.' },
      { name: 'Bugi', nameEn: 'Spark plug', qty: 1,
        material: 'Thân thép, sứ alumina, điện cực Ni/Pt/Ir',
        spec: 'Khe hở 0,6–0,7 mm; siết ≈ 12 N·m',
        fn: 'Phóng tia lửa đốt hoà khí.',
        fail: 'Mòn điện cực, nứt sứ, hoặc bẩn muội. Cũng là <b>dụng cụ chẩn đoán hoà khí</b> — '
          + 'đọc màu trước khi thay.' },
      { name: 'Bộ tiết chế (chỉnh lưu + ổn áp)', nameEn: 'Regulator / rectifier', qty: 1,
        material: 'Diode + SCR trong khối nhôm có cánh tản nhiệt',
        spec: 'Giới hạn ≈ 14,5 V',
        fn: 'Biến AC thành DC nạp ắc quy và cắt điện áp thừa (biến thành nhiệt).',
        fail: 'Hỏng hở mở -> không sạc -> ắc quy cạn. Hỏng hở kín -> sạc quá áp (>15,5 V) -> '
          + '<b>luộc bóng đèn và phồng ắc quy</b>. Phải đo điện áp sạc ở cọc ắc quy.' },
      { name: 'Ắc quy', nameEn: 'Battery', qty: 1,
        material: 'Chì-axít hoặc chì khô (VRLA)',
        spec: '12 V, 3–5 Ah',
        fn: 'Cấp điện cho đề, đèn, xi-nhan, còi khi máy chưa chạy.',
        fail: 'Sunfat hoá khi để lâu không sạc. Đo điện áp hở: > 12,4 V là còn tốt; '
          + 'nhưng phải đo CÓ TẢI (khi bấm đề) mới biết thực chất.' },
      { name: 'Mô tơ đề', nameEn: 'Starter motor', qty: 1,
        material: 'Nam châm vĩnh cửu + rôto + than chì',
        spec: 'Dòng khởi động ≈ 20–60 A',
        fn: 'Quay trục khuỷu để khởi động.',
        fail: 'Than chì mòn -> quay yếu/không quay. Nhưng 80% ca "đề không quay" là do '
          + '<b>ắc quy yếu hoặc tiếp xúc/mass bẩn</b>, không phải mô tơ.' },
      { name: 'Rơ-le đề (công tắc từ)', nameEn: 'Starter relay / solenoid', qty: 1,
        material: 'Cuộn hút + tiếp điểm đồng',
        fn: 'Đóng mạch dòng lớn từ ắc quy vào mô tơ đề, điều khiển bằng dòng nhỏ từ nút đề.',
        fail: 'Tiếp điểm cháy rỗ -> nghe "tách" mà mô tơ không quay. Thử bằng cách ngắn mạch '
          + '2 cọc lớn (có tia lửa, cẩn thận).' },
      { name: 'Bộ ly hợp một chiều đề (bendix)', nameEn: 'Starter clutch (one-way)', qty: 1,
        material: 'Con lăn + lò xo trong vỏ thép',
        fn: 'Truyền momen từ mô tơ đề sang trục khuỷu, và <b>tự nhả</b> khi máy đã nổ để mô tơ '
          + 'không bị kéo theo.',
        fail: 'Trượt -> tiếng "ru ru" khi bấm đề mà máy không quay. Là lỗi cơ khí, không phải điện.' },
      { name: 'Công tắc chính (ổ khoá)', nameEn: 'Ignition switch', qty: 1,
        material: 'Tiếp điểm đồng',
        fn: 'Đóng/cắt mạch điện và cắt mass CDI khi tắt máy.',
        fail: 'Bẩn tiếp điểm -> máy tự tắt khi rung. Lỗi dễ bị bỏ qua vì "điện vẫn có".' },
      { name: 'Bộ dây điện + các giắc cắm', nameEn: 'Wiring harness & connectors', qty: 1,
        material: 'Dây đồng bọc PVC + giắc nhựa',
        fn: 'Kết nối tất cả.',
        fail: '<b>Nguyên nhân số 1 của mọi lỗi điện trên xe cũ.</b> Giắc ôxy hoá, chân giắc lỏng, '
          + 'dây mass hàn rỉ. Luôn làm sạch giắc và kiểm MASS trước khi thay linh kiện.' },
    ],

    steps: [
      { title: 'Kiểm tra cơ bản trước khi đo bất cứ thứ gì',
        detail: 'Theo đúng thứ tự: (1) điện áp ắc quy hở và có tải, (2) cầu chì, '
          + '(3) <b>các điểm nối mass</b> — tháo ra, đánh sạch, siết lại, (4) các giắc cắm '
          + '(rút ra cắm lại, xịt dung dịch vệ sinh tiếp điểm).',
        tool: 'Đồng hồ vạn năng · giấy nhám mịn · dung dịch vệ sinh tiếp điểm',
        tip: 'Bước này giải quyết phần lớn "lỗi điện" trên xe trên 5 năm' },
      { title: 'Kiểm tra có lửa hay không (thử lửa)',
        detail: 'Tháo bugi, cắm vào giắc, áp thân bugi vào mass máy, đạp cần khởi động và '
          + 'quan sát tia. Tia phải <b>xanh trắng, mạnh, nổ "tách" rõ</b>. '
          + 'Tia vàng nhạt/yếu = có lửa nhưng không đủ.',
        tool: 'Bugi cũ để thử · kính bảo hộ',
        warn: 'Giữ thân bugi bằng kìm cách điện, đừng nắm dây cao áp bằng tay trần' },
      { title: 'Đọc màu bugi trước khi làm gì tiếp',
        detail: 'Xem bảng đọc màu bugi ở phần lý thuyết. Màu bugi cho biết cả hoà khí (hệ thống 07) '
          + 'lẫn tình trạng xéc-măng (hệ thống 02).',
        tool: 'Tuýp bugi 16 mm · lá căn',
        tip: 'Miễn phí và cho nhiều thông tin hơn phần lớn phép đo điện' },
      { title: 'Đo điện trở cuộn lửa',
        detail: 'Sơ cấp: giữa 2 cọc nhỏ (≈ 0,1–0,5 Ω). Thứ cấp: từ cọc sơ cấp đến đầu dây cao áp '
          + '(≈ 6–15 kΩ kể cả giắc). So sánh với sổ tay.',
        tool: 'Đồng hồ vạn năng (thang Ω)',
        tip: 'Đo CẢ giắc bugi riêng — điện trở nội trong giắc tăng theo tuổi là lỗi hay bị bỏ qua' },
      { title: 'Đo điện trở cuộn xung (pulser)',
        detail: 'Rút giắc mâm lửa, đo 2 chân của cuộn xung (≈ 50–200 Ω). '
          + 'Đo cách điện từng đầu với mass (phải là vô cùng).',
        tool: 'Đồng hồ vạn năng',
        warn: 'Cuộn xung đứt là mất lửa HOÀN TOÀN — kiểm cái này trước khi nghĩ đến CDI' },
      { title: 'Đo các cuộn dây stator',
        detail: 'Đo điện trở từng cuộn theo sơ đồ đấu dây trong sổ tay. Đo cách điện mỗi cuộn '
          + 'với mass. Ngoài ra đo <b>điện áp phát ra</b> khi quay máy (thang AC).',
        tool: 'Đồng hồ vạn năng',
        tip: 'Cuộn ngâm nhớt (do phớt rỉ) vẫn đo điện trở đúng nhưng cách điện tụt — '
          + 'phải đo CẢ HAI thứ' },
      { title: 'Đo điện áp sạc ở cọc ắc quy',
        detail: 'Máy chạy không tải: ≈ 12,5–13,5 V. Ga lên ~5.000 v/ph: '
          + '<b>phải trong khoảng 14,0–15,0 V</b>. Dưới 13,5 V = không sạc. '
          + 'Trên 15,5 V = tiết chế hỏng hở kín (sẽ luộc bóng đèn và phồng ắc quy).',
        tool: 'Đồng hồ vạn năng (thang DC) · đồng hồ vòng tua',
        warn: 'Sạc quá áp phá ắc quy trong vài giờ chạy — xử lý ngay' },
      { title: 'Thay CDI (chỉ khi đã loại trừ mọi thứ khác)',
        detail: 'CDI là linh kiện <b>bị thay oan nhiều nhất</b>. Chỉ kết luận CDI chết khi: '
          + 'cuộn xung đạt, cuộn nguồn đạt, cuộn lửa đạt, giắc cắm và mass sạch, công tắc chính đạt.',
        warn: 'Thay CDI không rõ nguồn gốc thường làm sai đường cong góc sớm -> máy nóng, kích nổ' },
      { title: 'Tháo mâm lửa: tháo vỏ trái',
        detail: 'Xả nhớt nếu cần (tuỳ đời). Tháo vỏ che bên trái.',
        tool: 'Tuýp 8 mm' },
      { title: 'Giữ bánh đà · nới đai ốc · RÚT bánh đà bằng vam',
        detail: 'Dùng vam giữ bánh đà để nới đai ốc. Sau đó bắt vam RÚT (ren trong bánh đà) '
          + 'và vặn đều cho bánh đà tách khỏi côn.',
        tool: 'Vam giữ bánh đà · vam rút bánh đà',
        warn: 'TUYỆT ĐỐI không nảy hay đóng ngang — sẽ làm cong trục khuỷu (hư hỏng nặng nhất)',
        tip: 'Lấy then bán nguyệt ra ngay, cho vào túi riêng' },
      { title: 'Kiểm then bán nguyệt và lỗ côn',
        detail: 'Then bị cắt hoặc lỗ côn bị rỗ là nguyên nhân "sai lửa" mà không linh kiện điện '
          + 'nào giải thích được.',
        tool: 'Đèn pin · thước cặp',
        tip: 'Nếu đã thay bugi + cuộn lửa + CDI mà vẫn không hết, hãy kiểm cái này' },
      { title: 'Thay stator / cuộn xung · đặt lại khe hở',
        detail: 'Tháo vít giữ stator (thường có keo chống tuột ren). Lắp mới, đặt lại khe hở '
          + 'cuộn xung với vấu bánh đà theo sổ tay nếu là loại điều chỉnh được.',
        tool: 'Tuốc-nơ-vít · lá căn',
        tip: 'Luôn kiểm tình trạng phớt chặn nhớt trái lúc này — đó là nguyên nhân gốc '
          + 'làm cháy stator' },
      { title: 'Lắp lại · siết đai ốc bánh đà đúng lực',
        detail: 'Làm sạch côn (khô, không dầu), lắp then, lắp bánh đà, siết ≈ 55 N·m bằng '
          + 'vam giữ + cần lực.',
        torque: 'Đai ốc bánh đà: ≈ 55 N·m',
        warn: 'Siết thiếu lực -> bánh đà tự lỏng, cắt then, sai lửa trở lại',
        tip: 'Côn còn dầu nhớt sẽ làm bánh đà trượt dù siết đủ lực — lau sạch bằng dung môi' },
      { title: 'Kiểm tra lại bằng phép đo, không bằng cảm giác',
        detail: 'Sau khi lắp: đo lại điện áp sạc ở 5.000 v/ph, thử lửa, và đọc bugi sau 10 km chạy.',
        tool: 'Đồng hồ vạn năng' },
    ],

    symptoms: [
      { sign: 'Không có lửa hoàn toàn',
        cause: 'Cuộn xung đứt · CDI chết · công tắc chính cắt mass · MASS bẩn · '
          + 'giắc cắm lỏng · cuộn lửa đứt.',
        fix: 'Thứ tự đo: mass và giắc cắm -> cuộn xung -> cuộn lửa -> CDI. '
          + 'Đo bằng đồng hồ, không thay linh kiện theo đoán.' },
      { sign: 'Lửa yếu (tia vàng nhạt), xe khó nổ, bỏ ở vòng cao',
        cause: 'Nam châm bánh đà yếu · cuộn nguồn suy · điện trở giắc bugi tăng · '
          + 'bugi mòn · nhớt ngấm mâm lửa.',
        fix: 'Đo giắc bugi riêng (rẻ nhất). Rồi đo cuộn nguồn. Kiểm phớt chặn nhớt trái.' },
      { sign: 'Tiếng "kin kin" kim loại khi ép ga hoặc leo dốc',
        cause: 'KÍCH NỔ. Góc đánh lửa sớm quá (CDI không đúng loại), xăng octan thấp, '
          + 'muội than đầy buồng đốt, hoặc máy quá nhiệt.',
        fix: '<b>Giảm ga ngay.</b> Kiểm CDI có đúng loại; dùng xăng đúng octan; '
          + 'kiểm hệ thống làm mát và muội than. Chạy tiếp sẽ vỡ đỉnh piston.' },
      { sign: 'Ắc quy cạn liên tục',
        cause: 'Tiết chế hỏng hở mở · cuộn sạc cháy · ắc quy sunfat hoá · '
          + 'có tải ký sinh (đèn phanh dính, dây chạy mass).',
        fix: 'Đo điện áp sạc ở 5.000 v/ph TRƯỚC. < 13,5 V -> phía phát/tiết chế. '
          + 'Bình thường -> đo dòng rò rỉ khi tắt khoá.' },
      { sign: 'Bóng đèn luộc thường xuyên',
        cause: 'Tiết chế hỏng hở kín -> sạc quá áp (> 15,5 V).',
        fix: 'Đo điện áp sạc. Thay tiết chế và <b>lắp ở chỗ có gió thổi qua</b> — nó toả nhiệt.' },
      { sign: 'Bấm đề nghe "tách" mà mô tơ không quay',
        cause: 'Ắc quy không đủ dòng · tiếp điểm rơ-le đề cháy · mass mô tơ bẩn.',
        fix: 'Đo điện áp ắc quy KHI đang bấm đề (sụt dưới 10 V = ắc quy yếu). Rồi kiểm rơ-le.' },
      { sign: 'Bấm đề nghe "ru ru" mà máy không quay',
        cause: 'Bộ ly hợp một chiều đề (bendix) trượt — lỗi CƠ KHÍ.',
        fix: 'Tháo vỏ trái, kiểm con lăn và lò xo của bendix. Không phải lỗi điện.' },
      { sign: 'Máy tự tắt khi đi đường xóc',
        cause: 'Giắc cắm lỏng hoặc công tắc chính bẩn tiếp điểm.',
        fix: 'Lắc từng giắc khi máy đang nổ để tìm chỗ tiếp xúc kém.' },
    ],

    related: ['crank-case', 'fuel-intake', 'cylinder-head'],
  },
};
