# Context: add-missing-templates

## Ngày khảo sát: 2026-03-10
## Người thực hiện: agent (researcher)

---

## Yêu Cầu Gốc

> Một số skills trong toolkit reference đến các file phụ (templates, checklists) nhưng những file đó chưa được tạo. Cần tạo đầy đủ để skills hoạt động đúng như thiết kế.

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Cần thay đổi? | Ghi chú |
|---|------|---------|----------------|---------|
| 1 | `.claude/skills/research/SKILL.md` | Skill research | Không | Reference `template-research.md` ở line cuối |
| 2 | `.claude/skills/research/template-research.md` | Template output | **Tạo mới** | File bị thiếu — skill mention nhưng không tồn tại |
| 3 | `.claude/skills/review/SKILL.md` | Skill review | Không | Reference `checklist.md` |
| 4 | `.claude/skills/review/checklist.md` | Review checklist | **Tạo mới** | File bị thiếu |
| 5 | `.claude/skills/plan/SKILL.md` | Skill plan | Không | Reference `template-plan.md` |
| 6 | `.claude/skills/plan/template-plan.md` | Template output | **Tạo mới** | File bị thiếu |

### Kiến Trúc Hiện Tại

```
.claude/skills/
├── research/
│   ├── SKILL.md          ✅ Tồn tại
│   └── template-research.md  ❌ Thiếu  ← SKILL.md nói: "Xem template-research.md"
├── review/
│   ├── SKILL.md          ✅ Tồn tại
│   └── checklist.md      ❌ Thiếu  ← SKILL.md nói: "Xem checklist.md"
└── plan/
    ├── SKILL.md          ✅ Tồn tại
    └── template-plan.md  ❌ Thiếu  ← SKILL.md nói: "Xem template-plan.md"
```

### Dependencies

**Upstream**: Không có
**Downstream**: Khi researcher agent chạy, sẽ dùng template-research.md để format output; reviewer dùng checklist.md

## Patterns & Conventions Phát Hiện

| Pattern | Mô tả | Ví dụ |
|---------|--------|--------------------|
| Supporting files | Mỗi skill có thể có files phụ trong cùng thư mục | `research/template-research.md` |
| @-import reference | SKILL.md có thể reference files khác bằng đường dẫn relative | `template-research.md` |
| Template as guide | Template files giúp agent format output nhất quán | Mọi skills có output docs |

## Test Coverage Hiện Tại

- Không có automated tests (toolkit là tập hợp markdown instructions)
- Verification: chạy thủ công và kiểm tra output

## Giả Định

| # | Giả định | Cần kiểm chứng? | Nếu sai thì sao? |
|---|----------|------------------|-------------------|
| 1 | Claude Code tìm file trong cùng thư mục với SKILL.md khi reference relative path | Không (chuẩn Claude Code) | Template sẽ không load được |
| 2 | Templates là supporting files, không phải SKILL.md | Không | |

## Chưa Rõ / Cần Làm Rõ

- [x] Không còn unknowns — scope rõ ràng

## Ghi Chú Bổ Sung

Đây là lỗi thiếu file được phát hiện trong quá trình build toolkit ban đầu. Task nhỏ, 3 files cần tạo, không ảnh hưởng đến files hiện có.
