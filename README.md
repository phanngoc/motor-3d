# MOTOR3D — Mô hình 3D tham số hóa xe máy 4 kỳ

Mô hình 3D **sinh toàn bộ hình học bằng code** (Three.js procedural, không import file CAD)
cho một xe số 4 kỳ SOHC lớp **Honda Wave 110** — từ đầu bò xuống tới khung sườn và phanh —
kèm animation **cách hoạt động** và animation **quy trình tháo lắp từng bước**.
**9 hệ thống, mỗi hệ thống một trang riêng.**

Mục tiêu không phải đẹp như ảnh chụp, mà là **đúng quan hệ ăn khớp, đúng tỉ số truyền,
đúng thứ tự tháo lắp** — đó mới là những thứ giúp hiểu cơ cấu.

**▶ Xem trực tiếp: https://motor-3d.lequidon-1993.workers.dev**

```bash
npm install
npm run dev              # http://localhost:5173
npm run verify           # kiểm tra hình học + động học headless (không cần browser)
npm run verify -- gearbox
npm run build            # build tĩnh vào dist/, deploy được lên bất kỳ static host
npm run deploy           # verify → build → deploy lên Cloudflare Workers
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
| 07 Bộ hoà khí | Các đường khoan chéo bên trong thân chỉ dựng phần nhìn thấy. **Hằng số tỉ lệ của mô hình xăng được DÒ SỐ** để một bộ lành cho AFR 12,2–15,2 dọc đường tải — xem khối `CAL` trong `layout.js`. | **Van trượt CV đi theo lưu lượng khí, không theo tay ga** (giải từ cân bằng lực). Gíc-lơ chính và khe kim nối TIẾP nhau. Cỡ gíc-lơ đúng số hiệu thật (#75/#35). Dấu vết từng hỏng hóc theo dải ga. |
| 08 Đánh lửa | Cuộn dây vẽ thành khối trụ, không dựng từng vòng. Bó dây vẽ theo sơ đồ nối, không theo đường luồn dây thật. | **Góc sớm suy ra từ hai sự thật vật lý tách bạch**. CDI là mạch SỐ (kích hoặc không). Điện áp cần phóng tia phụ thuộc áp suất xy-lanh. Cân bằng sạc. |
| 09 Khung & phanh | Khung là các ống thẳng theo đường trục, không có gân và bát hàn. Nan hoa vẽ thẳng, không bắt chéo. Lốp là xuyến trơn. | **Hình học lái tự nhất quán** (độ lệch đuôi tính hai cách khớp nhau). Chuyển tải khi phanh. Tự cường hoá má dẫn/má bị. Độ võng sên suy ra từ cung quay gắp sau. |

> ⚠️ **Số liệu lực siết / khe hở trong project là GIÁ TRỊ THAM KHẢO** cho lớp động cơ
> Wave 110. Trước khi siết thực tế **bắt buộc** tra sổ tay dịch vụ đúng đời xe của bạn.

---

## 9 luồng — mỗi luồng một trang

Cả 9 hệ thống đều đã có 3D + animation tháo lắp + chế độ Hoạt động.

| # | Hệ thống | Chi tiết | Bước | Phép kiểm | Tam giác | Điều đáng xem nhất |
|---|----------|---------:|-----:|----------:|---------:|---|
| 01 | Đầu bò & cơ cấu cam–xupap | 30 | 18 | 6 | 109.354 | Chuỗi cam→cò mổ→xupap, tỉ số 2:1 |
| 02 | Xy-lanh, piston & tay biên | 16 | 15 | 11 | 39.524 | Chuyển động piston KHÔNG đối xứng |
| 03 | Trục khuỷu & lốc máy | 16 | 18 | 12 | 58.900 | Không thể cân bằng hết máy một xy-lanh |
| 04 | Ly hợp (bộ nồi) | 24 | 20 | 12 | 87.696 | Hai bộ nồi Ø92 buộc phải lệch nhau theo trục |
| 05 | Hộp số 4 cấp & cơ cấu sang số | 25 | 18 | 12 | 73.304 | Mọi cặp luôn ăn khớp; trống số không cho ăn 2 số |
| 06 | Hệ thống bôi trơn | 18 | 14 | 16 | 42.782 | Bơm tạo LƯU LƯỢNG, sức cản tạo áp suất |
| 07 | Nạp – xả & cung cấp nhiên liệu | 28 | 13 | 22 | 32.074 | Máy chẩn đoán: mỗi hỏng hóc một dấu vết theo dải ga |
| 08 | Đánh lửa & hệ thống điện | 22 | 12 | 19 | 36.616 | Ba hỏng hóc khác nhau, cùng một triệu chứng |
| 09 | Khung, phuộc, phanh & truyền động cuối | 24 | 11 | 24 | 37.198 | Phanh là bài toán chuyển tải; tang trống là hộp kín |
| | **Tổng** | **203** | **139** | **134** | | |

Mỗi hệ thống có đủ: **lý thuyết + danh mục chi tiết (vật liệu, thông số, chức năng, hư
hỏng thường gặp) + quy trình tháo lắp từng bước (dụng cụ, lực siết, cảnh báo, mẹo) +
bảng chẩn đoán từ hiện tượng + hình học 3D + chế độ Hoạt động có số liệu tính được**.

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

Kết quả hiện tại: **9 hệ thống · 203 chi tiết · 139 bước · 134 phép kiểm — tất cả đạt.**
Vài con số mà harness in ra, để thấy nó kiểm ở mức nào:

**01 Đầu bò**

```
độ nâng max nạp/xả       5,450 mm   (cam 5,5 mm − khe hở nhiệt 0,05 mm)
nạp/xả mở                211,5° trục khuỷu
tỉ số dây cam            2,000 : 1  (nhông 24/12)
khe xupap – đỉnh piston  2,80 mm tại 3° trục khuỷu
```

**03 Trục khuỷu** — cân bằng động cơ một xy-lanh, ở 5000 v/ph

```
k = 0     lực ngang 0 N      · lực đứng đỉnh 1985 N
k = 1     lực ngang 1524 N   · lực đứng còn 461 N (chỉ còn bậc 2)
k = 0,61  đỉnh tổng nhỏ nhất 1061 N — thấp hơn cả hai đầu nhưng KHÁC 0
```

**05 Hộp số**

```
tổng răng mỗi cặp        47 · 47 · 47 · 47   (điều kiện ăn khớp thường xuyên)
khoảng cách trục         37,600 mm hình học = 37,600 mm tính toán
không bao giờ ăn 2 số    mọi góc trống chỉ có tối đa 1 cài then rời vị trí giữa
chốt càng cua trong rãnh lệch 0 mm ở mọi góc
```

**06 Bôi trơn** — cùng vòng tua 3000, chỉ đổi sức cản đường nhớt

```
khe hở ổ đỡ mới    4,70 L/ph @ 292 kPa
khe hở đã mòn      4,70 L/ph @ 102 kPa    <- lưu lượng KHÔNG đổi, áp suất tụt
```

**07 Bộ hoà khí** — dấu vết của từng hỏng hóc theo dải ga (AFR)

```
                  ga 3%   ga 25%  ga 50%  ga 90%
