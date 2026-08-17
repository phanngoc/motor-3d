# MOTOR3D — Mô hình 3D tham số hóa xe máy 4 kỳ

Mô hình 3D **sinh toàn bộ hình học bằng code** (Three.js procedural, không import file CAD)
cho một động cơ xe số 4 kỳ SOHC lớp **Honda Wave 110**, kèm animation **cách hoạt động**
và animation **quy trình tháo lắp từng bước**. Mỗi hệ thống là một trang riêng.

Mục tiêu không phải đẹp như ảnh chụp, mà là **đúng quan hệ ăn khớp, đúng tỉ số truyền,
đúng thứ tự tháo lắp** — đó mới là những thứ giúp hiểu cơ cấu.

```bash
npm install
npm run dev              # http://localhost:5173
npm run verify           # kiểm tra hình học + động học headless (không cần browser)
npm run verify -- gearbox
npm run build            # build tĩnh vào dist/, deploy được lên bất kỳ static host
```

---

## Điều cần nói thẳng trước

**Không có project open-source nào có sẵn model 3D đầy đủ, chính xác từng chi tiết của
một xe máy thật** — dữ liệu đó là tài sản của hãng. Cái project này làm là tự sinh model
tham số hóa: **hình học đơn giản hóa nhưng đúng topology và đúng quan hệ động học**.

Những gì đã **đơn giản hóa** (ghi rõ trong `layout.js` của từng hệ thống):

| Hệ thống | Đơn giản hóa | Vẫn đúng |
|---|---|---|
| 01 Đầu bò | Buồng đốt là mặt cầu lõm, không phải squish-band thật. Đường nạp/xả là ống tròn thẳng. Chiều cao đầu bò hơi lớn hơn tỉ lệ thật để nhìn rõ cò mổ. Nhông cam 24T/12T thay vì 28T/14T. | **Tỉ số 2:1**. Tỉ số đòn cò mổ. Biên dạng vấu cam. |
| 05 Hộp số | Biên dạng răng dạng thang gần đúng, không phải thân khai. Vấu cài then là chốt tròn + lỗ tròn suốt (thật là vấu vuông, lỗ bậc). Số răng chọn lại để tổng răng mỗi cặp = 47. | **Mọi cặp luôn ăn khớp**. Cài then chỉ KHÓA bánh răng vào trục. Trống số không bao giờ cho ăn 2 số. Bánh răng chạy lô vẫn quay khi cấp số đó không chọn. |

> ⚠️ **Số liệu lực siết / khe hở trong project là GIÁ TRỊ THAM KHẢO** cho lớp động cơ
> Wave 110. Trước khi siết thực tế **bắt buộc** tra sổ tay dịch vụ đúng đời xe của bạn.

---

## 9 luồng — mỗi luồng một trang

| # | Hệ thống | Trạng thái |
|---|----------|-----------|
| 01 | Đầu bò & cơ cấu cam–xupap | **3D + animation** · 30 chi tiết · 18 bước |
| 02 | Xy-lanh, piston & tay biên | tài liệu |
| 03 | Trục khuỷu & lốc máy | tài liệu |
| 04 | Ly hợp (bộ nồi) | tài liệu |
| 05 | Hộp số 4 cấp & cơ cấu sang số | **3D + animation** · 25 chi tiết · 18 bước |
| 06 | Hệ thống bôi trơn | tài liệu |
| 07 | Nạp – xả & cung cấp nhiên liệu | tài liệu |
| 08 | Đánh lửa & hệ thống điện | tài liệu |
| 09 | Khung, phuộc, phanh & truyền động cuối | tài liệu |

"Tài liệu" = đã có đầy đủ **lý thuyết + danh mục chi tiết (vật liệu, thông số, chức năng,
hư hỏng thường gặp) + quy trình tháo lắp từng bước (dụng cụ, lực siết, cảnh báo, mẹo)
+ bảng chẩn đoán từ hiện tượng**. Chỉ chưa dựng hình học 3D. Nội dung đó viết đúng cấu
trúc dữ liệu của trang 3D nên khi dựng 3D thì **copy thẳng sang, không viết lại**.

