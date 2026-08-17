/**
 * Hệ thống 06 — Hệ thống bôi trơn.
 */

export default {
  mode: 'doc',
  slug: 'lubrication',
  doc: {
    lead: 'Hệ thống nhỏ nhất nhưng gây nhiều hư hỏng nhất khi bỏ bê. Điểm quan trọng '
      + 'nhất cần biết: <b>xe số phổ thông KHÔNG có lọc nhớt dạng giấy</b> — nó chỉ có '
      + 'một lưới lọc và một bộ lọc li tâm. Điều đó quyết định hoàn toàn chu kỳ thay nhớt.',

    theory: [
      {
        h: 'Nhớt làm 5 việc, không phải 1',
        ol: [
          '<b>Bôi trơn</b> — tách hai bề mặt kim loại bằng một màng dầu.',
          '<b>Làm mát</b> — đưa nhiệt từ piston, xupap, ly hợp ra vỏ máy. Trên động cơ làm mát '
          + 'bằng không khí, đây là đường tản nhiệt <b>chính</b> của những chỗ không tiếp xúc gió.',
          '<b>Làm sạch</b> — cuốn theo muội than và mạt kim loại về lọc.',
          '<b>Làm kín</b> — bít khe hở giữa xéc-măng và thành xy-lanh, góp phần giữ áp suất nén.',
          '<b>Truyền ma sát cho ly hợp ướt</b> — đây là lý do nhớt xe máy phải đạt chuẩn JASO MA.',
        ],
      },
      {
        h: 'Đường nhớt: từ các-te lên đến đầu bò',
        ol: [
          'Nhớt đọng ở đáy lốc máy (các-te ướt).',
          'Bơm bánh răng (dẫn động từ trục khuỷu) hút nhớt qua <b>lưới lọc</b>.',
          'Nhớt đẩy vào <b>bộ lọc li tâm</b> — một buồng quay theo trục khuỷu, lực li tâm ném '
          + 'các hạt nặng ra thành buồng, nhớt sạch hơn đi ra ở giữa.',
          'Nhớt theo <b>đường khoan trong trục khuỷu</b> đến ổ bi đầu to tay biên.',
          'Một nhánh lên <b>cổ trục cam và trục cò mổ</b> qua rãnh/lỗ khoan trong đầu bò.',
          'Nhớt rơi tự do về các-te. Ly hợp, hộp số, dây cam được bôi trơn chủ yếu bằng '
          + '<b>nhớt bắt toé</b> (splash) do các bánh răng đánh lên.',
        ],
      },
      {
        h: 'Bộ lọc li tâm — và vì sao phải vệ sinh nó',
        p: [
          'Bộ lọc li tâm là một buồng quay gắn trên trục khuỷu bên phải. Nhớt vào giữa, quay '
          + 'theo, các hạt kim loại và muội than nặng hơn bị ném ra sát thành và <b>dính lại ở đó</b>.',
          'Nó không có lõi lọc thay được. Sau nhiều nghìn km, lớp cặn dày lên ~2–5 mm và bộ lọc '
          + '<b>hết tác dụng hoàn toàn</b>. Từ đó trở đi, nhớt bẩn chảy trực tiếp đến ổ bi.',
          '<b>Vì vậy:</b> vệ sinh bộ lọc li tâm mỗi ~10.000–15.000 km (mỗi lần mở vỏ ly hợp). '
          + 'Đây là công việc bị bỏ qua nhiều nhất trên xe số, và là nguyên nhân âm thầm của '
          + '"máy nhanh xuống" dù vẫn thay nhớt định kỳ.',
        ],
      },
      {
        h: 'Không có lọc giấy => chu kỳ thay nhớt ngắn hơn',
        p: [
          'Trên động cơ có lọc giấy, lọc giữ lại hạt bẩn đến ~10 µm. Xe số chỉ có lưới lọc '
          + '(giữ hạt lớn) + lọc li tâm (giữ hạt nặng). Hạt bẩn nhỏ vẫn tuần hoàn trong nhớt.',
          'Đó là lý do sổ tay xe số thường ghi thay nhớt mỗi <b>1.000–2.000 km</b> chứ không phải '
          + '5.000–10.000 km như ô tô. Kéo dài chu kỳ là cách nhanh nhất để mòn ổ bi đầu to tay biên.',
        ],
      },
      {
        h: 'Đọc độ nhớt: 10W-30 nghĩa là gì',
        ul: [
          '<b>10W</b> — độ nhớt khi LẠNH ("W" = winter). Số nhỏ = lỏng hơn khi nguội = dễ bơm '
          + 'đi khắp máy trong những giây đầu tiên sau khi đề. Phần lớn mài mòn xảy ra ở giây đó.',
          '<b>30</b> — độ nhớt ở 100 °C. Số lớn hơn giữ màng dầu tốt hơn khi nóng nhưng tăng tổn thất '
          + 'ma sát và làm máy nặng hơn.',
          '<b>JASO MA / MA2</b> — chuẩn ma sát cho <b>ly hợp ướt</b>. Bắt buộc. Nhớt ô tô gắn nhãn '
          + '"Resource Conserving / Energy Conserving" có phụ gia giảm ma sát sẽ làm ly hợp TRƯỢT.',
        ],
      },
    ],

    specs: [
      ['Kiểu bôi trơn', 'Cưỡng bức bằng bơm bánh răng + bắt toé (các-te ướt)'],
      ['Kiểu lọc', 'Lưới lọc + bộ lọc li tâm. KHÔNG có lõi lọc giấy'],
      ['Dung tích thay định kỳ', '≈ 0,8 L'],
      ['Dung tích khi tháo cả máy', '≈ 0,9 L'],
      ['Cấp nhớt khuyến nghị', '10W-30 (hoặc theo sổ tay), API SL trở lên, JASO MA/MA2'],
      ['Chu kỳ thay nhớt', '≈ 1.000–2.000 km (do không có lọc giấy)'],
      ['Vệ sinh bộ lọc li tâm', 'Mỗi ≈ 10.000–15.000 km'],
      ['Lực siết bu lông xả nhớt', '≈ 24 N·m — thay long đen làm kín mỗi lần'],
      ['Kiểu bơm', 'Bơm bánh răng ăn trong (trochoid/gerotor), dẫn động từ trục khuỷu'],
    ],

    parts: [
      { name: 'Bơm nhớt (bánh răng ăn trong)', nameEn: 'Oil pump (trochoid)', qty: 1,
        material: 'Vỏ nhôm, rôto trong/ngoài bằng thép thiêu kết',
        spec: 'Khe hở đỉnh răng / khe hở thân / khe hở cạnh — đo khi đại tu',
        fn: 'Tạo lưu lượng nhớt. Lưu ý: bơm này tạo LƯU LƯỢNG, áp suất sinh ra là do sức cản '
          + 'của đường nhớt phía sau.',
        fail: 'Khe hở mòn -> lưu lượng tụt ở vòng tua thấp -> gõ đầu bò khi không tải. '
          + 'Đo 3 khe hở bằng lá căn.' },
      { name: 'Bánh răng / nhông dẫn động bơm', nameEn: 'Oil pump drive gear', qty: 1,
        material: 'Thép hoặc nhựa kỹ thuật',
        fn: 'Nhận dẫn động từ trục khuỷu (hoặc từ chuông ly hợp) để quay bơm.',
        fail: 'Răng nhựa vỡ -> bơm ngừng hoàn toàn -> máy bó trong vài phút. '
          + 'Kiểm tra bắt buộc mỗi lần mở vỏ phải.' },
      { name: 'Lưới lọc nhớt (ở các-te)', nameEn: 'Oil strainer screen', qty: 1,
        material: 'Lưới thép + khung',
        fn: 'Chặn mảnh kim loại lớn trước khi vào bơm.',
        fail: 'Tắc -> bơm hút không được -> tụt áp suất. Vệ sinh mỗi lần tách máy.' },
      { name: 'Bộ lọc li tâm (buồng + nắp)', nameEn: 'Centrifugal oil filter', qty: 1,
        material: 'Thép, gắn trên trục khuỷu bên phải',
        spec: 'Không có lõi lọc thay thế — chỉ vệ sinh',
        fn: 'Ném hạt bẩn nặng ra thành buồng bằng lực li tâm.',
        fail: 'Đầy cặn (2–5 mm) -> hết tác dụng -> nhớt bẩn đi trực tiếp đến ổ bi đầu to. '
          + 'Vệ sinh mỗi 10.000–15.000 km.' },
      { name: 'Nắp bộ lọc li tâm + o-ring', nameEn: 'Centrifugal filter cap', qty: 1,
        material: 'Thép + o-ring cao su',
        fn: 'Đóng kín buồng lọc.',
        fail: 'O-ring chai -> nhớt lọt qua không được lọc. Thay o-ring khi vệ sinh.' },
      { name: 'Bu lông xả nhớt + long đen làm kín', nameEn: 'Drain bolt & crush washer', qty: 1,
        material: 'Thép + long đen nhôm/đồng biến dạng',
        spec: 'Siết ≈ 24 N·m',
        fn: 'Xả nhớt cũ.',
        fail: 'Dùng lại long đen cũ -> rỉ nhớt. Siết quá -> trượt ren nhôm lốc máy (hư hỏng đắt). '
          + 'Long đen là chi tiết dùng MỘT LẦN.' },
      { name: 'Que thăm nhớt / kính thăm', nameEn: 'Dipstick / sight glass', qty: 1,
        material: 'Nhựa + o-ring',
        spec: 'Đo khi xe ĐỨNG THẲNG, máy đã tắt 2–3 phút',
        fn: 'Kiểm mức nhớt.',
        fail: 'Đo khi xe dựng chân chống nghiêng -> kết luận sai mức nhớt (thường là thấy thiếu '
          + 'nên đổ thêm quá nhiều).' },
      { name: 'Đường khoan nhớt trong trục khuỷu', nameEn: 'Crankshaft oil galleries', qty: 1,
        material: 'Lỗ khoan trong trục',
        fn: 'Dẫn nhớt có áp đến ổ bi đầu to tay biên.',
        fail: 'Tắc do cặn/muội than -> ổ bi đầu to chết dù còn đủ nhớt trong máy. '
          + 'Thông bằng khí nén mỗi lần tách máy.' },
      { name: 'Đường nhớt lên đầu bò', nameEn: 'Cylinder head oil feed', qty: 1,
        material: 'Lỗ khoan / ống dẫn qua xy-lanh',
        fn: 'Cấp nhớt cho cổ trục cam và trục cò mổ.',
        fail: 'Tắc -> mòn vấu cam và cò mổ rất nhanh. Kiểm bằng cách để máy nổ không tải '
          + 'với nắp đầu bò mở — phải thấy nhớt rỉ ra ở trục cò mổ.' },
      { name: 'Van an toàn (van xả áp)', nameEn: 'Relief valve', qty: 1,
        material: 'Bi/piston thép + lò xo',
        fn: 'Xả nhớt về các-te khi áp suất vượt mức — bảo vệ phớt và đường nhớt khi máy nguội '
          + '(nhớt đặc, sức cản cao).',
        fail: 'Kẹt mở -> áp suất không lên được. Kẹt đóng -> áp suất quá cao, bung phớt.' },
      { name: 'Gioăng / o-ring đường nhớt', nameEn: 'Oil passage o-rings', qty: 3,
        material: 'Cao su chịu nhiệt',
        fn: 'Làm kín các điểm chuyển đường nhớt giữa lốc máy – xy-lanh – đầu bò.',
        fail: 'Chai -> mất áp suất nội bộ, đầu bò thiếu nhớt dù mức nhớt các-te vẫn đủ.' },
    ],

    steps: [
      { title: 'Thay nhớt định kỳ (không cần tháo gì)',
        detail: 'Cho máy ấm (không nóng rẫy) để nhớt chảy hết. Xả nhớt, THAY LONG ĐEN LÀM KÍN, '
          + 'siết lại 24 N·m, đổ 0,8 L nhớt JASO MA/MA2.',
        tool: 'Tuýp 12 mm · khay · phễu · long đen làm kín mới',
        torque: 'Bu lông xả: ≈ 24 N·m',
        warn: 'Dùng lại long đen cũ là nguyên nhân rỉ nhớt phổ biến nhất',
        tip: 'Đo mức nhớt khi xe ĐỨNG THẲNG, máy tắt 2–3 phút' },
      { title: 'Kiểm mức và chất lượng nhớt',
        detail: 'Nhớt đen như cà phê là bình thường sau vài trăm km. Nhớt có <b>ánh kim</b> '
          + 'khi soi đèn = có mạt kim loại. Nhớt đặc sánh / như màu nâu sữa = có nước.',
        tool: 'Que thăm · đèn pin',
        tip: 'Chấm một giọt lên giấy trắng: quầng lan rộng = còn phụ gia; đọng lại một cục = hết' },
      { title: 'Xả nhớt để vào hệ thống',
        detail: 'Các bước sau đều cần xả hết nhớt trước.',
        tool: 'Tuýp 12 mm' },
      { title: 'Tháo vỏ ly hợp bên phải',
        detail: 'Nới bu lông đối xứng, ghi nhớ vị trí bu lông khác chiều dài.',
        tool: 'Tuýp 8 mm · búa cao su' },
      { title: 'Vệ sinh bộ lọc li tâm',
        detail: 'Tháo nắp buồng lọc (thường bắt bằng 3–4 vít). Cạo sạch lớp cặn dính ở thành buồng '
          + 'bằng que nhựa/giẻ. Rửa bằng dung môi, thổi khí nén. Thay o-ring nắp.',
        tool: 'Tuốc-nơ-vít / tuýp 8 mm · dung môi · khí nén · o-ring mới',
        warn: 'Đây là bước bị bỏ qua nhiều nhất trên xe số',
        tip: 'Lớp cặn dày 2–5 mm nghĩa là bộ lọc đã hết tác dụng từ lâu' },
      { title: 'Kiểm nhông dẫn động bơm nhớt',
        detail: 'Quay bằng tay, kiểm răng (nhất là nếu là bánh răng nhựa) và kiểm then/chốt dẫn động.',
        tool: 'Đèn pin',
        warn: 'Răng nhựa vỡ -> bơm ngừng -> máy bó trong vài phút chạy' },
      { title: 'Tháo bơm nhớt',
        detail: 'Tháo 2–3 bu lông giữ bơm, rút cả bộ bơm ra. Ghi nhớ chiều lắp rôto.',
        tool: 'Tuýp 8 mm',
        tip: 'Chụp ảnh chiều lắp rôto trong/ngoài trước khi tháo rời' },
      { title: 'Đo 3 khe hở của bơm',
        detail: 'Tháo nắp bơm. Đo bằng lá căn: (a) khe hở đỉnh răng giữa rôto trong và ngoài, '
          + '(b) khe hở giữa rôto ngoài và thân bơm, (c) khe hở cạnh (đo bằng căn phẳng đặt '
          + 'trên mặt bơm + lá căn).',
        tool: 'Lá căn · căn phẳng',
        tip: 'Vượt giới hạn -> thay CẢ BỘ bơm, không sửa lẻ' },
      { title: 'Vệ sinh lưới lọc nhớt',
        detail: 'Nếu lưới lọc nằm trong các-te thì phải tách lốc máy (hệ thống 03). '
          + 'Một số đời có thể tiếp cận qua nắp dưới.',
        tool: 'Bàn chải mềm · dung môi · khí nén' },
      { title: 'Thông các đường nhớt bằng khí nén',
        detail: 'Khi đã tách máy: thổi khí nén qua đường khoan trong trục khuỷu và đường nhớt '
          + 'lên đầu bò. Phải thấy khí ra đầu bên kia.',
        tool: 'Khí nén · kính bảo hộ',
        warn: 'Đường nhớt lên đầu bò bị tắc làm mòn vấu cam rất nhanh' },
      { title: 'Lắp lại · kiểm tra có nhớt lên đầu bò',
        detail: 'Sau khi lắp và đổ nhớt: tháo nắp đầu bò, nổ máy không tải 30 giây. '
          + '<b>Phải thấy nhớt rỉ ra ở trục cò mổ.</b> Nếu không có, TẮT MÁY NGAY và tìm nguyên nhân.',
        warn: 'Đây là bước kiểm tra bắt buộc sau mỗi lần làm đường nhớt',
        tip: 'Kiểm tra này mất 1 phút và cứu được cả cái đầu bò' },
    ],

    symptoms: [
      { sign: 'Gõ đầu bò khi máy không tải, hết khi lên ga',
        cause: 'Lưu lượng nhớt thấp ở vòng tua thấp: bơm mòn, lưới lọc bẩn, bộ lọc li tâm tắc, '
          + 'mức nhớt thiếu, hoặc nhớt quá lỏng do đã bị loãng.',
        fix: 'Kiểm mức nhớt và thay nhớt trước. Nếu còn -> mở vỏ phải, vệ sinh lọc li tâm, '
          + 'đo khe hở bơm.' },
      { sign: 'Nhớt đen rất nhanh (chỉ sau vài trăm km)',
        cause: 'Muội than nhiều do đốt cháy không tốt (giàu xăng / xéc-măng mòn), '
          + 'hoặc bộ lọc li tâm đã hết tác dụng.',
        fix: 'Vệ sinh lọc li tâm. Kiểm áp suất nén (hệ thống 02) và tình trạng bugi (hệ thống 07).' },
      { sign: 'Nhớt màu nâu sữa, đặc sánh',
        cause: 'Có nước lẫn vào — thường do đi đường ngập, hoặc ống thở (breather) hút nước.',
        fix: 'Thay nhớt ngay 2 lần liên tiếp (lần đầu để rửa). Kiểm đường ống thở và phớt.' },
      { sign: 'Hao nhớt mà không thấy rỉ ở ngoài',
        cause: 'Nhớt bị đốt: xéc-măng dầu mòn (hệ thống 02) hoặc phớt thân xupap (hệ thống 01).',
        fix: 'Xem khói xả. Khói xanh khi thả ga -> phớt thân xupap. Khói xanh liên tục -> xéc-măng.' },
      { sign: 'Rỉ nhớt ở bu lông xả',
        cause: 'Long đen làm kín dùng lại, hoặc ren đã bị trượt do siết quá tay.',
        fix: 'Thay long đen mới. Nếu ren đã trượt -> ta-rô lại hoặc cấy ren (không siết mạnh hơn).' },
      { sign: 'Máy nóng bất thường, mất công suất khi chạy đường dài',
        cause: 'Nhớt không còn làm mát được: đã quá hạn, mức thiếu, hoặc dùng cấp độ nhớt sai.',
        fix: 'Thay nhớt đúng cấp. Nhớ rằng trên động cơ làm mát gió, nhớt là đường tản nhiệt chính '
          + 'của nhiều chi tiết.' },
    ],

    related: ['crank-case', 'piston-cylinder', 'clutch', 'cylinder-head'],
  },
};
