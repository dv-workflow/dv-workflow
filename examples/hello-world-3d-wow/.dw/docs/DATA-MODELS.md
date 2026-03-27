# Data Models

> Dự án này là static frontend, không có database hay persistent storage.
> Tài liệu này mô tả **in-memory data structures**.

---

## `cfg` — Scene Configuration

```js
{
  text:        string,   // 3D text content, max 40 chars
  hue:         number,   // 0.0 – 360.0 (degrees)
  rotX:        number,   // -0.5 – 0.5 (rad/s)
  rotY:        number,   //  0.0 – 0.5 (rad/s)
  orbitSpeed:  number,   //  0.0 – 0.15 (rad/s)
  starOpacity: number,   //  0.0 – 1.0
}
```

**Khởi tạo**: Random seed mỗi lần load page.
**Persistence**: Không — reset khi reload.

---

## Three.js Scene Graph

```
scene (THREE.Scene)
├── AmbientLight
├── DirectionalLight (keyLight) — color = hsl(cfg.hue, 80, 70)
├── PointLight (fillLight)      — color = hsl(hue2, 90, 60), pulsing intensity
├── PointLight (rimLight)       — white
├── Points (particles)          — PARTICLE_COUNT points, spherical distribution
├── Mesh (textMesh)             — TextGeometry + [matFront, matSide], rotates
└── Mesh (wireMesh)             — TextGeometry clone, wireframe, STATIC (ghost effect)
```

---

## Constants (Random per load, immutable)

| Constant | Range | Vai trò |
|----------|-------|---------|
| `CAM_DIST` | 18–28 | Khoảng cách camera tới origin |
| `CAM_ANGLE` | 0–2π | Góc bắt đầu của camera orbit |
| `PARTICLE_COUNT` | 60–100 | Số hạt trong particle field |
| `DEFAULTS` | snapshot of cfg | Snapshot để Reset về |

## Cập nhật lần cuối: 2026-03-25
