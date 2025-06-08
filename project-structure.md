# Структура проекта Adaptive Tab Bar Color

Этот документ описывает структуру и назначение файлов в проекте.

## 📁 Файлы проекта

### 🎨 Основные файлы мода
- **`theme.json`** - Метаданные мода, настройки интерфейса Sine
- **`chrome.css`** - Основные CSS стили для интерфейса Zen Browser
- **`script.js`** - JavaScript логика извлечения и применения цветов
- **`userContent.css`** - Дополнительные стили для веб-страниц

### 📚 Документация
- **`README.md`** - Основное описание мода и инструкции
- **`INSTALL.md`** - Подробные инструкции по установке
- **`LICENSE`** - Лицензия MIT
- **`project-structure.md`** - Этот файл

### 🖥️ Демонстрация
- **`preview.html`** - Интерактивная демо-страница мода

### ⚙️ Конфигурация
- **`.gitignore`** - Список исключаемых файлов для git

## 🔧 Технические детали

### theme.json
Содержит:
- Метаданные мода (название, автор, версия)
- Настройки интерфейса Sine с использованием расширенных возможностей
- Условные настройки и форматирование текста
- Все preference ключи для конфигурации

### chrome.css
Включает:
- CSS переменные для динамических цветов
- Стили для панели вкладок, боковой панели, адресной строки
- Поддержка плавных переходов
- Адаптация к светлой/тёмной теме
- Совместимость с элементами Zen Browser

### script.js
Реализует:
- Извлечение цветов из meta-тегов и favicon
- Алгоритм анализа доминирующего цвета
- Конвертацию цветовых пространств (RGB ↔ HSL)
- Кэширование цветов по доменам
- Debounced обработку событий
- Интеграцию с preferences системой

### userContent.css
Предоставляет:
- Предустановленные цвета для популярных сайтов
- @-moz-document правила для специфичных доменов
- Улучшения для анализа цветов

## 🚀 Совместимость с Sine

Мод полностью совместим с системой Sine:
- ✅ Стандартная структура theme.json
- ✅ Поддержка всех типов настроек Sine
- ✅ Условные настройки с операторами AND/OR
- ✅ Форматирование текста и разделители
- ✅ Автоматическое обновление через GitHub

## 📋 Preferences ключи

### Основные
- `adaptive.tabbar.enabled` (boolean)
- `adaptive.tabbar.smooth-transition` (boolean)  
- `adaptive.tabbar.transition-duration` (integer, 100-1000)

### Цвет
- `adaptive.tabbar.saturation` (integer, 0-100)
- `adaptive.tabbar.brightness` (integer, 10-90)
- `adaptive.tabbar.dark-mode-only` (boolean)

### Применение
- `adaptive.tabbar.apply-to-sidebar` (boolean)
- `adaptive.tabbar.apply-to-urlbar` (boolean)

### Исключения
- `adaptive.tabbar.excluded-domains` (string, CSV)

## 🎯 Алгоритм работы

1. **Инициализация**: Загрузка настроек и установка event listeners
2. **Обнаружение изменений**: TabSelect и DOMContentLoaded события
3. **Извлечение цвета**:
   - Поиск meta[name="theme-color"]
   - Fallback к анализу favicon
   - Использование предустановленных цветов
4. **Обработка цвета**: HSL корректировка согласно настройкам
5. **Применение**: Установка CSS переменных и атрибутов
6. **Кэширование**: Сохранение результата для домена

## 🔄 Жизненный цикл

```
Browser Start
     ↓
Load Settings
     ↓
Init Event Listeners
     ↓
Tab Change Event
     ↓
Extract Color (theme-color → favicon → defaults)
     ↓
Process Color (adjust saturation/brightness)
     ↓
Apply to Interface (CSS variables)
     ↓
Cache Result
     ↓
Wait for Next Event
```

## 🛠️ Разработка

### Локальное тестирование
1. Установите мод через Sine
2. Внесите изменения в файлы
3. CSS изменения применяются сразу
4. JavaScript требует перезапуска браузера

### Отладка
- Используйте Browser Toolbox (Ctrl+Alt+Shift+I)
- Проверяйте консоль на предупреждения
- Используйте about:config для проверки preferences

### Добавление новых сайтов
В userContent.css добавьте:
```css
@-moz-document domain("example.com") {
  :root {
    --adaptive-site-hint: #color;
  }
}
```

## 📈 Производительность

- Debounced обработка событий (500ms)
- Кэширование цветов по доменам
- Ленивая инициализация
- Минимальные DOM операции

## 🔒 Безопасность

- Проверка доступности объектов
- try-catch блоки вокруг критичного кода
- Graceful fallback при ошибках
- Безопасная работа с canvas для favicon

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025 