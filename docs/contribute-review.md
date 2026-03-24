# Contribute Review — Evaluation and Applied Improvements

## 1) Đánh giá nội dung review

### Điểm đúng
- Rủi ro over-engineering cho task nhỏ là có thật.
- Rủi ro config drift và plan sai do AI là có thật.
- Handoff phụ thuộc mạnh vào `progress.md`.

### Điểm lỗi thời / cần chỉnh
- Không còn mô hình `level`/`flags` cũ cho v1.
- Runtime hiện tại là `.dw/tasks/`, không còn `.dev-tasks/` cho flow chuẩn.
- V1 dùng `workflow.default_depth` + task-level depth override thay vì tư duy "1 mode cho cả dự án".

## 2) Cải thiện đã áp dụng trong code/docs

### A. Init flow tránh conflict depth/roles
- Interactive `dw init` đã tinh gọn còn 3 câu hỏi: project, depth, language.
- Roles auto-map theo depth:
  - quick -> `dev`
  - standard -> `dev,techlead`
  - thorough -> `dev,techlead,ba,qc,pm`
- `--silent`: nếu `DW_ROLES` thiếu roles bắt buộc theo depth thì auto-add + warning.

### B. Task-level depth override
- Bổ sung guidance vào `core/WORKFLOW.md`:
  - `default_depth` là baseline.
  - Task có thể override depth theo scope/risk thực tế.
- Bổ sung fields vào `.dw/core/templates/vi/task-context.md`:
  - `Depth Source: default | override`
  - `Override Reason`

### C. Quality gate v1 schema compatibility fix
- Sửa `.claude/hooks/pre-commit-gate.sh`:
  - Bỏ đọc keys cũ `pre_commit_tests/pre_commit_lint/block_commit_on_fail`.
  - Đọc keys v1: `quality.test_command`, `quality.lint_command`, `quality.block_on_fail`.
  - Cập nhật message từ `dv-workflow` -> `dw-kit`.

## 3) Trạng thái self-test sau cải thiện

- Smoke tests: pass (21 tests)
- E2E local publish check: pass (`npm run test:e2e-local`)
- Lint diagnostics: không có lỗi mới

## 4) Khuyến nghị tiếp theo (tùy chọn)

- Nếu muốn giảm rủi ro AI plan sai hơn nữa:
  - thêm checklist approve ngắn cho human trước execute.
- Nếu muốn tăng security:
  - bổ sung pattern scan mạnh hơn cho secret detection (ngoài regex hiện tại).