---

## Hai chế độ của trang 3D

**Hoạt động** — cơ cấu chạy theo một biến điều khiển.

- Hệ thống 01: **góc trục khuỷu**. Kéo thanh để đi từng độ. Đồng hồ hiện độ nâng từng
  xupap theo mm; số này tính ra từ **chính biên dạng vấu cam đã dựng**.
- Hệ thống 05: **cấp số + tốc độ trục sơ cấp**. Chọn **N** và để máy chạy: cả 4 bánh răng
  trên trục thứ cấp **vẫn quay** mà **trục thứ cấp đứng yên** — đó là toàn bộ ý nghĩa của
  "ăn khớp thường xuyên".

Vỏ máy được ẩn để thấy cơ cấu — tích lại trong danh mục bên phải nếu muốn thấy vỏ.

**Tháo lắp** — timeline theo đúng 18 bước thật. Bấm một bước để nhảy đến; nút `↺` chạy
ngược = xem thứ tự **lắp lại**. Mỗi bước có dụng cụ, lực siết, cảnh báo và mẹo thực tế.
Cuối panel có mục **Chẩn đoán từ hiện tượng**: đi từ triệu chứng ngược về nguyên nhân.

### Phím tắt

| Phím | Tác dụng |
|------|----------|
| `Space` | chạy / dừng |
| `←` `→` | bước trước / sau (tháo lắp) · ±5° (hoạt động) |
| `R` | chạy ngược = xem quy trình **lắp** |
| `0` | về trạng thái lắp hoàn chỉnh |
| `1` `2` | đổi chế độ Hoạt động / Tháo lắp |
| `X` | chế độ X-quang |
| `C` | ẩn/hiện nhóm ngữ cảnh |
| `H` | canh lại khung nhìn |
| `F` `S` `T` | nhìn từ trước / bên / trên |
| `Esc` | bỏ chọn chi tiết |

Bấm vào bất kỳ chi tiết trong khung 3D để xem vật liệu, thông số, chức năng và hư hỏng
thường gặp của nó.

---

## Kiến trúc

```
src/
├── lib/geom.js            "CAD kernel" thu nhỏ: lathe, extrude theo X/Y, bánh răng,
│                          nhông, then hoa, lò xo xoắn, vấu cam, ren,
│                          trống số có RÃNH XOẮN THẬT, đường chạy xích 2 puly
├── core/
│   ├── viewer.js          Scene Three.js: đèn, env map, camera, raycast chọn chi tiết
│   ├── assembly.js        Engine lắp/tháo: Part, Step, timeline, Player chạy tiến/lùi
│   ├── materials.js       Bảng vật liệu (nhôm đúc, gang, thép tôi, đồng thanh, cao su…)
│   ├── ui.js              Thành phần DOM — CỐ Ý không phụ thuộc Three.js
│   ├── labels.js          Nhãn HTML neo vào điểm 3D (file duy nhất trong lớp UI cần Three)
│   ├── system-page.js     Toàn bộ UI trang 3D
│   └── doc-page.js        Toàn bộ UI trang tài liệu
├── systems/
│   ├── registry.js        Danh mục 9 hệ thống + thông số xe mẫu
│   └── <slug>/
│       ├── layout.js      TẤT CẢ kích thước + công thức suy diễn
│       ├── parts.js       build() từng chi tiết + thông tin vật liệu/chức năng/hư hỏng
│       ├── steps.js       Quy trình tháo lắp + vector di chuyển từng chi tiết
│       ├── kinematics.js  Cơ cấu chạy — giao diện duy nhất là drive(angle, dt)
│       └── index.js       Gộp lại + panel điều khiển + các phép kiểm kỹ thuật
├── system-entry.js        Entry dùng chung (đọc <body data-system="…">)
└── index-page.js          Trang tổng quan
pages/<slug>.html          9 trang, mỗi trang ~12 dòng HTML
scripts/verify.mjs         Kiểm tra headless
```

