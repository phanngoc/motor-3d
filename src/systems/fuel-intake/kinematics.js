/**
 * kinematics.js — Chế độ "Hoạt động" của hệ thống nạp và cung cấp nhiên liệu.
 *
 * Biến dẫn động ở đây KHÔNG phải góc trục khuỷu mà là TAY GA (0…720 quy về 0…1).
 * Lý do: điều đáng học của bộ hoà khí là quan hệ giữa tay ga, lưu lượng khí, độ
 * mở van trượt và tỉ lệ xăng — chứ không phải chuyển động tuần hoàn.
 *
 * Chuỗi phụ thuộc, đúng theo thứ tự vật lý:
 *   tay ga → góc bướm ga → lưu lượng khí → chân không họng → độ mở van trượt
 *          → tiết diện khe kim → lưu lượng xăng mạch chính
 *   tay ga → chân không sau bướm ga → lưu lượng xăng mạch chậm
 *   khí / xăng → AFR
 *
 * Mọi con số lấy từ layout.js, và hình vẽ (góc bướm ga, độ cao van trượt, vị trí
 * kim, mức xăng) dùng CHÍNH những hàm đó. Không có đường tính song song nào.
 */

import { deg, clamp, lerp } from '../../lib/geom.js';
import {
  L, slideY, slideLift01, airFlowLpm, depressionKpa, manifoldVacuumKpa,
  butterflyOpenArea01, fuelFlows, afr, afrVerdict, dominantCircuit,
  needleGapArea, mainCircuitArea, mainCircuitLimiter, airMassGpm, rpmOnLoadLine,
} from './layout.js';

const C = L.carb, SL = L.slide, BF = L.butterfly, BW = L.bowl, FL = L.float, CP = L.chokePlunger;

