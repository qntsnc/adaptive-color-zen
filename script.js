/**
 * Adaptive Tab Bar Color для Zen Browser
 * Автоматически изменяет цвет панели вкладок на основе доминирующего цвета веб-страницы
 */

(function() {
  'use strict';

  // Настройки и константы
  const SETTINGS = {
    enabled: true,
    smoothTransition: true,
    transitionDuration: 300,
    saturation: 70,
    brightness: 25,
    darkModeOnly: false,
    applyToSidebar: false,
    applyToUrlbar: false,
    excludedDomains: [],
    debounceDelay: 500
  };

  // Кэш для цветов доменов
  const colorCache = new Map();
  let debounceTimer = null;
  let lastDomain = null;

  /**
   * Загружает настройки из preferences
   */
  function loadSettings() {
    try {
      if (typeof Services !== 'undefined' && Services.prefs) {
        const prefs = Services.prefs;
        SETTINGS.enabled = prefs.getBoolPref('adaptive.tabbar.enabled', true);
        SETTINGS.smoothTransition = prefs.getBoolPref('adaptive.tabbar.smooth-transition', true);
        SETTINGS.transitionDuration = prefs.getIntPref('adaptive.tabbar.transition-duration', 300);
        SETTINGS.saturation = prefs.getIntPref('adaptive.tabbar.saturation', 70);
        SETTINGS.brightness = prefs.getIntPref('adaptive.tabbar.brightness', 25);
        SETTINGS.darkModeOnly = prefs.getBoolPref('adaptive.tabbar.dark-mode-only', false);
        SETTINGS.applyToSidebar = prefs.getBoolPref('adaptive.tabbar.apply-to-sidebar', false);
        SETTINGS.applyToUrlbar = prefs.getBoolPref('adaptive.tabbar.apply-to-urlbar', false);
        
        const excludedDomainsStr = prefs.getCharPref('adaptive.tabbar.excluded-domains', '');
        SETTINGS.excludedDomains = excludedDomainsStr
          .split(',')
          .map(domain => domain.trim())
          .filter(domain => domain.length > 0);
      }
    } catch (e) {
      console.warn('Adaptive Tab Bar Color: Ошибка загрузки настроек:', e);
    }
  }

  /**
   * Извлекает доминирующий цвет из изображения
   */
  function extractDominantColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width || 64;
    canvas.height = img.height || 64;
    
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const colorCounts = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Пропускаем прозрачные пиксели
        if (a < 128) continue;
        
        // Группируем похожие цвета
        const key = `${Math.floor(r / 16) * 16}-${Math.floor(g / 16) * 16}-${Math.floor(b / 16) * 16}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
      
      // Находим наиболее часто встречающийся цвет
      let dominantColor = null;
      let maxCount = 0;
      
      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          const [r, g, b] = color.split('-').map(Number);
          dominantColor = { r, g, b };
        }
      }
      
      return dominantColor;
    } catch (e) {
      console.warn('Adaptive Tab Bar Color: Ошибка извлечения цвета:', e);
      return null;
    }
  }

  /**
   * Получает цвет темы из meta тега
   */
  function getThemeColor(doc) {
    const themeColorMeta = doc.querySelector('meta[name="theme-color"]') ||
                          doc.querySelector('meta[name="msapplication-TileColor"]');
    
    if (themeColorMeta) {
      const color = themeColorMeta.getAttribute('content');
      if (color) {
        return hexToRgb(color);
      }
    }
    return null;
  }

  /**
   * Получает доминирующий цвет из favicon
   */
  function getFaviconColor(doc) {
    return new Promise((resolve) => {
      const favicon = doc.querySelector('link[rel*="icon"]');
      if (!favicon) {
        resolve(null);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const color = extractDominantColor(img);
        resolve(color);
      };
      
      img.onerror = () => resolve(null);
      
      try {
        img.src = favicon.href;
      } catch (e) {
        resolve(null);
      }
    });
  }

  /**
   * Конвертирует HEX в RGB
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Конвертирует RGB в HSL
   */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Конвертирует HSL в RGB
   */
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return { r, g, b };
  }

  /**
   * Регулирует цвет согласно настройкам
   */
  function adjustColor(color) {
    const hsl = rgbToHsl(color.r, color.g, color.b);
    
    // Применяем настройки насыщенности и яркости
    hsl.s = SETTINGS.saturation;
    hsl.l = SETTINGS.brightness;
    
    return hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Применяет цвет к интерфейсу
   */
  function applyColor(color) {
    if (!color) return;
    
    const adjustedColor = adjustColor(color);
    const primaryColor = `rgb(${adjustedColor.r}, ${adjustedColor.g}, ${adjustedColor.b})`;
    const secondaryColor = `rgba(${adjustedColor.r}, ${adjustedColor.g}, ${adjustedColor.b}, 0.8)`;
    
    // Вычисляем контрастный цвет для текста
    const brightness = (adjustedColor.r * 299 + adjustedColor.g * 587 + adjustedColor.b * 114) / 1000;
    const textColor = brightness > 128 ? '#000000' : '#ffffff';
    const borderColor = brightness > 128 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    const root = document.documentElement;
    root.style.setProperty('--adaptive-primary-color', primaryColor);
    root.style.setProperty('--adaptive-secondary-color', secondaryColor);
    root.style.setProperty('--adaptive-text-color', textColor);
    root.style.setProperty('--adaptive-border-color', borderColor);
    root.style.setProperty('--adaptive-transition-duration', `${SETTINGS.transitionDuration}ms`);
    
    // Устанавливаем атрибуты для CSS селекторов
    root.setAttribute('adaptive-tabbar-enabled', SETTINGS.enabled.toString());
    root.setAttribute('adaptive-smooth-transition', SETTINGS.smoothTransition.toString());
    root.setAttribute('adaptive-dark-mode-only', SETTINGS.darkModeOnly.toString());
    root.setAttribute('adaptive-apply-to-sidebar', SETTINGS.applyToSidebar.toString());
    root.setAttribute('adaptive-apply-to-urlbar', SETTINGS.applyToUrlbar.toString());
  }

  /**
   * Проверяет, исключён ли домен
   */
  function isDomainExcluded(domain) {
    return SETTINGS.excludedDomains.some(excluded => 
      domain.includes(excluded) || excluded.includes(domain)
    );
  }

  /**
   * Обрабатывает изменение активной вкладки
   */
  async function handleTabChange() {
    if (!SETTINGS.enabled) return;
    
    try {
      const currentTab = typeof gBrowser !== 'undefined' ? gBrowser.selectedTab : null;
      if (!currentTab || !currentTab.linkedBrowser) return;
      
      const doc = currentTab.linkedBrowser.contentDocument;
      if (!doc || !doc.location) return;
      
      const domain = doc.location.hostname;
      
      // Проверяем исключения
      if (isDomainExcluded(domain)) return;
      
      // Проверяем тёмную тему если включена соответствующая настройка
      if (SETTINGS.darkModeOnly && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return;
      }
      
      // Используем кэш если домен уже обрабатывался
      if (colorCache.has(domain)) {
        applyColor(colorCache.get(domain));
        return;
      }
      
      // Сначала пробуем получить цвет из meta тега
      let color = getThemeColor(doc);
      
      // Если не найден, пробуем извлечь из favicon
      if (!color) {
        color = await getFaviconColor(doc);
      }
      
      // Если цвет найден, кэшируем и применяем
      if (color) {
        colorCache.set(domain, color);
        applyColor(color);
      }
    } catch (e) {
      console.warn('Adaptive Tab Bar Color: Ошибка обработки:', e);
    }
  }

  /**
   * Debounced версия handleTabChange
   */
  function debouncedHandleTabChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleTabChange, SETTINGS.debounceDelay);
  }

  /**
   * Инициализация
   */
  function init() {
    loadSettings();
    
    try {
      // Слушаем изменения вкладок
      if (typeof gBrowser !== 'undefined' && gBrowser.tabContainer) {
        gBrowser.tabContainer.addEventListener('TabSelect', debouncedHandleTabChange);
      }
      
      // Слушаем загрузку страниц
      if (typeof gBrowser !== 'undefined') {
        gBrowser.addEventListener('DOMContentLoaded', debouncedHandleTabChange);
      }
      
      // Слушаем изменения preferences
      if (typeof Services !== 'undefined' && Services.prefs) {
        Services.prefs.addObserver('adaptive.tabbar.', {
          observe: function(subject, topic, data) {
            loadSettings();
            handleTabChange();
          }
        });
      }
      
      // Первоначальная обработка
      setTimeout(handleTabChange, 1000);
    } catch (e) {
      console.warn('Adaptive Tab Bar Color: Ошибка инициализации:', e);
    }
  }

  /**
   * Очистка при выгрузке
   */
  function cleanup() {
    try {
      if (typeof gBrowser !== 'undefined') {
        if (gBrowser.tabContainer) {
          gBrowser.tabContainer.removeEventListener('TabSelect', debouncedHandleTabChange);
        }
        gBrowser.removeEventListener('DOMContentLoaded', debouncedHandleTabChange);
      }
      clearTimeout(debounceTimer);
      colorCache.clear();
    } catch (e) {
      console.warn('Adaptive Tab Bar Color: Ошибка очистки:', e);
    }
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Задержка для полной загрузки Zen Browser
    setTimeout(init, 2000);
  }

  // Очистка при выгрузке страницы
  if (typeof window !== 'undefined') {
    window.addEventListener('unload', cleanup);
  }

})(); 