/**
 * Hệ thống 09 — Khung, phuộc, phanh & truyền động cuối.
 */

export default {
  mode: 'doc',
  slug: 'chassis-brakes',
  doc: {
    lead: 'Đây là hệ thống duy nhất trong cả chiếc xe mà <b>hỏng là mất an toàn ngay lập tức</b>. '
      + 'Động cơ bó máy thì xe dừng lại; phanh mất thì không. Vì vậy ở hệ thống này, '
      + 'nguyên tắc "làm đúng sổ tay" không phải là lời khuyên mà là yêu cầu.',

    theory: [
      {
        h: 'Truyền động cuối: tỉ số nhông – dĩa quyết định tính cách xe',
        p: [
          'Tỉ số cuối = <b>số răng dĩa sau / số răng nhông trước</b>. Ví dụ 35/14 = 2,5.',
        ],
        ul: [
          '<b>Nhông trước nhỏ hơn</b> (hoặc dĩa sau to hơn) -> tỉ số lớn -> <b>bốc ga khoẻ hơn, '
          + 'leo dốc tốt hơn, nhưng tốc độ tối đa giảm</b> và vòng tua cao hơn ở cùng tốc độ.',
          '<b>Nhông trước to hơn</b> -> tỉ số nhỏ -> tốc độ cao hơn, nhưng yếu khi khởi hành và '
          + 'dễ "chết máy" khi chở nặng.',
        ],
        p: ['Đổi 1 răng ở <b>nhông trước</b> tương đương đổi ~2,5 răng ở dĩa sau — vì vậy nhông trước '
          + 'là chỗ dễ tinh chỉnh mạnh nhất. Lưu ý đổi tỉ số làm sai <b>đồng hồ tốc độ</b> '
          + '(nếu lấy tín hiệu từ bánh trước thì không ảnh hưởng).'],
      },
      {
        h: 'Độ võng sên: 25–35 mm, và vì sao không được căng',
        p: [
          'Độ võng sên phải đo ở <b>giữa đoạn sên trên</b>, khi xe đứng trên chân chống giữa, '
          + 'không tải.',
          '<b>Vì sao không được căng sên:</b> khi phuộc sau nhún, khoảng cách từ trục bánh sau đến '
          + 'trục thứ cấp <b>thay đổi</b>. Nếu căng hết độ võng, lúc phuộc nhún hết hành trình, '
          + 'sên bị kéo căng cực đại -> phá ổ bi trục thứ cấp, phá phớt, kéo lệch bánh sau.',
          '<b>Vì sao không được lỏng quá:</b> sên đập vào gấp, nhảy răng, và có thể tuột ra khỏi '
          + 'dĩa khi giảm ga đột ngột.',
        ],
      },
      {
        h: 'Nhông – dĩa – sên phải thay THÀNH BỘ',
        p: [
          'Bước (pitch) của sên giãn dần theo độ mòn. Răng nhông và dĩa mòn theo đúng bước độ sên '
          + 'đã giãn. Lắp sên mới (bước đúng) vào dĩa đã mòn (bước giãn) -> sên mới mòn cực nhanh, '
          + 'thường chỉ vài nghìn km.',
          'Vì vậy: thay <b>cả 3</b> cùng lúc. Chi phí ban đầu cao hơn nhưng tổng chi phí thấp hơn '
          + 'nhiều so với thay lẻ từng món.',
        ],
      },
      {
        h: 'Phuộc trước kiểu ống lồng: nhún bằng lò xo, "chặn" bằng NHỚT',
        p: [
          'Lò xo quyết định xe cứng hay mềm (độ võng tĩnh). Nhưng <b>tốc độ</b> nhún và nhất là '
          + '<b>tốc độ trả về</b> lại do <b>nhớt phuộc</b> bị ép qua các lỗ tiết lưu quyết định.',
          'Nếu chỉ thay lò xo mà không thay nhớt: xe có thể vẫn "cứng" nhưng sẽ <b>nhún trả về quá nhanh</b> '
          + '(bounce) và mất kiểm soát khi qua ổ gà liên tiếp.',
          'Đổ nhớt phuộc thường theo <b>thể tích hoặc mức dầu</b> (đo từ miệng ống khi phuộc nén hết, '
          + 'chưa lắp lò xo). Sai mức dầu làm thay đổi <b>độ nén khí</b> còn lại trong ống -> '
          + 'thay đổi độ cứng ở cuối hành trình.',
        ],
      },
      {
        h: 'Phanh đĩa: nguyên lý Pascal và vì sao không khí là kẻ thù',
        p: [
          'Chất lỏng không nén được: lực bóp ở tay đẩy dầu qua ống đến piston heo dưới. '
          + 'Tỉ số diện tích piston (heo dưới / heo trên) tạo ra <b>khuếch đại lực</b>.',
          '<b>Không khí thì nén được.</b> Một bong bóng trong đường dầu làm toàn bộ hành trình bóp '
          + 'chỉ để nén bong bóng đó -> <b>bóp sát tay mà không phanh</b>. Đó là lý do phải xả e (bleed) '
          + 'thật kỹ.',
          '<b>Dầu phanh hút ẩm (hygroscopic).</b> Nước hấp thụ làm <b>tụt điểm sôi</b>: phanh liên tục '
          + 'khi xuống dốc -> dầu sôi -> sinh bọt -> <b>mất phanh hoàn toàn</b> (vapour lock). '
          + 'Vì vậy dầu phanh phải thay định kỳ 2 năm <b>kể cả khi trông còn sạch</b>.',
        ],
      },
      {
        h: 'Phanh cơ (tang trống): tự cường hoá và vì sao nóng thì kém',
        p: [
          'Má phanh ép vào mặt trong tang trống. Một trong hai má được bố trí sao cho lực ma sát '
          + '<b>tự kéo nó ép mạnh hơn</b> (leading shoe, tự cường hoá) — nhờ vậy phanh cơ nhẹ tay.',
          'Nhược điểm: tang trống kín, <b>nhiệt không thoát ra được</b>. Phanh liên tục -> tang trống '
          + 'nở ra (giãn nhiệt) -> má phanh cách xa hơn -> <b>hành trình tay tăng, lực phanh giảm</b> '
          + '(brake fade). Phanh đĩa thoáng gió nên ít bị hơn.',
        ],
      },
    ],

    specs: [
      ['Tỉ số truyền cuối', 'nhông trước 14T / dĩa sau 35T (tuỳ đời) → ≈ 2,5'],
      ['Loại sên', '428 (bước 12,7 mm) trên phần lớn xe số'],
      ['Độ võng sên', '25–35 mm, đo ở giữa đoạn trên, xe không tải'],
      ['Độ mòn sên', 'Đo chiều dài 20 mắt; vượt ≈ 2% chiều dài chuẩn thì thay cả bộ'],
      ['Độ dày đĩa phanh', 'Giới hạn mòn in trên mặt đĩa (thường ≈ 3,0–3,5 mm)'],
      ['Độ dày má phanh đĩa', 'Thay khi còn ≈ 1,0 mm hoặc đến rãnh chỉ báo'],
      ['Dầu phanh', 'DOT 3 hoặc DOT 4 — <b>thay 2 năm/lần</b> dù còn sạch'],
      ['Hành trình tự do tay/bàn đạp phanh cơ', '≈ 20–30 mm'],
      ['Áp suất lốp', 'Trước ≈ 175 kPa (1,75 kgf/cm²) · Sau ≈ 225 kPa (có chở: 280 kPa)'],
      ['Độ sâu gai lốp tối thiểu', '≈ 1,5 mm (nên thay từ 2 mm)'],
      ['Lực siết trục bánh trước', '≈ 59 N·m (tra sổ tay)'],
      ['Lực siết trục bánh sau', '≈ 59–64 N·m'],
      ['Lực siết đai ốc nhông trước', '≈ 54 N·m'],
    ],

    parts: [
      { name: 'Khung xe (sườn)', nameEn: 'Frame', qty: 1,
        material: 'Ống thép hàn (kiểu backbone / underbone)',
        fn: 'Chịu tải và giữ hình học lái (góc càng, offset) — hình học này quyết định xe '
          + 'có ổn định khi vào cua không.',
        fail: 'Nứt mỏi ở cổ sườn sau và nạng. Sau khi va chạm mạnh phải kiểm độ thẳng khung; '
          + 'khung lệch thì không thể căn chỉnh bằng cách nào khác.' },
      { name: 'Phuộc trước (2 ống)', nameEn: 'Front fork (telescopic)', qty: 2,
        material: 'Ống thép mạ crôm + ống ngoài nhôm/thép, nhớt phuộc, lò xo',
        spec: 'Nhớt theo thể tích hoặc mức dầu (đo khi nén hết, chưa lắp lò xo)',
        fn: 'Hấp thụ xóc và giữ bánh trước tiếp đất liên tục — đây mới là nhiệm vụ chính '
          + '(mất tiếp đất = mất phanh và mất lái).',
        fail: 'Phớt rỉ nhớt -> nhớt bám vào má phanh -> mất phanh. Ống mạ bị rỗ/móp -> phá phớt liên tục.' },
      { name: 'Phớt phuộc + phớt chặn bụi', nameEn: 'Fork oil seal & dust seal', qty: 4,
        material: 'Cao su + khung thép',
        fn: 'Giữ nhớt phuộc và chặn bụi.',
        fail: 'Chắn bụi không được bỏ qua: bụi vào là mài xước ống mạ -> phá phớt mới ngay. '
          + 'Vệ sinh phớt chặn bụi định kỳ kéo dài tuổi thọ phuộc rất nhiều.' },
      { name: 'Phuộc sau (2 giảm chấn)', nameEn: 'Rear shock absorbers', qty: 2,
        material: 'Lò xo ngoài + xy-lanh giảm chấn dầu/khí',
        fn: 'Giảm chấn bánh sau.',
        fail: 'Chảy dầu -> xe "nhún bập bênh" và văng đuôi khi qua ổ gà. '
          + 'THAY CẢ CẶP, không thay lẻ một bên.' },
      { name: 'Gắp sau (càng sau)', nameEn: 'Swingarm', qty: 1,
        material: 'Ống thép hàn',
        spec: 'Trục gắp phải có bạc/ổ bi còn tốt',
        fn: 'Dẫn hướng chuyển động bánh sau theo một cung tròn quanh trục gắp.',
        fail: 'Bạc trục gắp mòn -> bánh sau lắc ngang -> xe "bơi" khi vào cua, và là lỗi '
          + 'dễ bị chẩn đoán sai thành "phuộc yếu".' },
      { name: 'Vòng bi cổ (bearing cổ lái)', nameEn: 'Steering head bearings', qty: 2,
        material: 'Ổ bi cầu hoặc ổ bi côn',
        spec: 'Độ siết phải "vừa khít": không rơ nhưng không nặng tay',
        fn: 'Cho phần đầu xe xoay nhẹ và không rơ.',
        fail: 'Mòn thành vết ở vị trí đi thẳng -> xe có xu hướng "khoá" ở giữa và rung tay lái '
          + '(head shake) ở tốc độ cao. Kiểm tra: kích bánh trước lên, lắc tay lái và nhún '
          + 'phanh trước để tìm độ rơ.' },
      { name: 'Đĩa phanh trước', nameEn: 'Front brake disc', qty: 1,
        material: 'Thép không rỉ',
        spec: 'Giới hạn độ dày IN TRÊN MẶT ĐĨA',
        fn: 'Bề mặt ma sát và là thứ tản nhiệt chính của phanh.',
        fail: 'Mỏng quá giới hạn -> nứt vì nhiệt. Đảo vòng (warp) -> tay phanh đập nhịp. '
          + 'Đo độ dày ở nhiều điểm quanh đĩa bằng panme.' },
      { name: 'Cùm heo phanh + piston', nameEn: 'Brake caliper & piston', qty: 1,
        material: 'Nhôm + piston thép/nhôm + phớt',
        fn: 'Biến áp suất dầu thành lực ép má phanh.',
        fail: 'Piston kẹt do cặn/ôxy hoá -> má phanh bó sát đĩa -> nóng bất thường, '
          + 'hao xăng, mòn nhanh. Kiểm bằng cách quay bánh sau khi thả phanh — '
          + 'phải quay trơn nhiều vòng.' },
      { name: 'Má phanh đĩa (2)', nameEn: 'Brake pads', qty: 2,
        material: 'Vật liệu ma sát hữu cơ / thiêu kết trên đế thép',
        spec: 'Thay khi còn ≈ 1,0 mm hoặc đến rãnh chỉ báo',
        fn: 'Biến động năng thành nhiệt bằng ma sát.',
        fail: 'Mòn hết đến đế thép -> <b>cào xước đĩa</b>, chi phí tăng gấp nhiều lần. '
          + 'Bị nhớt/dầu phanh bám -> mất ma sát, phải thay (không rửa được).' },
      { name: 'Heo phanh trên (xy-lanh chính) + tay phanh', nameEn: 'Master cylinder & lever', qty: 1,
        material: 'Nhôm + piston + cúp cao su',
        fn: 'Tạo áp suất dầu từ lực bóp tay.',
        fail: 'Cúp cao su chai -> tay bóp tụt dần xuống sát. Kiểm bằng cách bóp giữ 30 giây: '
          + 'tay không được tụt.' },
      { name: 'Ống dầu phanh', nameEn: 'Brake hose', qty: 1,
        material: 'Cao su bọc lưới (hoặc bọc thép)',
        spec: 'Cao su có tuổi thọ — thay theo năm, không theo km',
        fn: 'Dẫn áp suất dầu.',
        fail: 'Phình khi bóp -> mất cảm giác và mất lực phanh. Nứt chân chim -> mất phanh đột ngột.' },
      { name: 'Dầu phanh', nameEn: 'Brake fluid', qty: 1,
        material: 'Glycol-ether (DOT 3 / DOT 4)',
        spec: 'HÚT ẨM — thay 2 năm/lần dù còn sạch',
        fn: 'Truyền áp suất.',
        fail: 'Ngấm nước -> tụt điểm sôi -> khi xuống dốc dầu sôi -> <b>mất phanh hoàn toàn</b>. '
          + 'Ngoài ra ăn mòn từ bên trong heo phanh.' },
      { name: 'Má phanh cơ (2) + tang trống', nameEn: 'Brake shoes & drum', qty: 2,
        material: 'Vật liệu ma sát trên đế thép; tang trống bằng thép/nhôm',
        fn: 'Phanh bánh sau (trên nhiều đời xe số).',
        fail: 'Má mòn đến đế -> cào xước tang trống. Bụi má phanh đầy trong tang trống -> '
          + 'giảm ma sát; vệ sinh khi thay má (dùng khí nén thổi ra ngoài, đeo khẩu trang).' },
      { name: 'Cam phanh + cần điều chỉnh', nameEn: 'Brake cam & adjuster', qty: 1,
        material: 'Thép',
        fn: 'Biến chuyển động kéo của dây/thanh thành lực banh 2 má phanh ra.',
        fail: 'Cam khô dầu -> phanh nặng và trả về chậm. Bôi mỡ cam mỗi lần thay má.' },
      { name: 'Nhông trước', nameEn: 'Front sprocket (drive)', qty: 1,
        material: 'Thép tôi', spec: '≈ 14 răng; siết ≈ 54 N·m, có long đen khoá',
        fn: 'Đưa momen từ trục thứ cấp ra sên.',
        fail: 'Mòn nhanh nhất trong bộ (ít răng nhất nên mỗi răng chịu tải nhiều lần hơn). '
          + 'Răng cong hình lưỡi liềm = phải thay cả bộ.' },
      { name: 'Dĩa sau (nhông sau)', nameEn: 'Rear sprocket', qty: 1,
        material: 'Thép hoặc nhôm', spec: '≈ 33–37 răng tuỳ đời',
        fn: 'Nhận momen từ sên về bánh sau.',
        fail: 'Răng mòn nhọn/cong -> nhảy sên. Thay cùng nhông và sên.' },
      { name: 'Sên (xích tải)', nameEn: 'Drive chain', qty: 1,
        material: 'Thép, có thể có o-ring làm kín mỡ',
        spec: 'Loại 428, bước 12,7 mm',
        fn: 'Truyền momen từ nhông sang dĩa.',
        fail: 'Giãn không đều (có đoạn căng đoạn lỏng) = có mắt bị kẹt, phải thay cả bộ. '
          + 'Khô dầu -> mòn cực nhanh.' },
      { name: 'Vòng bi bánh xe (trước + sau)', nameEn: 'Wheel bearings', qty: 4,
        material: 'Ổ bi cầu kín phớt',
        fn: 'Đỡ bánh xe.',
        fail: 'Kẹn/rơ -> bánh lắc ngang. Kiểm: kích bánh lên, lắc ngang tìm độ rơ, '
          + 'quay tay nghe tiếng.' },
      { name: 'Cao su giảm giật may-ơ sau', nameEn: 'Rear hub dampers', qty: 4,
        material: 'Cao su',
        fn: 'Hấp thụ giật khi đóng/cắt momen (nhất là khi vào số).',
        fail: 'Chai -> giật mạnh khi mở/thả ga, và làm sên chịu tải xung. Chi tiết rẻ, hay bị bỏ qua.' },
      { name: 'Lốp + vành', nameEn: 'Tyres & rims', qty: 2,
        material: 'Cao su + vành nan hoa hoặc đúc',
        spec: 'Áp suất trước ≈ 175 kPa, sau ≈ 225 kPa',
        fn: 'Điểm tiếp xúc duy nhất với mặt đường — mọi lực phanh/lái/tăng tốc đều qua đây.',
        fail: 'Non hơi làm lốp nóng, mòn vai lốp và làm xe "bơi". Kiểm áp suất khi lốp NGUỘI, '
          + 'hằng tuần — đây là việc bảo dưỡng hiệu quả nhất so với thời gian bỏ ra.' },
    ],

    steps: [
      { title: 'Kiểm tra định kỳ (10 phút, không dụng cụ chuyên dụng)',
        detail: 'Áp suất lốp (khi nguội) · độ sâu gai lốp · độ võng sên · độ dày má phanh · '
          + 'mức dầu phanh · độ rơ vòng bi cổ · độ rơ bạc gắp sau.',
        tool: 'Đồng hồ đo hơi · thước',
        tip: 'Đây là 10 phút có giá trị an toàn cao nhất trong toàn bộ project này' },
      { title: 'Điều chỉnh độ võng sên',
        detail: 'Nới đai ốc trục bánh sau, xoay 2 ốc tăng đều <b>bằng số vạch hai bên</b> để bánh '
          + 'không lệch. Đặt độ võng 25–35 mm đo ở giữa đoạn trên. Siết lại trục đúng lực.',
        tool: 'Tuýp trục bánh sau · chìa khoá ốc tăng · thước · cần lực',
        torque: 'Trục bánh sau: ≈ 59–64 N·m',
        warn: 'Căng hết độ võng sẽ phá ổ bi trục thứ cấp khi phuộc nhún',
        tip: 'Xoay bánh, đo độ võng ở VÀI vị trí — chỗ căng nhất mới là chỗ tính' },
      { title: 'Vệ sinh · bôi mỡ sên',
        detail: 'Làm sạch bằng bàn chải + dung dịch chuyên dụng (KHÔNG dùng xăng/dung môi mạnh '
          + 'với sên có o-ring). Bôi mỡ khi sên còn ấm, bôi vào MẶT TRONG của sên (phía tiếp xúc răng).',
        tool: 'Bàn chải sên · dung dịch vệ sinh sên · mỡ sên dạng phun',
        warn: 'Dung môi mạnh phá o-ring của sên -> mỡ trong bên trong chảy ra -> sên chết nhanh' },
      { title: 'Đo mòn sên',
        detail: 'Kéo căng một đoạn, đo chiều dài <b>20 mắt</b> liên tiếp, so với chiều dài chuẩn '
          + '(20 × 12,7 = 254 mm với sên 428). Vượt ~2% thì thay.',
        tool: 'Thước lá 300 mm',
        tip: 'Cách nhanh: kéo sên ra khỏi dĩa sau ở điểm 3 giờ. Nhìn thấy chân răng = đã quá hạn' },
      { title: 'Thay bộ nhông – dĩa – sên',
        detail: 'Tháo nhông trước (bẻ vấu long đen khoá, dùng phanh sau giữ bánh để nới đai ốc), '
          + 'tháo trục bánh sau và dĩa, thay cả 3. Long đen khoá THAY MỚI.',
        tool: 'Tuýp 24–27 mm · cần lực',
        torque: 'Nhông trước: ≈ 54 N·m',
        warn: 'Thay lẻ từng món làm mòn chéo — sên mới trên dĩa cũ sẽ mòn trong vài nghìn km' },
      { title: 'Thay má phanh đĩa',
        detail: 'Tháo chốt giữ má, đẩy piston heo về <b>từ từ</b>, lắp má mới. Sau khi lắp: '
          + 'bóp tay phanh nhiều lần cho má áp sát trước khi đi.',
        tool: 'Tuýp/tuốc-nơ-vít · kìm',
        warn: 'BÓP TAY PHANH NHIỀU LẦN trước khi đi — lần bóp đầu tiên chỉ để đưa piston ra, '
          + 'chưa phanh được',
        tip: 'Không để tay phanh bị bóp khi đã tháo má — piston sẽ bật ra khỏi heo' },
      { title: 'Vệ sinh · bảo dưỡng cùm heo phanh',
        detail: 'Tháo heo, đẩy piston ra (dùng áp suất phanh, giữ cẩn thận), làm sạch rãnh phớt, '
          + 'thay phớt piston và phớt chặn bụi, bôi mỡ gốc silicone vào chốt trượt.',
        tool: 'Bộ phớt heo phanh · mỡ silicone chịu nhiệt',
        warn: 'Không dùng mỡ gốc dầu mỏ trên chi tiết cao su phanh — làm phình cao su',
        tip: 'Piston kẹt là nguyên nhân phổ biến của "phanh bó sát, xe nặng, hao xăng"' },
      { title: 'Thay dầu phanh · xả e (bleed)',
        detail: 'Đổ dầu mới vào bình, bóp giữ tay phanh, mở vít xả ở heo cho dầu + bọt ra, '
          + 'đóng vít, nhả tay. Lặp lại đến khi không còn bọt. Luôn giữ bình dầu không cạn.',
        tool: 'Ống nhựa + bình hứng · chìa khoá vòng 8–10 mm · dầu DOT 3/4 mới',
        warn: 'Dầu phanh ĂN MÒN sơn ngay lập tức — phủ giẻ ẩm và rửa nước nếu đổ ra. '
          + 'Bình dầu cạn trong lúc xả sẽ hút khí vào, phải làm lại từ đầu',
        tip: 'Thay dầu phanh 2 năm/lần dù trông còn sạch — đây là yêu cầu an toàn, không phải tuỳ chọn' },
      { title: 'Thay má phanh cơ (tang trống)',
        detail: 'Tháo bánh sau, rút may-ơ phanh, bẻ 2 má ra khỏi cam và lò xo. '
          + 'Làm sạch bụi má phanh (thổi ra ngoài trời, đeo khẩu trang). Bôi mỡ mỏng lên cam và trục.',
        tool: 'Tuýp trục bánh sau · kìm · mỡ chịu nhiệt',
        warn: 'Bụi má phanh không nên hít — thổi ngoài trời và đeo khẩu trang',
        tip: 'Kiểm mặt trong tang trống: có rãnh sâu là phải láng lại hoặc thay' },
      { title: 'Thay nhớt phuộc trước',
        detail: 'Tháo ống phuộc, xả nhớt cũ (nhún nhiều lần cho ra hết), đổ nhớt mới theo '
          + '<b>thể tích hoặc mức dầu</b> ghi trong sổ tay (đo mức dầu khi phuộc nén hết, '
          + 'chưa lắp lò xo).',
        tool: 'Tuýp · ống đong thể tích · thước đo mức dầu',
        warn: 'Hai bên phải bằng nhau chính xác — lệch nhớt làm xe kéo về một bên khi phanh',
        tip: 'Nhớt phuộc cũ ra có màu đen và có mạt kim loại là bình thường; thay mới ~2 năm' },
      { title: 'Thay phớt phuộc',
        detail: 'Tháo ống trong, dùng dụng cụ đóng phớt (seal driver) để đóng phớt mới vào thẳng. '
          + 'Kiểm tra ống mạ: nếu rỗ/móp thì thay phớt bao nhiêu lần cũng rỉ lại.',
        tool: 'Dụng cụ đóng phớt · vam giữ',
        warn: 'Ống mạ bị rỗ là phải xử lý ống, không phải xử lý phớt' },
      { title: 'Kiểm tra / điều chỉnh vòng bi cổ lái',
        detail: 'Kích bánh trước khỏi mặt đất. Lắc tay lái hết trái hết phải — phải nhẹ đều, '
          + 'không "sựt" ở giữa. Bóp phanh trước và nhún mạnh — không được có tiếng "cục" (độ rơ).',
        tool: 'Con đội/kê · chìa khoá vòng bi cổ',
        tip: 'Độ siết đúng là: nhẹ đều, không rơ. Siết chặt quá sẽ làm mòn thành vết rất nhanh' },
      { title: 'Kiểm tra bạc trục gắp sau',
        detail: 'Kích bánh sau lên, nắm gắp sau lắc theo phương NGANG. Có độ rơ = bạc/ổ bi mòn.',
        tool: 'Con đội',
        tip: 'Lỗi này thường bị chẩn đoán sai thành "phuộc sau yếu"' },
    ],

    symptoms: [
      { sign: 'Bóp phanh sát tay mà không ăn',
        cause: 'Còn khí trong đường dầu (chưa xả e hết) hoặc cúp cao su heo trên chai.',
        fix: 'Xả e lại. Nếu bóp giữ 30 giây mà tay tụt dần -> thay bộ cúp heo trên.' },
      { sign: 'Phanh mất dần khi xuống dốc dài',
        cause: 'Dầu phanh ngấm nước -> sôi -> sinh bọt (vapour lock). Hoặc má phanh quá nhiệt (fade).',
        fix: '<b>Thay dầu phanh ngay.</b> Đồng thời học cách dùng phanh động cơ khi xuống dốc '
          + 'thay vì giữ phanh liên tục.' },
      { sign: 'Tay phanh đập nhịp theo vòng bánh',
        cause: 'Đĩa phanh bị đảo vòng (warp), thường do siết bu lông đĩa không đều hoặc đĩa quá nóng '
          + 'rồi gặp nước.',
        fix: 'Đo độ đảo bằng đồng hồ so. Vượt giới hạn -> thay đĩa.' },
      { sign: 'Xe nặng, bánh trước ấm, hao xăng bất thường',
        cause: 'Piston heo phanh kẹt -> má bó sát đĩa liên tục.',
        fix: 'Kích bánh trước, quay bằng tay: phải quay được nhiều vòng. Nếu dừng ngay -> '
          + 'bảo dưỡng cùm heo.' },
      { sign: 'Rung tay lái ở tốc độ cao (head shake)',
        cause: 'Vòng bi cổ mòn thành vết · vành không tròn · lốp mòn không đều · phuộc lệch nhớt.',
        fix: 'Kiểm vòng bi cổ trước (rẻ nhất và hay đúng nhất).' },
      { sign: 'Xe "bơi", văng đuôi khi vào cua',
        cause: 'Bạc trục gắp sau mòn · vòng bi bánh sau rơ · phuộc sau chảy dầu · lốp non hơi.',
        fix: 'Kiểm theo thứ tự: áp suất lốp -> vòng bi bánh -> bạc gắp -> phuộc.' },
      { sign: 'Tiếng "cách cách" từ sên, giật khi mở/thả ga',
        cause: 'Sên giãn không đều / độ võng quá lỏng / cao su giảm giật may-ơ sau chai.',
        fix: 'Đo độ võng ở nhiều điểm. Nếu căng-lỏng không đều -> thay cả bộ. '
          + 'Kiểm cao su giảm giật khi tháo dĩa sau.' },
      { sign: 'Nhớt chảy xuống ống phuộc, má phanh trước mất ăn',
        cause: 'Phớt phuộc rỉ; nhớt bám vào má phanh.',
        fix: 'Thay phớt và <b>thay má phanh</b> (má đã ngấm nhớt không rửa được). '
          + 'Kiểm ống mạ phuộc có bị rỗ không.' },
      { sign: 'Lốp mòn lệch về một bên ta-lông',
        cause: 'Áp suất sai lâu ngày, hoặc bánh sau lệch do điều chỉnh sên không đều 2 bên.',
        fix: 'Kiểm áp suất. Kiểm độ thẳng bánh sau bằng số vạch 2 ốc tăng hoặc căng dây.' },
    ],

    related: ['gearbox', 'crank-case'],
  },
};
