# Kiến Trúc Hệ Thống

## Tổng Quan

Frontend demo đơn file: `index.html` hiển thị "Hello World" 3D dùng Three.js với config panel tùy chỉnh real-time. Không có backend, không có build step — mở thẳng trong browser.

## Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Runtime | Browser (ES Modules) | Không cần Node.js |
| 3D Engine | Three.js r160.1 | Qua CDN (unpkg.com) |
| Font | Helvetiker Bold | Qua CDN (unpkg.com) |
| Build | Không có | Single-file, zero tooling |
| Deploy | Static hosting / local file | Bất kỳ HTTP server |

## Cấu Trúc Thư Mục

```
dw-e2e-global8/
├── index.html           # Toàn bộ app (HTML + CSS + JS inline)
├── CLAUDE.md            # Project instructions cho Claude Code
├── .dw/
│   ├── config/
│   │   └── dw.config.yml
│   ├── docs/            # Living docs (thư mục này)
│   └── tasks/
│       └── hello-world-3d/
│           ├── hello-world-3d-context.md
│           ├── hello-world-3d-plan.md
│           └── hello-world-3d-progress.md
└── .claude/
    ├── rules/           # Code style, commit, workflow rules
    ├── skills/          # dw-kit skill definitions
    └── templates/       # Task doc templates
```

## Modules

| Module | Vai trò | Location |
|--------|---------|----------|
| Scene setup | Three.js renderer, camera, fog | `index.html` L100–140 |
| Lights | Key/fill/rim lighting | `index.html` L142–152 |
| Particles | Background star field | `index.html` L155–175 |
| Text mesh | 3D TextGeometry + wireframe ghost | `index.html` L178–215 |
| Animation loop | RAF loop với single-instance guard | `index.html` L218–250 |
| Config panel | UI controls → reactive cfg object | `index.html` L280–650 |
| Font loader | CDN load + fallback | `index.html` L260–280 |

## Data Flow

```
Browser load
    │
    ▼
Random seed → cfg object (hue, rotX, rotY, orbitSpeed, starOpacity, text)
    │
    ├── Three.js Scene ──────────────────────────────┐
    │       ├── Particles (static, spherical dist.)  │
    │       ├── textMesh (rotates per cfg.rotX/Y)    │
    │       └── wireMesh (static ghost/shadow layer) │
    │                                                │
    └── Config Panel UI ──→ cfg.* update ────────────┘
            ├── Sliders → instant reactive (color/speed)
            └── Text input → Apply → buildText() → geometry rebuild
```

## Rendering Architecture

```
requestAnimationFrame loop
    ├── textMesh.rotation  = f(cfg.rotX, cfg.rotY, t)
    ├── textMesh.position.y = sin(t) bob
    ├── wireMesh           = STATIC (ghost effect relies on no-sync)
    ├── camera.position    = orbit(CAM_ANGLE + t * cfg.orbitSpeed)
    └── fillLight.intensity = 2.5 + sin(t) pulse
```

## Thiết Kế Quan Trọng

- **`cfg` object** là single source of truth cho tất cả mutable state
- **`wireMesh` không được sync** với `textMesh` — đây là intentional design tạo ghost/shadow layer
- **`started` flag** ngăn double animation loop nếu font load và error callback đều fire
- **`buildText()`** dispose geometry/material cũ trước khi tạo mới (tránh GPU leak)

## Cập nhật lần cuối: 2026-03-25
