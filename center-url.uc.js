// ==UserScript==
// @name            Adaptive Tab Bar Color for Zen Browser
// @description     Dynamically changes tab bar color based on active tab content
// @author          zen-mod-dev
// @version         1.0.0
// @license         MIT
// ==/UserScript==

(function() {
    'use strict';

    class AdaptiveTabBarColor {
        constructor() {
            this.isEnabled = true;
            this.observer = null;
            this.currentColors = {
                background: null,
                text: null,
                border: null
            };
            this.colorCache = new Map();
            this.debounceTimer = null;
            
            this.init();
        }

        init() {
            // Wait for browser to be ready
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            // Setup tab change listeners
            this.setupTabListeners();
            
            // Setup page load listeners
            this.setupPageLoadListeners();
            
            // Initial color extraction
            setTimeout(() => this.extractAndApplyColors(), 1000);
            
            console.log('[Adaptive Tab Bar Color] Initialized successfully');
        }

        setupTabListeners() {
            const tabContainer = gBrowser.tabContainer;
            if (!tabContainer) return;

            // Listen for tab selection changes
            tabContainer.addEventListener('TabSelect', (event) => {
                this.debounceColorExtraction();
            });

            // Listen for new tabs
            tabContainer.addEventListener('TabOpen', (event) => {
                setTimeout(() => this.debounceColorExtraction(), 500);
            });
        }

        setupPageLoadListeners() {
            // Listen for page navigation
            gBrowser.addTabsProgressListener({
                onLocationChange: (browser, webProgress, request, location, flags) => {
                    if (browser === gBrowser.selectedBrowser) {
                        this.debounceColorExtraction();
                    }
                },
                onStateChange: (browser, webProgress, request, stateFlags, status) => {
                    if (browser === gBrowser.selectedBrowser && 
                        stateFlags & Ci.nsIWebProgressListener.STATE_STOP) {
                        setTimeout(() => this.debounceColorExtraction(), 1000);
                    }
                }
            });
        }

        debounceColorExtraction() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.extractAndApplyColors();
            }, 300);
        }

        async extractAndApplyColors() {
            if (!this.isEnabled) return;

            try {
                const activeTab = gBrowser.selectedTab;
                const browser = gBrowser.selectedBrowser;
                
                if (!activeTab || !browser) return;

                const url = browser.currentURI.spec;
                
                // Check cache first
                if (this.colorCache.has(url)) {
                    this.applyColors(this.colorCache.get(url));
                    return;
                }

                // Extract colors from favicon and page content
                const colors = await this.extractColorsFromPage(browser);
                
                // Cache the colors
                this.colorCache.set(url, colors);
                
                // Apply the colors
                this.applyColors(colors);
                
            } catch (error) {
                console.warn('[Adaptive Tab Bar Color] Error extracting colors:', error);
            }
        }

        async extractColorsFromPage(browser) {
            return new Promise((resolve) => {
                // Default colors
                let colors = {
                    background: 'rgba(46, 46, 46, 0.95)',
                    text: '#ffffff',
                    border: 'rgba(255, 255, 255, 0.1)',
                    accent: '#ff6600'
                };

                try {
                    // Try to extract from favicon
                    const tab = gBrowser.getTabForBrowser(browser);
                    const favicon = tab.getAttribute('image');
                    
                    if (favicon && favicon !== 'chrome://mozapps/skin/places/defaultFavicon.svg') {
                        this.extractColorsFromImage(favicon).then(faviconColors => {
                            if (faviconColors) {
                                colors = { ...colors, ...faviconColors };
                            }
                            resolve(colors);
                        }).catch(() => resolve(colors));
                    } else {
                        // Try to extract from page content
                        this.extractColorsFromContent(browser).then(contentColors => {
                            if (contentColors) {
                                colors = { ...colors, ...contentColors };
                            }
                            resolve(colors);
                        }).catch(() => resolve(colors));
                    }
                } catch (error) {
                    resolve(colors);
                }
            });
        }

        async extractColorsFromImage(imageUrl) {
            return new Promise((resolve) => {
                try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const colors = this.getDominantColor(imageData);
                            
                            resolve(colors);
                        } catch (error) {
                            resolve(null);
                        }
                    };
                    
                    img.onerror = () => resolve(null);
                    img.src = imageUrl;
                } catch (error) {
                    resolve(null);
                }
            });
        }

        async extractColorsFromContent(browser) {
            return new Promise((resolve) => {
                try {
                    // Use a script to extract theme colors from the page
                    const script = `
                        (() => {
                            try {
                                // Look for theme-color meta tag
                                const themeColorMeta = document.querySelector('meta[name="theme-color"]');
                                if (themeColorMeta) {
                                    return { themeColor: themeColorMeta.content };
                                }
                                
                                // Look for dominant colors in the page
                                const body = document.body;
                                const computedStyle = window.getComputedStyle(body);
                                return {
                                    backgroundColor: computedStyle.backgroundColor,
                                    color: computedStyle.color
                                };
                            } catch (error) {
                                return null;
                            }
                        })();
                    `;
                    
                    browser.messageManager.loadFrameScript('data:application/javascript,' + encodeURIComponent(`
                        try {
                            const result = ${script};
                            sendAsyncMessage('adaptive-color-result', result);
                        } catch (error) {
                            sendAsyncMessage('adaptive-color-result', null);
                        }
                    `), false);
                    
                    const handleMessage = (message) => {
                        browser.messageManager.removeMessageListener('adaptive-color-result', handleMessage);
                        const data = message.data;
                        
                        if (data && data.themeColor) {
                            resolve({
                                background: this.adjustColorOpacity(data.themeColor, 0.9),
                                accent: data.themeColor
                            });
                        } else if (data && data.backgroundColor && data.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                            resolve({
                                background: this.adjustColorOpacity(data.backgroundColor, 0.9)
                            });
                        } else {
                            resolve(null);
                        }
                    };
                    
                    browser.messageManager.addMessageListener('adaptive-color-result', handleMessage);
                    
                    // Timeout fallback
                    setTimeout(() => {
                        browser.messageManager.removeMessageListener('adaptive-color-result', handleMessage);
                        resolve(null);
                    }, 2000);
                    
                } catch (error) {
                    resolve(null);
                }
            });
        }

        getDominantColor(imageData) {
            const data = imageData.data;
            const colorCounts = {};
            const step = 4;
            
            for (let i = 0; i < data.length; i += step * 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                
                if (a < 128) continue; // Skip transparent pixels
                
                const color = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            }
            
            let dominantColor = null;
            let maxCount = 0;
            
            for (const color in colorCounts) {
                if (colorCounts[color] > maxCount) {
                    maxCount = colorCounts[color];
                    dominantColor = color;
                }
            }
            
            if (dominantColor) {
                const [r, g, b] = dominantColor.split(',').map(Number);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                
                return {
                    background: `rgba(${r}, ${g}, ${b}, 0.9)`,
                    text: brightness > 128 ? '#000000' : '#ffffff',
                    border: `rgba(${r}, ${g}, ${b}, 0.3)`,
                    accent: `rgb(${r}, ${g}, ${b})`
                };
            }
            
            return null;
        }

        adjustColorOpacity(color, opacity) {
            // Convert any color format to rgba with specified opacity
            const div = document.createElement('div');
            div.style.color = color;
            document.body.appendChild(div);
            const computedColor = getComputedStyle(div).color;
            document.body.removeChild(div);
            
            const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
            }
            return color;
        }

        applyColors(colors) {
            if (!colors) return;
            
            const root = document.documentElement;
            
            // Set CSS custom properties
            root.style.setProperty('--adaptive-bg-color', colors.background || 'transparent');
            root.style.setProperty('--adaptive-text-color', colors.text || 'inherit');
            root.style.setProperty('--adaptive-border-color', colors.border || 'transparent');
            root.style.setProperty('--adaptive-accent-color', colors.accent || '#ff6600');
            
            // Apply adaptive attributes
            const elements = [
                document.getElementById('TabsToolbar'),
                document.getElementById('nav-bar'),
                document.getElementById('urlbar'),
                document.getElementById('sidebar-box'),
                document.getElementById('PanelUI-menu-button'),
                document.getElementById('back-button'),
                document.getElementById('forward-button'),
                document.getElementById('reload-button')
            ];
            
            elements.forEach(element => {
                if (element) {
                    element.setAttribute('adaptive-color', 'true');
                }
            });
            
            // Apply to selected tab
            const selectedTab = gBrowser.selectedTab;
            if (selectedTab) {
                selectedTab.setAttribute('adaptive-color', 'true');
            }
            
            this.currentColors = colors;
        }

        toggle() {
            this.isEnabled = !this.isEnabled;
            
            if (!this.isEnabled) {
                this.clearColors();
            } else {
                this.extractAndApplyColors();
            }
            
            console.log(`[Adaptive Tab Bar Color] ${this.isEnabled ? 'Enabled' : 'Disabled'}`);
        }

        clearColors() {
            const root = document.documentElement;
            
            // Reset CSS custom properties
            root.style.removeProperty('--adaptive-bg-color');
            root.style.removeProperty('--adaptive-text-color');
            root.style.removeProperty('--adaptive-border-color');
            root.style.removeProperty('--adaptive-accent-color');
            
            // Remove adaptive attributes
            const elements = document.querySelectorAll('[adaptive-color="true"]');
            elements.forEach(element => {
                element.removeAttribute('adaptive-color');
            });
        }

        destroy() {
            this.clearColors();
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.colorCache.clear();
        }
    }

    // Initialize the adaptive tab bar color system
    const adaptiveTabBarColor = new AdaptiveTabBarColor();
    
    // Make it globally accessible for debugging
    window.adaptiveTabBarColor = adaptiveTabBarColor;
    
})(); 