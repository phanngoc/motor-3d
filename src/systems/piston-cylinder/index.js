/**
 * Hệ thống 02 — Xy-lanh, piston & tay biên.
 * Chế độ tài liệu: `parts` và `steps` ở đây có thể copy thẳng sang parts.js /
 * steps.js khi dựng hình học 3D.
 */

export default {
  mode: 'doc',
  slug: 'piston-cylinder',
  doc: {
    lead: 'Đây là nơi áp suất cháy biến thành lực — và cũng là nhóm chi tiết mài mòn '
      + 'nhanh nhất trong động cơ. Hiểu được quan hệ bore–stroke–xéc-măng là hiểu '
      + 'được phần lớn nguyên nhân "máy yếu, hao nhớt, khói xanh".',

    theory: [
      {
        h: 'Biến áp suất thành momen: cơ cấu thanh truyền – tay quay',
        p: [
          'Piston chỉ biết đi lên và đi xuống. Tay biên và trục khuỷu biến chuyển động '
          + 'thẳng đó thành chuyển động quay. Vị trí piston theo góc trục khuỷu θ:',
          '<code>y = R·cosθ + √(L² − (R·sinθ)²)</code> với <code>R</code> = nửa hành trình '
          + '(27,8 mm) và <code>L</code> = chiều dài tay biên (~92 mm).',
          'Hậu quả quan trọng của công thức này: chuyển động piston <b>không đối xứng</b>. '
          + 'Piston đi nửa trên của hành trình nhanh hơn nửa dưới. Đó là lý do lực quán tính '
          + 'ở điểm chết trên lớn hơn nhiều so với điểm chết dưới, và là lý do tay biên '
          + 'thường đứt ở gần điểm chết trên khi máy quá tua.',
        ],
      },
      {
        h: 'Ba xéc-măng, ba nhiệm vụ khác nhau',
        p: ['Nhiều người tưởng 3 xéc-măng cùng làm một việc. Không phải:'],
        ol: [
          '<b>Xéc-măng khí thứ 1 (trên cùng)</b> — chặn áp suất cháy. Chịu nhiệt cao nhất, '
          + 'mặt ngoài thường mạ crôm.',
          '<b>Xéc-măng khí thứ 2</b> — chặn phần áp suất còn lọt qua vòng 1, đồng thời gạt '
          + 'nhớt xuống. Thường có mặt vát lệch (mặt vát phải lắp hướng XUỐNG).',
          '<b>Xéc-măng dầu (oil ring, 3 mảnh)</b> — gạt nhớt trên thành xy-lanh về các-te, '
          + 'chỉ để lại một lớp màng cực mỏng để bôi trơn. Vòng này quyết định xe có '
          + 'hao nhớt hay không.',
        ],
      },
      {
        h: 'Khe hở miệng xéc-măng: không được bằng 0',
        p: [
          'Khi lắp xéc-măng vào xy-lanh, hai đầu miệng phải có khe hở (thường 0,15–0,35 mm '
          + 'đo bằng lá căn trong lòng xy-lanh). Nếu không có khe: khi nóng, xéc-măng giãn '
          + 'dài ra, hai đầu đẩy nhau, vòng bị bó cong và <b>xước dọc thành xy-lanh</b> — '
          + 'hư hỏng không thể sửa, phải doa lại xy-lanh.',
          'Ba miệng xéc-măng khi lắp phải <b>lệch nhau</b> (thường 120°) và không đặt miệng '
          + 'trùng với cửa nạp/xả hoặc chốt piston.',
        ],
      },
      {
        h: 'Vì sao xy-lanh mòn thành hình ô-van, không phải hình tròn',
        p: [
          'Lực khí cháy đẩy piston xuống, tay biên nghiêng nên sinh một lực ngang ép piston '
          + 'vào một bên thành xy-lanh (phía "thrust side"). Vì vậy xy-lanh mòn nhiều theo '
          + 'phương <b>vuông góc với trục chốt piston</b> và mòn ít theo phương dọc trục chốt.',
          'Đó là lý do khi kiểm tra phải đo đường kính lòng xy-lanh <b>ở 2 phương vuông góc, '
          + 'tại 3 độ cao</b> (trên – giữa – dưới) rồi lấy hiệu lớn nhất làm độ ô-van.',
        ],
      },
      {
        h: 'Chốt piston kiểu trôi tự do (full-floating)',
        p: [
          'Chốt piston không ép chặt vào piston cũng không ép chặt vào tay biên — nó quay '
          + 'tự do trong cả hai, được giữ lại bằng 2 khoá hình chữ C ở hai đầu.',
          'Ưu điểm: mài mòn đều, bôi trơn tốt. Nhược điểm khi sửa chữa: <b>khoá chốt rất dễ '
          + 'bay mất vào trong lốc máy</b>. Luôn che miệng lốc máy bằng giẻ trước khi tháo khoá.',
        ],
      },
    ],

    specs: [
      ['Đường kính lòng xy-lanh (bore)', '50,00 mm (giới hạn mòn ≈ 50,05 mm)'],
      ['Hành trình (stroke)', '55,6 mm — động cơ "long-stroke"'],
      ['Dung tích', '109,1 cm³'],
      ['Tỉ số nén', '9,0 : 1'],
      ['Khe hở piston – xy-lanh', '0,015–0,050 mm (đo ở phương vuông góc chốt piston)'],
      ['Khe hở miệng xéc-măng', '0,15–0,35 mm (tham khảo, đo trong lòng xy-lanh)'],
      ['Khe hở cạnh xéc-măng trong rãnh', '0,015–0,050 mm'],
      ['Chiều dài tay biên', '≈ 92 mm (tâm–tâm)'],
      ['Độ đảo đầu to tay biên', 'radial ≤ 0,05 mm · axial 0,10–0,40 mm'],
    ],

    parts: [
      { name: 'Xy-lanh (lòng máy)', nameEn: 'Cylinder', qty: 1,
        material: 'Vỏ nhôm đúc + ống lót gang ép', spec: 'Ø50 mm, có cánh tản nhiệt',
        fn: 'Dẫn hướng piston, chặn kín buồng đốt bên, dẫn nhiệt ra không khí.',
        fail: 'Xước dọc (do xéc-măng bó hoặc hút bụi), mòn ô-van, dính piston khi thiếu nhớt.' },
      { name: 'Piston', nameEn: 'Piston', qty: 1,
        material: 'Nhôm hợp kim đúc, phủ graphite mặt bên',
        spec: 'Cao nén ≈ 20 mm; rãnh chốt Ø13 mm',
        fn: 'Nhận áp suất cháy, truyền qua chốt xuống tay biên.',
        fail: 'Mòn mặt bên, vỡ đầu rãnh xéc-măng, cháy dính (do nghèo/quá nhiệt).' },
      { name: 'Xéc-măng khí số 1', nameEn: 'Top compression ring', qty: 1,
        material: 'Gang hợp kim, mặt ngoài mạ crôm',
        fn: 'Chặn áp suất cháy — vòng quyết định áp suất nén đo được.',
        fail: 'Mất đàn hồi / bó kẹp muội than -> nén tụt, khó nổ khi nguội.' },
      { name: 'Xéc-măng khí số 2', nameEn: 'Second compression ring', qty: 1,
        material: 'Gang, mặt vát lệch (taper)',
        spec: 'Mặt vát lắp hướng XUỐNG',
        fn: 'Chặn áp suất lọt qua vòng 1 và gạt nhớt xuống.',
        fail: 'Lắp ngược mặt vát -> bơm nhớt lên buồng đốt, hao nhớt ngay.' },
      { name: 'Xéc-măng dầu (3 mảnh)', nameEn: 'Oil control ring', qty: 1,
        material: 'Thép — 2 vòng gạt + 1 vòng đàn hồi giữa',
        fn: 'Gạt nhớt về các-te, chỉ giữ lại màng mỏng để bôi trơn.',
        fail: 'Vòng đàn hồi yếu -> hao nhớt, khói xanh, muội than đầy buồng đốt.' },
      { name: 'Chốt piston', nameEn: 'Piston pin', qty: 1,
        material: 'Thép thấm cacbon, ruột rỗng', spec: 'Ø13 mm, kiểu trôi tự do',
        fn: 'Khớp bản lề giữa piston và đầu nhỏ tay biên.',
        fail: 'Mòn ô-van -> tiếng gõ nhẹ theo vòng tua, rõ nhất khi thả ga.' },
      { name: 'Khoá chốt piston (2)', nameEn: 'Piston pin clips', qty: 2,
        material: 'Thép lò xo, hình chữ C',
        fn: 'Chặn chốt piston không dịch ngang để đầu chốt không cào thành xy-lanh.',
        fail: 'Lắp không vào hết rãnh -> bật ra khi máy chạy -> chốt cào xước xy-lanh. '
          + 'Luôn THAY MỚI khoá chốt khi tháo.' },
      { name: 'Tay biên (thanh truyền)', nameEn: 'Connecting rod', qty: 1,
        material: 'Thép rèn', spec: 'Đầu to liền khối với trục khuỷu rời (không tách được)',
        fn: 'Truyền lực từ piston xuống chốt khuỷu.',
        fail: 'Độ đảo đầu to vượt giới hạn -> phải thay CẢ trục khuỷu (vì là trục khuỷu rời).' },
      { name: 'Bạc đầu nhỏ tay biên', nameEn: 'Small-end bush', qty: 1,
        material: 'Đồng thanh',
        fn: 'Ổ trượt cho chốt piston.', fail: 'Mòn -> gõ đầu piston.' },
      { name: 'Ổ bi kim đầu to tay biên', nameEn: 'Big-end needle bearing', qty: 1,
        material: 'Ổ bi kim thép',
        fn: 'Đỡ đầu to tay biên trên chốt khuỷu với ma sát cực nhỏ.',
        fail: 'Vỡ -> tiếng gõ nặng ở dưới máy, phải thay cả trục khuỷu.' },
      { name: 'Gioăng chân xy-lanh', nameEn: 'Cylinder base gasket', qty: 1,
        material: 'Giấy amiăng / vật liệu đàn',
        spec: 'Độ dày gioăng này ảnh hưởng TRỰC TIẾP đến tỉ số nén và pha phối khí',
        fn: 'Làm kín giữa xy-lanh và lốc máy.',
        fail: 'Thay gioăng dày hơn -> giảm tỉ số nén và làm trễ pha cam. Phải dùng đúng loại.' },
      { name: 'Chốt dẫn hướng (2)', nameEn: 'Dowel pins', qty: 2,
        material: 'Thép',
        fn: 'Định vị chính xác xy-lanh so với lốc máy — bu lông chỉ giữ chặt, KHÔNG định vị.',
        fail: 'Bỏ sót -> xy-lanh lệch tâm, piston va thành không đều.' },
    ],

    steps: [
      { title: 'Hoàn tất toàn bộ hệ thống 01 (đầu bò)',
        detail: 'Xy-lanh chỉ ra được sau khi đầu bò đã ra. Xem trang 01 để biết chi tiết.',
        tip: 'Dây cam phải đang được treo bằng dây kẽm' },
      { title: 'Xả nhớt máy',
        detail: 'Tháo bu lông xả nhớt, xả hết khi máy còn ấm cho nhớt chảy nhanh.',
        tool: 'Tuýp 12 mm · khay đựng nhớt', torque: 'Khi lắp: ≈ 24 N·m',
        tip: 'Thay long đen làm kín (crush washer) của bu lông xả' },
      { title: 'Tháo bộ căng dây cam khỏi xy-lanh',
        detail: 'Nếu chưa tháo ở bước làm đầu bò thì tháo hẳn ra lúc này.',
        tool: 'Tuýp 8 mm' },
      { title: 'Nhấc xy-lanh lên khỏi lốc máy',
        detail: 'Kéo thẳng lên theo hướng trục. Nếu chặt: gõ nhẹ búa cao su vào bệ tản nhiệt, '
          + 'không nảy tua-vít vào mặt lắp.',
        tool: 'Búa cao su',
        warn: 'Giữ piston bằng tay khi xy-lanh rời ra — để piston đập vào miệng lốc máy là nứt chân piston',
        tip: 'Luôn nhét giẻ sạch vào miệng lốc máy NGAY sau khi xy-lanh ra' },
      { title: 'Tháo gioăng chân xy-lanh + 2 chốt dẫn hướng',
        detail: 'Ghi nhớ vị trí 2 chốt dẫn hướng. Gioăng thay mới.',
        warn: 'Chốt dẫn hướng rất dễ tuột xuống lốc máy' },
      { title: 'Tháo 1 khoá chốt piston',
        detail: 'Dùng tua-vít nhỏ hoặc kìm mỏ nhọn nảy khoá chữ C ra. Chỉ cần tháo MỘT bên.',
        tool: 'Tua-vít đầu nhỏ · kìm mỏ nhọn · kính bảo hộ',
        warn: 'Khoá chốt bật rất mạnh và rất dễ rơi vào lốc máy — che miệng lốc máy trước',
        tip: 'Khoá chốt BẮT BUỘC thay mới khi lắp lại' },
      { title: 'Đẩy chốt piston ra · lấy piston',
        detail: 'Đẩy chốt bằng ngón tay hoặc cốc gỗ. Nếu chặt: hâm nóng nhẹ đỉnh piston bằng '
          + 'giẻ tẩm nước nóng (nhôm giãn nhiều hơn thép nên lỗ chốt nở ra).',
        tool: 'Cốc đẩy bằng gỗ/nhựa',
        warn: 'KHÔNG đóng búa thẳng vào chốt — sẽ làm cong tay biên' },
      { title: 'Tháo 3 xéc-măng khỏi piston',
        detail: 'Nong 2 đầu miệng ra vừa đủ để vượt qua đỉnh piston. Tháo từ vòng TRÊN xuống. '
          + 'Xéc-măng dầu (3 mảnh) tháo vòng gạt trước, vòng đàn hồi sau.',
        tool: 'Kìm tháo xéc-măng (nên dùng)',
        warn: 'Nong quá tay -> xéc-măng gãy. Vòng gang giòn hơn bạn tưởng',
        tip: 'Đánh dấu mặt trên của từng vòng nếu dự định dùng lại' },
      { title: 'Đo và đánh giá',
        detail: 'Đo lòng xy-lanh ở 3 độ cao × 2 phương vuông góc (tìm độ ô-van và độ côn). '
          + 'Đo đường kính piston ở vuông góc trục chốt, cách chân piston ~10 mm. '
          + 'Đo khe hở miệng xéc-măng mới trong lòng xy-lanh.',
        tool: 'Panme trong (bore gauge) · panme ngoài · lá căn',
        tip: 'Vượt giới hạn thì doa xy-lanh lên cỡ tiếp theo và dùng piston cỡ tương ứng — '
          + 'không bao giờ chỉ thay xéc-măng trên lòng xy-lanh đã mòn' },
      { title: 'Lắp lại: xéc-măng trước, miệng lệch 120°',
        detail: 'Lắp xéc-măng dầu trước (vòng đàn hồi -> 2 vòng gạt), rồi vòng 2 (mặt vát XUỐNG), '
          + 'rồi vòng 1. Xoay các miệng lệch nhau 120° và không trùng cửa nạp/xả hay chốt piston.',
        warn: 'Lắp sai chiều mặt vát vòng 2 = hao nhớt ngay lập tức',
        tip: 'Bôi nhớt mới lên xéc-măng và lòng xy-lanh trước khi lắp xy-lanh xuống' },
      { title: 'Lắp piston: mũi chỉ thị hướng đúng chiều',
        detail: 'Trên đỉnh piston có mũi/chữ chỉ hướng (thường "IN" hoặc mũi tam hướng về phía XẢ). '
          + 'Lắp ngược chiều sẽ làm lệch offset chốt và gây gõ máy.',
        warn: 'Đọc kỹ dấu chỉ hướng trên đỉnh piston TRƯỚC KHI lắp' },
      { title: 'Lắp xy-lanh: nén xéc-măng bằng tay, không gõ',
        detail: 'Đặt gioăng mới + 2 chốt dẫn hướng. Hạ xy-lanh xuống, dùng ngón tay bóp từng '
          + 'xéc-măng vào trong khi đẩy. Nếu phải gõ búa là đang làm sai.',
        torque: 'Bu lông đầu bò khi lắp: ≈ 24 N·m theo hình chéo, 2 lượt',
        tip: 'Xoay trục khuỷu tay 2 vòng trước khi lắp đầu bò — phải nhẹ đều, không chạn ở đâu' },
    ],

    symptoms: [
      { sign: 'Khói xanh, hao nhớt',
        cause: 'Xéc-măng dầu mất đàn hồi · lắp ngược mặt vát xéc-măng số 2 · lòng xy-lanh mòn ô-van. '
          + 'Cũng có thể do phớt thân xupap (xem hệ thống 01).',
        fix: 'Đo áp suất nén. Nếu nén thấp + khói xanh -> nhóm xéc-măng/xy-lanh. '
          + 'Nếu nén tốt mà vẫn khói xanh -> phớt thân xupap.' },
      { sign: 'Nén thấp, khó nổ khi máy nguội, máy yếu khi tải',
        cause: 'Xéc-măng khí bó kẹp muội than · mòn xéc-măng · xước lòng xy-lanh · '
          + 'hở gioăng đầu bò · xupap không kín.',
        fix: 'Đo áp suất nén khô rồi <b>nhỏ vài giọt nhớt vào lỗ bugi và đo lại</b>: '
          + 'nén tăng rõ = vấn đề ở xéc-măng/xy-lanh; nén không đổi = vấn đề ở xupap hoặc gioăng.' },
      { sign: 'Tiếng gõ nhẹ "tách tách" theo vòng tua, rõ khi thả ga',
        cause: 'Mòn chốt piston hoặc bạc đầu nhỏ tay biên.',
        fix: 'Lắc piston theo phương ngang khi đã tháo xy-lanh; đo khe hở chốt–bạc.' },
      { sign: 'Tiếng gõ nặng ở dưới máy, tăng theo tải',
        cause: 'Ổ bi kim đầu to tay biên vỡ hoặc mòn.',
        fix: 'Kiểm độ đảo đầu to tay biên (radial/axial). Vượt giới hạn -> thay trục khuỷu '
          + '(hệ thống 03).' },
      { sign: 'Xước dọc rõ trên lòng xy-lanh',
        cause: 'Xéc-măng bó (khe miệng = 0) · hút bụi do lọc gió hở · dính piston do quá nhiệt.',
        fix: 'Doa lên cỡ, đồng thời TRUY nguyên nhân: kiểm lọc gió, đường nhớt, hệ thống làm mát. '
          + 'Không tìm ra nguyên nhân thì làm lại cũng hỏng lại.' },
    ],

    related: ['cylinder-head', 'crank-case', 'lubrication'],
  },
};
