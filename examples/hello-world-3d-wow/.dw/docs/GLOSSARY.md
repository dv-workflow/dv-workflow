# Glossary

| Thuật ngữ | Định nghĩa |
|-----------|-----------|
| `cfg` | Mutable config object — single source of truth cho tất cả scene parameters |
| `textMesh` | Three.js Mesh chứa 3D TextGeometry với MeshStandardMaterial (metallic neon) |
| `wireMesh` | Wireframe clone của textGeo, đứng yên — tạo ghost/shadow layer khi textMesh xoay |
| `buildText()` | Hàm rebuild 3D text geometry khi `cfg.text` thay đổi |
| `hue2` | Derived color: `(cfg.hue + 150) % 360` — màu accent phụ |
| Ghost shadow effect | Hiệu ứng visual khi `wireMesh` static + `textMesh` xoay → wireframe lộ ra tạo depth |
| RAF | `requestAnimationFrame` — browser API cho smooth 60fps animation loop |
| SRI | Subresource Integrity — hash verification cho CDN resources (chưa áp dụng, xem ADR-002) |
| importmap | Browser feature cho ES Module import aliasing, không cần bundler |
| TextGeometry | Three.js addon tạo 3D text từ font JSON, cần `FontLoader` |
| `reducedMotion` | `prefers-reduced-motion` media query — tắt animation cho accessibility |
| dw-kit | Workflow toolkit của dự án (`.dw/`, `.claude/skills/`) |

## Cập nhật lần cuối: 2026-03-25