lành               12,2    13,5    14,0    13,3
tắc gíc-lơ chậm    99      16,4    14,6    13,4   chết không tải, ga to vẫn chạy
tắc gíc-lơ chính   12,2    26,0    39,2    40,3   ngược lại hẳn
lọc gió tắc        12,2     8,8     7,6     7,6   không tải bình thường
phao ngấm xăng      8,3     8,8     9,4     9,0   sai toàn dải
```

**08 Đánh lửa** — góc sớm, tách rõ phần nào đến từ đâu

```
vòng tua   góc sớm   do TRỄ BÉN LỬA   do CHÁY LAN
 1400       10,8°        3,8°            22°
 8500       30,0°       22,9°            22°     <- toàn bộ mức tăng đến từ cột giữa
```

**09 Phanh** — từ 50 km/h, đường khô

```
chỉ phanh trước    0,84 g   11,6 m
chỉ phanh sau      0,35 g   28,4 m
cả hai phanh       0,90 g   10,9 m
đổ đèo 4 phút      tang trống 639 °C còn 24 % momen · đĩa 225 °C còn 99 %
độ võng sên        cần tối thiểu 22,8 mm — sách hãng ghi 25–35 mm
```

Thêm phép kiểm mới: khai báo trong `checks` của `systems/<slug>/index.js`, trả về
`{ pass, msg, warn? }`. Hàm nhận `(asm, kin)` nên kiểm được cả động học thật.

### Những lỗi harness này đã bắt được

Đây là lý do nó tồn tại. Cột "loại" đáng để ý: nhiều lỗi là lỗi **thiết kế** — hình vẽ
chạy được, nhìn cũng bình thường, nhưng cái máy đó lắp thật thì không hoạt động.

| Lỗi | Hệ | Loại | Cách phát hiện |
|---|---|---|---|
| `mergeGeometries` fail khi trộn geometry indexed / non-indexed | lib | code | harness |
| Đường chạy xích dựng sai thứ tự đoạn tiếp tuyến | 01 | code | rà code |
| 506k tam giác chỉ riêng dây cam | 01 | hiệu năng | harness đếm |
| Badge cao 133px do trùng tên class `.doc` | UI | CSS | soi computed style |
| `.tlbtn` là nút vuông cố định 32×32 nên MỌI nút chữ ở mọi hệ đều tràn | UI | CSS | screenshot |
| **Hai bệ xupap chỉ cách nhau 0,5 mm** (thật phải 3–4 mm) | 01 | thiết kế | screenshot → thành phép kiểm |
| Mép nấm xupap chìa ra ngoài buồng đốt 0,5 mm | 01 | thiết kế | phép kiểm |
| **Xéc-măng dầu tụt ra khỏi lòng xy-lanh ở điểm chết dưới** | 02 | thiết kế | phép kiểm |
| Má khuỷu phải chạm ổ bi (khe 0 mm) | 03 | thiết kế | phép kiểm |
| **Hành trình lá bố 1,9 mm < 6 mặt × 0,42 mm** — bóp hết tay vẫn không tách | 04 | thiết kế | phép kiểm |
| Hai bộ nồi chạm nhau đúng tại x = 52 | 04 | thiết kế | phép kiểm hộp bao thật |
| **Hành trình cài then 7 mm quá lớn** — thân cài then chọc vào thân bánh răng | 05 | thiết kế | phép kiểm |
| **Chuyển số 2→3 làm cả hai cài then cùng rời vị trí giữa** = có khoảnh khắc ăn 2 số | 05 | thiết kế | phép kiểm quét 360° |
| Van an toàn nằm chồng vào thân bơm nhớt (cách tâm 22,6 mm < bán kính 25 mm) | 06 | thiết kế | phép kiểm va chạm |
| Bướm ga Ø24,8 mm trong lỗ thông Ø23,1 mm — đĩa to hơn lỗ | 07 | thiết kế | phép kiểm |
| Mức xăng trùng đúng cao độ gíc-lơ chính nên gíc-lơ không ngập xăng | 07 | thiết kế | phép kiểm |
| **Cuộn kích lọt trong vành rôto** (khe −6,5 mm) | 08 | thiết kế | phép kiểm |
| Cụm cuộn kích R73,5 không đủ chỗ trong vỏ máy trái R65 | 08 | thiết kế | phép kiểm |
| **`tubeYZ()` quay ngược dấu → khung sườn, phuộc, gắp, giảm chấn bị lật theo trục Z** | 09 | code | phép kiểm hộp bao |
| Bánh xe, đĩa phanh, tang trống, dĩa sên bị đặt ở y = 0 thay vì cao độ trục bánh | 09 | code | phép kiểm hộp bao |
| **Hình học lái không tự nhất quán**: rake 26,5° + offset 53 mm không cho trục bánh ở đúng chỗ đã đặt | 09 | thiết kế | phép kiểm hai cách tính độ lệch đuôi |
| `controls.maxDistance = 1600 mm` cố định → hệ khung xe kẹt ở mức phóng quá gần | core | code | screenshot |

Lỗi đáng nhớ nhất là **ăn 2 số khi chuyển 2→3** ở hệ 05. Nó được sửa bằng cách **tuần tự
hóa** trong `forkOffset()`: càng đang về mo chạy trong nửa đầu bước chuyển, càng đang rời mo
chạy trong nửa sau. Vì rãnh trống số được sinh ra từ chính hàm đó, hình học tự động mang
đúng logic — đúng như rãnh trống thật được phay. Đây là ví dụ rõ nhất cho nguyên tắc
"một hàm cho cả hình lẫn số" ở dưới.

---

## Deploy lên Cloudflare Workers (miễn phí)

Site là **static thuần** nên deploy bằng **Workers Static Assets**: không khai báo `main`
trong `wrangler.jsonc` nên **không có Worker script nào chạy** — Cloudflare phục vụ file
trực tiếp từ mạng biên. Vì vậy request tới file tĩnh không tính vào hạn mức 100.000
request/ngày của Workers (xem [trang hạn mức](https://developers.cloudflare.com/workers/platform/pricing/)
để tra số chính thức).

```bash
npx wrangler login      # một lần duy nhất, mở browser để cấp quyền
npm run deploy          # verify → build → wrangler deploy
```

`npm run deploy` chạy `npm run verify` trước, nên **không thể deploy một bản mà 134 phép
kiểm chưa đạt**. Bản đang chạy: **https://motor-3d.lequidon-1993.workers.dev**

Ngay sau khi deploy có thể vài trang trả 404 trong khoảng nửa phút — manifest tài nguyên
còn đang lan ra các node biên. Chờ rồi tải lại, không phải lỗi cấu hình.

Xem thử ở local đúng cách Cloudflare phục vụ (khác `npm run dev` — bản này chạy trên
bản build thật, có cả `_headers` và trang 404):

```bash
npm run cf:dev          # http://localhost:8787
npm run cf:tail         # xem log request của bản đã deploy
```

### Vì sao `html_handling: "auto-trailing-slash"`

`vite.config.js` dùng `base: './'` (đường dẫn **tương đối**), nên URL được phục vụ phải
giữ đúng ĐỘ SÂU của file, không thì `../assets/x.js` trỏ sai. Với `auto-trailing-slash`:

| URL yêu cầu | Kết quả | `../assets/x.js` phân giải thành |
|---|---|---|
| `/` | 200 `index.html` | `/assets/x.js` ✓ |
| `/pages/gearbox.html` | 307 → `/pages/gearbox` | |
| `/pages/gearbox` | 200 | `/assets/x.js` ✓ |
| `/duong-dan-sai` | 404 + trang 404 riêng | |

**Không được đổi sang `force-trailing-slash`**: URL sẽ thành `/pages/gearbox/`, khi đó
`../assets/x.js` trỏ thành `/pages/assets/x.js` và vỡ toàn bộ tài nguyên.

Nhờ giữ `base: './'` và mọi liên kết nội bộ đều ghi rõ `.html` mà site chạy y hệt nhau
trên Workers, GitHub Pages (kể cả trong thư mục con), và cả khi mở bằng `file://`.

