# Higsvil - React + TypeScript + Vite + Tailwind CSS

Проект создан с использованием React, TypeScript, Vite и Tailwind CSS.

## 🎯 Функционал

### 🎨 Кастомные цвета Tailwind CSS
Настроенная цветовая палитра с удобными классами:

**Цвета:**
- `custom-black` / `#000000` - Чёрный
- `custom-lime` / `neon-lime` / `#D1FE17` - Яркий неоновый лайм
- `custom-blue` / `soft-blue` / `#93B5C6` - Мягкий голубой
- `custom-white` / `#FFFFFF` - Белый
- `custom-red` / `bright-red` / `#FF0022` - Яркий красный

**Использование:**
```jsx
// Текст
<p className="text-custom-lime">Neon text</p>

// Фон
<div className="bg-custom-blue">Content</div>

// Границы
<button className="border-2 border-custom-red">Button</button>

// Hover эффекты
<button className="hover:bg-custom-lime hover:text-black">Hover me</button>
```

Демо доступно: `/colors`

### 📹 Video Frame Capture
Пример использования библиотеки `capture-video-frame` для захвата кадров из видео:

**🎬 Автоматическая раскадровка:**
- Автоматический захват кадров из первой минуты видео
- Выбор частоты кадров: **24 FPS** (кино - 1440 кадров), 10 FPS, 5 FPS, 2 FPS или кастомный интервал
- 24 FPS - профессиональный стандарт кинематографа
- Прогресс-бар для отслеживания процесса
- Просмотр всех кадров в виде сетки
- Скачивание всех кадров одним нажатием

**🎞️ Видео-лента из кадров (новая функция!):**
- Превращение кадров в интерактивное видео
- Воспроизведение, пауза, перемотка вперёд/назад
- Интерактивная временная шкала (timeline)
- Регулируемая скорость воспроизведения (12-60 FPS)
- Клик на любой кадр для быстрого перехода
- Отображение текущего кадра, времени и прогресса

**📸 Ручной захват:**
- Загрузка локальных видео файлов
- Загрузка примера видео
- Захват кадров в реальном времени
- Скачивание захваченных кадров в формате PNG
- Красивый интерфейс с использованием Tailwind CSS

Доступно по адресу: `/video-capture`

#### Пример использования:

```typescript
// Ручной захват кадра
import captureFrame from 'capture-video-frame';

const frame = captureFrame(videoElement, 'png');
// frame.dataUri - содержит base64 изображение

// Автоматическая раскадровка
const captureFrameAtTime = async (time: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = videoRef.current;
    const onSeeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/png');
      video.removeEventListener('seeked', onSeeked);
      resolve(dataUri);
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
};

// Захват кадров с частотой 24 FPS (кинематографический стандарт)
const duration = Math.min(video.duration, 60);
const fps = 24;
const interval = 1 / fps; // ~0.041667 секунды между кадрами

for (let t = 0; t < duration; t += interval) {
  const frame = await captureFrameAtTime(t);
  frames.push({ dataUri: frame, timestamp: t });
}

// Результат: 1440 кадров за минуту видео
```

Приложение автоматически использует резервный метод с Canvas API, если библиотека capture-video-frame недоступна.

## 🚀 Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр продакшена
npm run preview
```

## 📦 Технологии

- **React** - библиотека для создания пользовательских интерфейсов
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик и dev-сервер
- **Tailwind CSS v4** - utility-first CSS фреймворк
- **React Router** - маршрутизация
- **capture-video-frame** - захват кадров из видео

---

## Vite Plugins

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