### Ba nguyên tắc thiết kế đáng chú ý

**1. Hình học và animation phải dùng chung một hàm.** Đây là nguyên tắc quan trọng nhất,
và là thứ các animation minh hoạ thường làm sai.

- Vấu cam dùng `camRadius()` để vẽ biên dạng, và độ nâng xupap **cũng tính từ
  `camRadius()`**. Chuỗi theo đúng thứ tự vật lý:

  ```
  góc trục khuỷu θ → góc trục cam φ = θ/2 → độ nâng cam h = camLift(φ − φ_đỉnh vấu)
    → góc lắc cò ψ = ±asin(h / cạnh phía cam)
    → độ nâng xupap = cạnh phía xupap · sin|ψ| − khe hở nhiệt
  ```

- **Rãnh xoắn trên trống số được SINH RA** từ chính bảng vị trí cấp số
  (`grooveXAt()` gọi `forkOffset()`). Phép kiểm xác nhận chốt càng cua nằm đúng
  trong rãnh với sai lệch **0 mm ở mọi góc** — không thể lệch, vì cùng một hàm.

**2. Mọi kích thước nằm trong `layout.js`.** Sửa một số là cả hình học *và* animation
*và* các phép kiểm cập nhật theo. Không có magic number rải trong `parts.js`.

**3. Trang tài liệu và trang 3D dùng chung cấu trúc dữ liệu.** `parts` và `steps` viết
cho trang tài liệu copy thẳng được sang `parts.js` / `steps.js`.

---

## `npm run verify` — kiểm tra headless

Chạy được mà không cần browser (Three.js sinh geometry thuần JS). Kiểm những thứ **không
thể nhìn bằng mắt**:

```
[1] Dựng hình học      mọi build() chạy được, không NaN, không geometry rỗng,
                       hộp bao trong phạm vi hợp lý, đếm tam giác
[2] Quy trình tháo lắp mọi bước tham chiếu chi tiết tồn tại; mọi chi tiết cần tháo
                       đều có bước tháo; chi tiết `stays: true` liệt kê riêng
[3] Cơ cấu hoạt động   quét toàn bộ biến điều khiển, dò NaN ở MỌI giá trị trong state
[4] Kiểm tra kỹ thuật  các bất biến riêng của từng hệ thống (khai báo trong index.js)
```

Kết quả hiện tại:

**01 Đầu bò** — 30 chi tiết · 109.354 tam giác · 18 bước

```
độ nâng max nạp/xả       5,450 mm   (cam 5,5 mm − khe hở nhiệt 0,05 mm)
nạp/xả mở                211,5° trục khuỷu
khe giữa 2 bệ xupap      4,00 mm
tỉ số dây cam            2,000 : 1  (nhông 24/12)
tỉ số đòn cò mổ          1,000
khe vấu cam – trục cò    1,26 mm
khe xupap – đỉnh piston  2,80 mm tại 3° trục khuỷu
```

**05 Hộp số** — 25 chi tiết · 73.304 tam giác · 18 bước

```
tổng răng mỗi cặp        47 · 47 · 47 · 47   (điều kiện ăn khớp thường xuyên)
khoảng cách trục         37,600 mm hình học = 37,600 mm tính toán
tỉ số                    2,917 > 1,938 > 1,350 > 0,958
ở mo, vấu chưa ăn        còn dư 0,50 mm sau khi trừ chiều dài vấu
ở vị trí ăn              thân cài then còn khe 1,50 mm · vấu cắm sâu 4,00 mm
không bao giờ ăn 2 số    mọi góc trống chỉ có tối đa 1 cài then rời vị trí giữa
chốt càng cua trong rãnh lệch 0 mm ở mọi góc
```

Thêm phép kiểm mới: khai báo trong `checks` của `systems/<slug>/index.js`, trả về
`{ pass, msg, warn? }`. Hàm nhận `(asm, kin)` nên kiểm được cả động học thật.

### Những lỗi harness này đã bắt được