export function createKinematics(asm) {
  const P = (id) => asm.part(id);
  const slide = P('cv-slide');
  const needleNode = slide.inner.userData.nodes.needle;
  const spring = P('slide-spring');
  const bf = P('throttle-butterfly');
  const plateNode = bf.inner.userData.nodes.plate;
  const drumNode = P('cable-drum').inner.userData.nodes.drum;
  const floats = P('floats');
  const floatArm = floats.inner.userData.nodes.arm;
  const valvePin = P('float-valve').inner.userData.nodes.pin;
  const fuelLevelNode = P('fuel-surface').inner.userData.nodes.level;
  const chokePlunger = P('choke').inner.userData.nodes.plunger;

  const state = {
    /** Tay ga 0…1. */
    throttle: 0.08,
    rpm: 1400,
    /**
     * Gắn vòng tua theo tay ga dọc ĐƯỜNG TẢI. Bật (mặc định) thì mọi điểm hiện ra
     * là điểm xe thật sự chạy qua. Tắt thì hai thanh độc lập — cần tắt để xem cho
     * rõ việc VAN TRƯỢT KHÔNG đi theo tay ga (ví dụ vặn hết ga ở 1600 v/ph).
     */
    followLoadLine: true,
    /** Hỏng hóc mô phỏng. */
    filterClog: 0,
    pilotBlock: 0,
    mainBlock: 0,
    fuelLevelOffset: 0,
    choke: false,

    // ── Kết quả ──
    slideLift: 0,
    airLpm: 0,
    airGpm: 0,
    throatVac: 0,
    manifoldVac: 0,
    butterflyOpen: 0,
    needleArea: 0,
    mainArea: 0,
    limiter: '',
    fuelPilot: 0,
    fuelMain: 0,
    fuelChoke: 0,
    fuelTotal: 0,
    afr: 14.7,
    verdict: '',
    verdictLevel: 'ok',
    circuit: '',
    pilotShare: 0,
    mainShare: 0,
  };

  const opt = () => ({
    filterClog: state.filterClog,
    pilotBlock: state.pilotBlock,
    mainBlock: state.mainBlock,
    fuelLevelOffset: state.fuelLevelOffset,
    choke: state.choke,
  });

  /**
   * `driveDeg` chạy 0…720 do thanh trượt chung của trang; ở hệ này nó được quy
   * về tay ga 0…1. Nhờ vậy nút "chạy" quét cả dải ga qua lại như một bài thử.
   */
  function drive(driveDeg, dt = 0) {
    const th = clamp((((driveDeg % 720) + 720) % 720) / 720, 0, 1);
    // 0…360 mở ga, 360…720 đóng ga lại — quét lên rồi xuống
    state.throttle = th <= 0.5 ? th * 2 : (1 - th) * 2;

    const t = state.throttle;
    if (state.followLoadLine) state.rpm = rpmOnLoadLine(t);
    const o = opt();

    // ── Khí ──────────────────────────────────────────────────────────────────
    state.butterflyOpen = butterflyOpenArea01(t);
    state.airLpm = airFlowLpm(state.rpm, t, state.filterClog);
    state.airGpm = airMassGpm(state.rpm, t, state.filterClog);
    state.manifoldVac = manifoldVacuumKpa(state.rpm, t);

    // ── Van trượt & kim ──────────────────────────────────────────────────────
    state.slideLift = slideLift01(state.rpm, t, state.filterClog);
    state.throatVac = depressionKpa(state.airLpm, state.slideLift);
    state.needleArea = needleGapArea(state.slideLift);
    state.mainArea = mainCircuitArea(state.slideLift, state.mainBlock);
    state.limiter = mainCircuitLimiter(state.slideLift, state.mainBlock);

    // ── Xăng ─────────────────────────────────────────────────────────────────
    const f = fuelFlows(state.rpm, t, o);
    state.fuelPilot = f.pilot;
    state.fuelMain = f.main;
    state.fuelChoke = f.choke;
    state.fuelTotal = f.total;
    state.pilotShare = f.total > 1e-9 ? f.pilot / f.total : 0;
    state.mainShare = f.total > 1e-9 ? f.main / f.total : 0;

    state.afr = afr(state.rpm, t, o);
    const v = afrVerdict(state.afr);
    state.verdict = v.text;
    state.verdictLevel = v.level;
    state.circuit = dominantCircuit(state.rpm, t, o);

    // ── Hình học ─────────────────────────────────────────────────────────────
    // Van trượt và lò xo đi lên theo ĐỘ MỞ, không theo tay ga.
    const y = slideY(state.slideLift) - SL.yClosed;
    slide.kin.pos.set(0, y, 0);
    spring.kin.pos.set(0, y, 0);
    // Kim xăng là node con nên đã đi cùng van trượt — không cần dịch thêm.
    needleNode.position.set(0, 0, 0);

    // Bướm ga quay theo TAY GA (đây là thứ duy nhất tay ga điều khiển).
    const aClosed = deg(BF.closedAngle);
    plateNode.rotation.set(-(aClosed + t * (Math.PI / 2 - aClosed)), 0, 0);
    drumNode.rotation.set(t * deg(78), 0, 0);

    // Mức xăng trong buồng phao.
    fuelLevelNode.position.set(0, state.fuelLevelOffset, 0);
    // Phao nổi theo mặt xăng; van kim đi theo phao.
    floatArm.position.set(0, state.fuelLevelOffset, 0);
    floatArm.rotation.set(-state.fuelLevelOffset * 0.012, 0, 0);
    valvePin.position.set(0, state.fuelLevelOffset, 0);

    // E gió: rút pít-tông ra khi bật.
    chokePlunger.position.set(state.choke ? CP.travel : 0, 0, 0);

    return state;
  }

  return {
    state,
    drive,
    /** Kéo thanh vòng tua tức là muốn tách khỏi đường tải. */
    setRpm(v) { state.rpm = v; state.followLoadLine = false; },
    setFollowLoadLine(v) { state.followLoadLine = !!v; },
    setThrottle(v) {
      state.throttle = clamp(v, 0, 1);
      // Quy ngược về biến dẫn động của trang (nửa đầu chu kỳ = mở ga).
      return (state.throttle / 2) * 720;
    },
    setFilterClog(v) { state.filterClog = clamp(v, 0, 1); },
    setPilotBlock(v) { state.pilotBlock = clamp(v, 0, 1); },
    setMainBlock(v) { state.mainBlock = clamp(v, 0, 1); },
    setFuelLevel(v) { state.fuelLevelOffset = clamp(v, -L.fuelLevel.range, L.fuelLevel.range); },
    setChoke(v) { state.choke = !!v; },
    resetFaults() {
      state.filterClog = 0; state.pilotBlock = 0; state.mainBlock = 0;
      state.fuelLevelOffset = 0; state.choke = false;
    },
  };
}
