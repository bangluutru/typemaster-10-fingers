# CLAUDE.md — typing10fingers (TypeMaster 10 Fingers)

## Mục tiêu & người dùng
- Web app luyện gõ bàn phím 10 ngón chuẩn, giao diện tiếng Việt: bài học theo level (bắt đầu từ Home Row), bàn phím ảo + lớp phủ bàn tay chỉ ngón cần dùng, đo WPM/độ chính xác, heatmap lỗi, streak, dashboard tiến độ, cài đặt (âm thanh…).
- Người dùng: người học gõ 10 ngón (người Việt). Không có tài khoản; tiến độ lưu trên trình duyệt.

## Stack & cấu trúc
- Vite 8 + React 19 + TypeScript ~6.0, Tailwind CSS v3 (`tailwind.config.js`, PostCSS + autoprefixer), lucide-react. SPA thuần, không backend, không router (App.tsx chuyển trang bằng state `currentPage`).
- `src/App.tsx` — khung app + điều hướng (home, lessons, practice, result, dashboard, settings); `src/pages/` — các trang.
- `src/hooks/useTypingEngine.ts` — engine gõ; `src/utils/typingMetrics.ts` (WPM, accuracy), `src/utils/sound.ts`.
- `src/stores/progressStore.ts`, `settingsStore.ts` — store tự viết bằng `useSyncExternalStore`, lưu `localStorage`.
- `src/data/lessons.ts` (danh sách bài, `minAccuracy`/`minWpm`), `src/data/fingerMapping.ts` (phím → ngón, nhãn, màu ngón).
- `src/components/typing/` — VirtualKeyboard, VirtualKey, keyboardLayout, HandOverlay, useKeyboardGeometry, KeyboardPracticeStage.
- `src/assets/left.svg`, `right.svg` — hình bàn tay; `src/assets/*.js` (find_tips, inspect_fingertips, list_all_major_finger_paths) là script Node khảo sát toạ độ đầu ngón trong SVG, không thuộc app.
- `src/test_screenshot.js` — script Playwright chụp màn hình http://localhost:5173/; `demo_hands.html` — bản vẽ thử SVG bàn tay độc lập.

## Lệnh
Chưa có `node_modules`: chạy `npm install` trước (lockfile npm).
- `npm run dev` (Vite, mặc định http://localhost:5173), `npm run build` (`tsc -b && vite build`, cũng là typecheck), `npm run preview`, `npm run lint`
- `node src/test_screenshot.js` — chụp màn hình khi dev server đang chạy (cần `npx playwright install chromium`).
- Không có test runner, không có CI, chưa có cấu hình deploy. TODO (người dùng xác nhận): nơi deploy.

## Điều bất biến
- Key `localStorage` `typemaster_progress` và `typemaster_settings` cùng cấu trúc `UserProgress`/`AppSettings` là dữ liệu người dùng: đổi cấu trúc phải đọc được dữ liệu cũ (app có import/reset progress).
- `id` bài học (`l1-1`, …) là khoá trong `completedLessons`; không đổi id bài đã có.
- Toạ độ đầu ngón trong HandOverlay đã được hiệu chỉnh khớp phím cách và Home Row; tay phải là bản lật của tay trái để đối xứng. Sửa SVG/scale phải kiểm tra lại căn chỉnh.
- Màu ngón lấy từ `fingerColors` trong `fingerMapping.ts`; giữ thống nhất giữa bàn phím ảo và bàn tay.

## Cách kiểm chứng
- `npm run lint` và `npm run build` pass.
- Thủ công: `npm run dev` → Home → Lessons → chọn "Bài 1" → gõ thử: bàn phím ảo và bàn tay chỉ đúng ngón cho từng phím, kết thúc ra trang Result có WPM/độ chính xác; reload trang thấy tiến độ còn trong Dashboard.
- Thay đổi giao diện bàn tay/bàn phím: chạy `node src/test_screenshot.js` và xem ảnh chụp.