### Cache

`public/_headers` được Vite copy sang `dist/` và Cloudflare đọc nó:

- `/assets/*` → `max-age=31536000, immutable`. An toàn vì Vite băm tên file, nội dung đổi
  thì tên đổi.
- HTML → `max-age=0, must-revalidate`, vì HTML chứa tên file tài nguyên mới sau mỗi build.

### Tự deploy khi push (tuỳ chọn)

`.github/workflows/deploy.yml` deploy mỗi lần push vào `main`. Cần thêm một secret trong
repo: `CLOUDFLARE_API_TOKEN` (tạo ở dashboard, template **Edit Cloudflare Workers**) và
`CLOUDFLARE_ACCOUNT_ID`. Xoá file đó đi nếu chỉ muốn deploy bằng tay.

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
  → muốn đặt tâm hình tại (y, z) THẬT thì toạ độ shape phải là `[-z, y]`. Nhầm chỗ này là
  cả bánh xe rơi xuống mặt đất; các hệ dùng nhiều đều có helper `uv(y, z)` cho việc đó.
- `lathe(profile)`: profile `[[r, y], …]` duyệt **ngược chiều kim đồng hồ trong mặt phẳng
  (r,y)** với vật liệu ở bên trong — với hình trụ đơn giản chỉ cần xếp từ dưới lên.
- `groovedDrum({...})`: hình trụ có rãnh xoắn thật, `xAt(θ)` định nghĩa tâm rãnh.

---

## Stack

- **Three.js r180** — render + sinh geometry. Không dependency nào khác ở runtime.
- **Vite 7** multi-page. Mỗi trang hệ thống là một HTML riêng; module hệ thống được
  code-split và nạp theo nhu cầu.
- Không có bước build CAD, không cần cài OpenSCAD/FreeCAD.
- `core/ui.js` cố ý KHÔNG import Three.js (phần cần Three.js nằm riêng ở `core/labels.js`),
  nên trang chủ và các panel không kéo theo cả engine 3D.