Đây là lý do nó tồn tại — 8 lỗi thật, trong đó 4 lỗi **thiết kế**, không phải lỗi code:

| Lỗi | Loại | Cách phát hiện |
|---|---|---|
| `mergeGeometries` fail khi trộn geometry indexed / non-indexed | code | harness |
| Đường chạy xích dựng sai thứ tự đoạn tiếp tuyến | code | rà code |
| 506k tam giác chỉ riêng dây cam | hiệu năng | harness đếm |
| Badge cao 133px do trùng tên class `.doc` | CSS | soi computed style |
| **Hai bệ xupap chỉ cách nhau 0,5 mm** (thật phải 3–4 mm) | thiết kế | screenshot → thành phép kiểm |
| Mép nấm xupap chìa ra ngoài buồng đốt 0,5 mm | thiết kế | phép kiểm |
| **Hành trình cài then 7 mm quá lớn** — thân cài then chọc vào thân bánh răng | thiết kế | phép kiểm |
| **Chuyển số 2→3 làm cả hai cài then cùng rời vị trí giữa** = có khoảnh khắc ăn 2 số | thiết kế | phép kiểm quét 360° |

Lỗi cuối được sửa bằng cách **tuần tự hóa** trong `forkOffset()`: càng đang về mo chạy
trong nửa đầu bước chuyển, càng đang rời mo chạy trong nửa sau. Vì rãnh trống số được
sinh ra từ hàm đó, hình học tự động mang đúng logic — đúng như rãnh trống thật được phay.

---

## Thêm một hệ thống 3D mới

Engine (timeline, chọn chi tiết, phím tắt, panel, X-quang, chẩn đoán) dùng lại nguyên vẹn:

1. `layout.js` — kích thước và công thức suy diễn.
2. `parts.js` — mảng `PARTS`, mỗi phần tử có `build()` trả về `Object3D` đã nằm đúng vị trí
   lắp (world coords). Chi tiết cần quay khi tháo thì khai báo `pivot`; chi tiết có node con
   cần animate thì gắn vào `userData.nodes`. Chi tiết có thật nhưng không tháo trong phạm vi
   công việc thì đặt `stays: true`.
3. `steps.js` — mảng `STEPS` với `moves: [{ part, d:[x,y,z], rot }]`.
4. `kinematics.js` (tùy chọn) — xuất `drive(angle, dt)` và một object `state`.
5. Trong `index.js` đổi `mode` sang `'3d'` và export `parts`, `steps`, `createKinematics`,
   `opsPanel`, `checks`, `symptoms`.
6. Đổi `status` trong `registry.js` thành `'3d'`.
7. `npm run verify -- <slug>`.

Quy ước trục (dùng chung toàn project, đơn vị **mm**):

```
+Y = hướng lên (trục xy-lanh thẳng đứng)
+X = sang phải theo hướng xe (trục cam và các trục hộp số nằm theo X)
+Z = về phía sau xe  → phía NẠP
-Z = về phía trước xe → phía XẢ
```

- `extrudeY(shape, h)`: shape(u,v) → world(x=u, z=v), kéo theo +Y
- `extrudeX(shape, l)`: shape(u,v) → world(z=−u, y=v), kéo theo +X
- `lathe(profile)`: profile `[[r, y], …]` duyệt **ngược chiều kim đồng hồ trong mặt phẳng
  (r,y)** với vật liệu ở bên trong — với hình trụ đơn giản chỉ cần xếp từ dưới lên.
- `groovedDrum({...})`: hình trụ có rãnh xoắn thật, `xAt(θ)` định nghĩa tâm rãnh.

---

## Stack

- **Three.js r180** — render + sinh geometry. Không dependency nào khác ở runtime.
- **Vite 7** multi-page. Mỗi trang hệ thống là một HTML riêng; module hệ thống được
  code-split và nạp theo nhu cầu.
- Trang tài liệu tải **17 kB** (không kéo Three.js). Trang 3D tải **~160 kB** gzip.
- Không có bước build CAD, không cần cài OpenSCAD/FreeCAD.
