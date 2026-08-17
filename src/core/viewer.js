/**
 * viewer.js — Khung Three.js dùng chung cho mọi trang hệ thống.
 * Đơn vị scene = mm (1 unit = 1 mm), trục theo quy ước trong lib/geom.js.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class Viewer {
  constructor(container, { background = 0x14181d, groundY = null } = {}) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(background);

    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 6000);
    this.camera.position.set(210, 150, 250);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.maxDistance = 1600;
    this.controls.minDistance = 25;

    this._setupLights(groundY);
    this._setupEnv();

    /** Gốc của toàn bộ mô hình — mỗi hệ thống add vào đây. */
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this._callbacks = [];
    this._clock = new THREE.Clock();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(container);
    this.resize();
    this._loop();
  }

  _setupLights(groundY) {
    this.scene.add(new THREE.HemisphereLight(0xbcd2e8, 0x2a2f36, 0.55));

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(180, 320, 190);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const s = 220;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 1400 });
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.6;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0xa9c4e0, 0.8);
    fill.position.set(-220, 90, -150);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffe6c4, 0.55);
    rim.position.set(40, -120, -220);
    this.scene.add(rim);

    if (groundY !== null) {
      const g = new THREE.Mesh(
        new THREE.PlaneGeometry(1400, 1400),
        new THREE.ShadowMaterial({ opacity: 0.32 }),
      );
      g.rotation.x = -Math.PI / 2;
      g.position.y = groundY;
      g.receiveShadow = true;
      this.scene.add(g);
      this.ground = g;
    }
  }

  _setupEnv() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(env, 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    env.dispose();
    pmrem.dispose();
  }

  /** Đăng ký callback mỗi frame: fn(dt, elapsed) */
  onFrame(fn) { this._callbacks.push(fn); return fn; }
  offFrame(fn) { this._callbacks = this._callbacks.filter((f) => f !== fn); }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _loop() {
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this._clock.getDelta(), 0.05);
      const t = this._clock.elapsedTime;
      for (const cb of this._callbacks) cb(dt, t);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  /** Đưa camera về khung nhìn bao trọn object (hoặc root). */
  /**
   * Đặt lại TỈ LỆ CẢNH theo bán kính bao của hệ thống đang xem (mm).
   *
   * Cần thiết vì các hệ trong động cơ chỉ cỡ vài trăm mm, còn hệ khung xe là cả
   * chiếc xe cỡ vài nghìn mm. Nếu giữ nguyên giới hạn tầm camera và khung chiếu
   * bóng của cảnh nhỏ thì cảnh lớn sẽ bị "kẹt" ở mức phóng quá gần và bóng đổ sai.
   */
  setScale(radiusMm) {
    const r = Math.max(radiusMm, 120);
    this.controls.maxDistance = r * 6;
    this.controls.minDistance = Math.max(12, r * 0.06);
    this.camera.far = Math.max(6000, r * 14);
    this.camera.updateProjectionMatrix();
    const s = r * 1.35;
    Object.assign(this.keyLight.shadow.camera, {
      left: -s, right: s, top: s, bottom: -s, near: 1, far: s * 7,
    });
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.keyLight.position.set(r * 0.82, r * 1.45, r * 0.86);
    return this;
  }

  frame(object = this.root, { padding = 1.45, animate = true, dir = null, minRadius = 0 } = {}) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(minRadius, box.getBoundingSphere(new THREE.Sphere()).radius);
    const dist = (radius * padding) / Math.sin((this.camera.fov * Math.PI) / 360);
    const d = (dir ? new THREE.Vector3(...dir) : new THREE.Vector3(0.72, 0.48, 0.86)).normalize();
    const to = center.clone().addScaledVector(d, dist);
    if (!animate) {
      this._cancelTween();
      this.camera.position.copy(to);
      this.controls.target.copy(center);
      return;
    }
    this._tween(this.camera.position.clone(), to, this.controls.target.clone(), center, 0.6);
  }

  _cancelTween() {
    if (this._tweenCb) { this.offFrame(this._tweenCb); this._tweenCb = null; }
  }

  /** Lia camera mượt tới vị trí / đích mới. */
  _tween(p0, p1, t0, t1, dur) {
    this._cancelTween();
    let e = 0;
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    this._tweenCb = this.onFrame((dt) => {
      e = Math.min(1, e + dt / dur);
      const k = ease(e);
      this.camera.position.lerpVectors(p0, p1, k);
      this.controls.target.lerpVectors(t0, t1, k);
      if (e >= 1) { this.offFrame(this._tweenCb); this._tweenCb = null; }
    });
  }

  /** Chuyển camera về một hướng nhìn chuẩn, giữ nguyên tâm và khoảng cách. */
  lookFrom(dir) {
    const center = this.controls.target.clone();
    const dist = this.camera.position.distanceTo(center);
    const d = new THREE.Vector3(...dir).normalize().multiplyScalar(dist);
    this._tween(this.camera.position.clone(), center.clone().add(d), center, center, 0.45);
  }

  /** Raycast chọn chi tiết: trả về Object3D có userData.partId gần nhất. */
  pick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.camera);
    const hits = rc.intersectObject(this.root, true);
    for (const h of hits) {
      if (!h.object.visible) continue;
      let o = h.object;
      while (o && o.userData.partId === undefined) o = o.parent;
      if (o) return { partId: o.userData.partId, object: o, point: h.point };
    }
    return null;
  }

  dispose() {
    this._ro.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}
