# API & Interfaces

> Dự án này là static frontend — không có HTTP API. Tài liệu này mô tả **internal JavaScript interface**.

---

## `cfg` Object (Public State Interface)

Object `cfg` là single source of truth cho tất cả mutable scene parameters.

```js
const cfg = {
  text:        string,   // Text hiển thị 3D (default: 'Hello World')
  hue:         number,   // Primary color hue, 0–360
  rotX:        number,   // Rotation speed trục X (rad/s), âm = ngược chiều
  rotY:        number,   // Rotation speed trục Y (rad/s)
  orbitSpeed:  number,   // Camera orbit speed (rad/s), 0–0.15
  starOpacity: number,   // Particle opacity, 0–1
}
```

Mọi thay đổi `cfg.*` được animation loop đọc trong frame tiếp theo. Ngoại lệ: `cfg.text` cần gọi `buildText()` để rebuild geometry.

---

## `buildText(font, text)` — Rebuild 3D text geometry

```js
buildText(font: THREE.Font, text: string): void
```

- Dispose geometry/material cũ
- Tạo `TextGeometry` mới với `text`
- Tạo `textMesh` (solid) + `wireMesh` (ghost shadow, static)
- Add cả hai vào `scene`

**Lưu ý**: `wireMesh` scale `1.015x`, không sync rotation với `textMesh`.

---

## `applyColorToMaterials()` — Reactive color update

```js
applyColorToMaterials(): void
```

Đọc `cfg.hue` và `hue2()` (derived), cập nhật:
- `matFront.color` + `matFront.emissive`
- `matSide.color`
- `wireMatRef.color`
- `keyLight.color`
- `fillLight.color`
- `pMat.color` (particles)

Không cần rebuild geometry — instant update.

---

## `startAnimate()` — Khởi động RAF loop

```js
startAnimate(): void
```

Single-instance guard: chỉ chạy một lần dù gọi nhiều lần.

---

## Config Panel Controls → `cfg` Mapping

| Control | `cfg` field | Update mechanism |
|---------|------------|------------------|
| Text input + Apply | `cfg.text` | `buildText()` |
| Hue slider | `cfg.hue` | `applyColorToMaterials()` |
| Spin X slider | `cfg.rotX` | Loop reads next frame |
| Spin Y slider | `cfg.rotY` | Loop reads next frame |
| Orbit slider | `cfg.orbitSpeed` | Loop reads next frame |
| Stars slider | `cfg.starOpacity` | `pMat.opacity` direct |
| Randomize | all fields | `applyColorToMaterials()` + sync |
| Reset | all fields | `applyColorToMaterials()` + sync |

## Cập nhật lần cuối: 2026-03-25
