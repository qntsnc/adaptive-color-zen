/* Adaptive Tab Bar Color for Zen Browser */
/* Динамически меняет цвета панели вкладок на основе содержимого активной вкладки */

(function() {
    'use strict';
    
    console.log('🎨 Adaptive Tab Color: Script starting...');
    
    let currentColors = {
        bg: '',
        text: '',
        border: ''
    };
    
    let colorUpdateInterval;
    
    // Конфигурация
    const CONFIG = {
        UPDATE_INTERVAL: 5000, // 5 секунд
        QUICK_TEST_DURATION: 2000, // 2 секунды для теста
        HEADER_SELECTORS: [
            'header',
            'nav',
            '.navbar',
            '.header',
            '.top-bar',
            '.site-header',
            '.page-header',
            '.masthead',
            '.banner',
            '[role="banner"]',
            '.hero',
            '.hero-section'
        ],
        MIN_ELEMENT_SIZE: 100, // минимальный размер элемента
        DEBUG: true
    };
    
    function debugLog(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`🎨 Adaptive Tab Color: ${message}`, data || '');
        }
    }
    
    function rgbToHex(rgbString) {
        if (!rgbString || rgbString === 'transparent') return null;
        
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgbString;
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    
    function getContrastColor(hexColor) {
        if (!hexColor) return '#000000';
        
        // Убираем # если есть
        hexColor = hexColor.replace('#', '');
        
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        
        // Вычисляем яркость
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // Возвращаем белый или черный в зависимости от яркости
        return brightness > 128 ? '#000000' : '#ffffff';
    }
    
    function applyColors(bgColor, textColor) {
        if (!bgColor) return;
        
        const hexBgColor = rgbToHex(bgColor);
        const finalTextColor = textColor || getContrastColor(hexBgColor);
        
        debugLog('Применяем цвета:', { bg: hexBgColor, text: finalTextColor });
        
        // Устанавливаем CSS переменные
        document.documentElement.style.setProperty('--adaptive-bg-color', hexBgColor);
        document.documentElement.style.setProperty('--adaptive-text-color', finalTextColor);
        document.documentElement.style.setProperty('--adaptive-border-color', hexBgColor);
        
        // Применяем атрибуты для активации стилей
        const elementsToStyle = [
            '#TabsToolbar',
            '.zen-tabs-container',
            '#nav-bar',
            '.zen-nav-bar',
            '.zen-sidebar',
            '#sidebar-box',
            '#urlbar'
        ];
        
        elementsToStyle.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.setAttribute('adaptive-color', 'true');
                debugLog(`Добавлен атрибут adaptive-color для ${selector}`);
            });
        });
        
        // Сохраняем текущие цвета
        currentColors.bg = hexBgColor;
        currentColors.text = finalTextColor;
        currentColors.border = hexBgColor;
    }
    
    function clearAdaptiveColors() {
        document.documentElement.style.removeProperty('--adaptive-bg-color');
        document.documentElement.style.removeProperty('--adaptive-text-color');
        document.documentElement.style.removeProperty('--adaptive-border-color');
        
        const adaptiveElements = document.querySelectorAll('[adaptive-color="true"]');
        adaptiveElements.forEach(element => {
            element.removeAttribute('adaptive-color');
        });
        
        debugLog('Адаптивные цвета очищены');
    }
    
    function updateColorsFromCurrentTab() {
        const currentBrowser = gBrowser.selectedBrowser;
        if (!currentBrowser || !currentBrowser.contentDocument) {
            debugLog('Нет активной вкладки для извлечения цветов');
            return;
        }
        
        debugLog('Обновляем цвета с текущей вкладки...');
        
        // Отправляем сообщение в content script
        currentBrowser.messageManager.sendAsyncMessage('AdaptiveTabColor:ExtractColors');
    }
    
    function startPeriodicColorUpdate() {
        debugLog('Запускаем периодическое обновление цветов каждые', CONFIG.UPDATE_INTERVAL + 'мс');
        
        colorUpdateInterval = setInterval(() => {
            updateColorsFromCurrentTab();
        }, CONFIG.UPDATE_INTERVAL);
    }
    
    function stopPeriodicColorUpdate() {
        if (colorUpdateInterval) {
            clearInterval(colorUpdateInterval);
            colorUpdateInterval = null;
            debugLog('Периодическое обновление остановлено');
        }
    }
    
    // Content script для извлечения цветов
    const contentScript = `
        data:,
        const { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
        
        const CONFIG = {
            HEADER_SELECTORS: [
                'header',
                'nav',
                '.navbar',
                '.header',
                '.top-bar',
                '.site-header',
                '.page-header',
                '.masthead',
                '.banner',
                '[role="banner"]',
                '.hero',
                '.hero-section'
            ],
            MIN_ELEMENT_SIZE: 100,
            DEBUG: true
        };
        
        function debugLog(message, data = null) {
            if (CONFIG.DEBUG) {
                console.log('🎨 Content Script: ' + message, data || '');
            }
        }
        
        function extractPageBackgroundColor() {
            debugLog('Извлекаем фоновый цвет страницы...');
            
            // Проверяем body
            const body = content.document.body;
            if (body) {
                const bodyStyle = content.getComputedStyle(body);
                const bodyBg = bodyStyle.backgroundColor;
                
                if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
                    debugLog('Найден фоновый цвет body:', bodyBg);
                    return bodyBg;
                }
            }
            
            // Проверяем html
            const html = content.document.documentElement;
            if (html) {
                const htmlStyle = content.getComputedStyle(html);
                const htmlBg = htmlStyle.backgroundColor;
                
                if (htmlBg && htmlBg !== 'rgba(0, 0, 0, 0)' && htmlBg !== 'transparent') {
                    debugLog('Найден фоновый цвет html:', htmlBg);
                    return htmlBg;
                }
            }
            
            // Проверяем основные контейнеры
            const containers = content.document.querySelectorAll('main, #main, .main, .container, .wrapper, .page');
            for (let container of containers) {
                const containerStyle = content.getComputedStyle(container);
                const containerBg = containerStyle.backgroundColor;
                
                if (containerBg && containerBg !== 'rgba(0, 0, 0, 0)' && containerBg !== 'transparent') {
                    debugLog('Найден фоновый цвет контейнера:', containerBg);
                    return containerBg;
                }
            }
            
            debugLog('Фоновый цвет страницы не найден, используем белый');
            return '#ffffff';
        }
        
        function extractColorsFromPage() {
            debugLog('Начинаем извлечение цветов со страницы...');
            
            let headerColor = null;
            
            // Ищем цвет в шапке сайта
            for (let selector of CONFIG.HEADER_SELECTORS) {
                const elements = content.document.querySelectorAll(selector);
                
                for (let element of elements) {
                    const rect = element.getBoundingClientRect();
                    
                    // Проверяем размер и позицию элемента
                    if (rect.width >= CONFIG.MIN_ELEMENT_SIZE && 
                        rect.height >= 30 && 
                        rect.top <= 200) { // элемент в верхней части страницы
                        
                        const style = content.getComputedStyle(element);
                        const bgColor = style.backgroundColor;
                        
                        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                            debugLog('Найден цвет шапки в ' + selector + ':', bgColor);
                            headerColor = bgColor;
                            break;
                        }
                    }
                }
                
                if (headerColor) break;
            }
            
            // Если шапка не найдена, берем фоновый цвет страницы
            if (!headerColor) {
                debugLog('Шапка не найдена, используем фоновый цвет страницы');
                headerColor = extractPageBackgroundColor();
            }
            
            return headerColor;
        }
        
        addMessageListener('AdaptiveTabColor:ExtractColors', function(message) {
            debugLog('Получено сообщение для извлечения цветов');
            
            try {
                const extractedColor = extractColorsFromPage();
                debugLog('Извлеченный цвет:', extractedColor);
                
                sendAsyncMessage('AdaptiveTabColor:ColorsExtracted', {
                    bgColor: extractedColor,
                    url: content.location.href
                });
            } catch (error) {
                debugLog('Ошибка при извлечении цветов:', error);
                sendAsyncMessage('AdaptiveTabColor:ColorsExtracted', {
                    bgColor: '#ffffff',
                    url: content.location.href
                });
            }
        });
        
        debugLog('Content script загружен для:', content.location.href);
    `;
    
    // Инициализация
    function init() {
        debugLog('Инициализация Adaptive Tab Color...');
        
        // Быстрый тест - красный цвет на 2 секунды
        debugLog('Запускаем быстрый тест с красным цветом...');
        applyColors('#ff0000', '#ffffff');
        
        setTimeout(() => {
            debugLog('Тест завершен, переходим к реальному извлечению цветов');
            
            // Регистрируем content script
            try {
                Services.mm.loadFrameScript(contentScript, true);
                debugLog('Content script зарегистрирован');
            } catch (error) {
                debugLog('Ошибка регистрации content script:', error);
            }
            
            // Слушаем сообщения от content script
            Services.mm.addMessageListener('AdaptiveTabColor:ColorsExtracted', function(message) {
                const data = message.data;
                debugLog('Получены цвета от content script:', data);
                
                if (data.bgColor) {
                    applyColors(data.bgColor);
                } else {
                    debugLog('Цвет не получен, применяем белый по умолчанию');
                    applyColors('#ffffff');
                }
            });
            
            // Запускаем первоначальное извлечение цветов
            updateColorsFromCurrentTab();
            
            // Запускаем периодическое обновление
            startPeriodicColorUpdate();
            
            // Обновляем цвета при смене вкладки
            gBrowser.tabContainer.addEventListener('TabSelect', () => {
                debugLog('Сменилась вкладка, обновляем цвета...');
                setTimeout(updateColorsFromCurrentTab, 100);
            });
            
            debugLog('Adaptive Tab Color полностью инициализирован');
            
        }, CONFIG.QUICK_TEST_DURATION);
    }
    
    // Очистка при выгрузке
    function cleanup() {
        debugLog('Выполняем очистку...');
        stopPeriodicColorUpdate();
        clearAdaptiveColors();
        
        try {
            Services.mm.removeMessageListener('AdaptiveTabColor:ColorsExtracted');
            Services.mm.removeDelayedFrameScript(contentScript);
        } catch (error) {
            debugLog('Ошибка при очистке:', error);
        }
    }
    
    // Ждем загрузки браузера
    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == 'browser-delayed-startup-finished' && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, topic);
    }
    
    // Очистка при закрытии окна
    window.addEventListener('unload', cleanup);
    
})(); 