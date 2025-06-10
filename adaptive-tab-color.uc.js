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
            console.log('[Adaptive Tab Color] Init called, readyState:', document.readyState);
            
            // Force immediate setup
            this.setup();
            
            // Also setup on load as backup
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => {
                    console.log('[Adaptive Tab Color] Window loaded, setting up again...');
                    this.setup();
                });
            }
        }

        setup() {
            console.log('[Adaptive Tab Color] Starting setup...');
            
            // Setup tab change listeners
            this.setupTabListeners();
            
            // Setup page load listeners  
            this.setupPageLoadListeners();
            
            // Initial color extraction with force
            setTimeout(() => {
                console.log('[Adaptive Tab Color] Initial extraction starting...');
                this.extractAndApplyColors();
            }, 2000);
            
            // Force initial color for testing
            this.testColors();
            
            console.log('[Adaptive Tab Color] Setup completed');
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
            if (!this.isEnabled) {
                console.log('[Adaptive Tab Color] Disabled, skipping');
                return;
            }

            try {
                const activeTab = gBrowser.selectedTab;
                const browser = gBrowser.selectedBrowser;
                
                if (!activeTab || !browser) {
                    console.log('[Adaptive Tab Color] No active tab or browser');
                    return;
                }

                const url = browser.currentURI.spec;
                console.log('[Adaptive Tab Color] Processing URL:', url);
                
                // Check cache first
                if (this.colorCache.has(url)) {
                    console.log('[Adaptive Tab Color] Using cached colors for:', url);
                    this.applyColors(this.colorCache.get(url));
                    return;
                }

                // Extract colors from page content
                console.log('[Adaptive Tab Color] Extracting colors from page...');
                const colors = await this.extractColorsFromPage(browser);
                
                console.log('[Adaptive Tab Color] Extracted colors:', colors);
                
                // Cache the colors
                this.colorCache.set(url, colors);
                
                // Apply the colors
                this.applyColors(colors);
                
            } catch (error) {
                console.error('[Adaptive Tab Color] Error extracting colors:', error);
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
                    const tab = gBrowser.getTabForBrowser(browser);
                    const url = browser.currentURI.spec;
                    
                    // ONLY try to extract from page header - no fallbacks to favicon
                    this.extractColorsFromContent(browser).then(contentColors => {
                        if (contentColors) {
                            resolve({ ...colors, ...contentColors });
                        } else {
                            // If no header color found, use default
                            resolve(colors);
                        }
                    }).catch(() => {
                        resolve(colors);
                    });
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

                testColors() {
            console.log('[Adaptive Tab Color] Testing color application...');
            
            try {
                // Force red background directly on DOM elements to test
                const root = document.documentElement;
                
                console.log('[Adaptive Tab Color] Setting test CSS variables...');
                root.style.setProperty('--adaptive-bg-color', 'red');
                root.style.setProperty('--adaptive-text-color', 'white');
                
                // Find and modify toolbar elements directly
                const elements = [
                    '#TabsToolbar',
                    '#navigator-toolbox', 
                    '#nav-bar',
                    '.titlebar'
                ];
                
                elements.forEach(selector => {
                    const el = document.querySelector(selector);
                    if (el) {
                        console.log(`[Adaptive Tab Color] Found and coloring: ${selector}`);
                        el.style.backgroundColor = 'red !important';
                        el.setAttribute('adaptive-color', 'true');
                    } else {
                        console.log(`[Adaptive Tab Color] Element not found: ${selector}`);
                    }
                });
                
                // Revert after 5 seconds
                setTimeout(() => {
                    console.log('[Adaptive Tab Color] Reverting test colors...');
                    elements.forEach(selector => {
                        const el = document.querySelector(selector);
                        if (el) {
                            el.style.backgroundColor = '';
                            el.removeAttribute('adaptive-color');
                        }
                    });
                    this.clearColors();
                }, 5000);
                
            } catch (error) {
                console.error('[Adaptive Tab Color] Error in testColors:', error);
            }
        }

        async extractColorsFromContent(browser) {
            return new Promise((resolve) => {
                console.log('[Adaptive Tab Color] Extracting colors (simplified)...');
                
                try {
                    // Try direct DOM access without messageManager
                    const doc = browser.contentDocument;
                    if (!doc) {
                        console.log('[Adaptive Tab Color] No content document available');
                        resolve(null);
                        return;
                    }
                    
                    console.log('[Adaptive Tab Color] Searching for header elements...');
                    
                    // Look for header elements
                    const selectors = ['header', 'nav', '.header', '.navbar', '.top-bar', '.topbar'];
                    let foundColor = null;
                    
                    for (const selector of selectors) {
                        const elements = doc.querySelectorAll(selector);
                        console.log(`[Adaptive Tab Color] Found ${elements.length} elements for selector: ${selector}`);
                        
                        for (const el of elements) {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 200 && rect.height > 20) {
                                const style = doc.defaultView.getComputedStyle(el);
                                const bg = style.backgroundColor;
                                
                                if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
                                    console.log(`[Adaptive Tab Color] Found header color: ${bg} from ${selector}`);
                                    foundColor = bg;
                                    break;
                                }
                            }
                        }
                        if (foundColor) break;
                    }
                    
                    if (foundColor) {
                        // Parse RGB values
                        const match = foundColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
                        if (match) {
                            const r = parseInt(match[1]);
                            const g = parseInt(match[2]);
                            const b = parseInt(match[3]);
                            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                            const textColor = brightness > 128 ? '#000000' : '#ffffff';
                            
                            resolve({
                                background: `rgba(${r}, ${g}, ${b}, 0.9)`,
                                text: textColor,
                                border: `rgba(${r}, ${g}, ${b}, 0.3)`,
                                accent: `rgb(${r}, ${g}, ${b})`
                            });
                            return;
                        }
                    }
                    
                    console.log('[Adaptive Tab Color] No header color found');
                    resolve(null);
                    
                } catch (error) {
                    console.error('[Adaptive Tab Color] Error in direct DOM access:', error);
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

        getSiteSpecificColors(url) {
            // Minimal fallback colors only for sites where header extraction consistently fails
            const siteColorMap = {
                // Only keep essential fallbacks - most sites should use header extraction
            };

            // Check if current URL matches any predefined site
            for (const [domain, colors] of Object.entries(siteColorMap)) {
                if (url.includes(domain)) {
                    return colors;
                }
            }
            
            return null;
        }

        isColorValid(colors) {
            // Validate extracted colors
            if (!colors.background && !colors.accent) {
                return false;
            }

            // Check if colors are too saturated (but allow bright colors like white)
            if (colors.background) {
                const rgb = this.parseColor(colors.background);
                if (rgb) {
                    const saturation = this.calculateSaturation(rgb.r, rgb.g, rgb.b);
                    
                    // Only reject colors that are too saturated (neon colors), but allow white/light colors
                    if (saturation > 0.9) {
                        return false;
                    }
                }
            }

            return true;
        }

        parseColor(colorString) {
            // Parse rgba or rgb color string
            const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            if (rgbaMatch) {
                return {
                    r: parseInt(rgbaMatch[1]),
                    g: parseInt(rgbaMatch[2]),
                    b: parseInt(rgbaMatch[3])
                };
            }
            return null;
        }

        calculateSaturation(r, g, b) {
            // Calculate color saturation
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (max === 0) return 0;
            return delta / max;
        }

        applyColors(colors) {
            console.log('[Adaptive Tab Color] Applying colors:', colors);
            
            if (!colors) {
                console.log('[Adaptive Tab Color] No colors to apply');
                return;
            }
            
            const root = document.documentElement;
            
            // Set CSS custom properties (THIS IS THE BRIDGE BETWEEN JS AND CSS!)
            console.log('[Adaptive Tab Color] Setting CSS variables...');
            root.style.setProperty('--adaptive-bg-color', colors.background || 'transparent');
            root.style.setProperty('--adaptive-text-color', colors.text || 'inherit');
            root.style.setProperty('--adaptive-border-color', colors.border || 'transparent');
            root.style.setProperty('--adaptive-accent-color', colors.accent || '#ff6600');
            
            // Verify variables were set
            console.log('[Adaptive Tab Color] CSS Variables set:');
            console.log('  --adaptive-bg-color:', root.style.getPropertyValue('--adaptive-bg-color'));
            console.log('  --adaptive-text-color:', root.style.getPropertyValue('--adaptive-text-color'));
            
            // Apply adaptive attributes to trigger CSS rules
            console.log('[Adaptive Tab Color] Applying adaptive attributes...');
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
            
            let appliedCount = 0;
            elements.forEach(element => {
                if (element) {
                    element.setAttribute('adaptive-color', 'true');
                    appliedCount++;
                    console.log(`[Adaptive Tab Color] Applied to: ${element.id}`);
                } else {
                    console.log(`[Adaptive Tab Color] Element not found in DOM`);
                }
            });
            
            console.log(`[Adaptive Tab Color] Applied adaptive-color attribute to ${appliedCount} elements`);
            
            // Apply to selected tab
            const selectedTab = gBrowser.selectedTab;
            if (selectedTab) {
                selectedTab.setAttribute('adaptive-color', 'true');
                console.log('[Adaptive Tab Color] Applied to selected tab');
            }
            
            this.currentColors = colors;
            console.log('[Adaptive Tab Color] Color application completed');
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

    // Log that script is loading
    console.log('[Adaptive Tab Color] Script loading... DOM ready:', document.readyState);
    
    // Wait a bit for DOM to be ready, then initialize
    setTimeout(() => {
        try {
            console.log('[Adaptive Tab Color] Initializing...');
            const adaptiveTabBarColor = new AdaptiveTabBarColor();
            
            // Make it globally accessible for debugging
            window.adaptiveTabBarColor = adaptiveTabBarColor;
            
            console.log('[Adaptive Tab Color] Script initialized successfully');
            
            // Test in console: window.adaptiveTabBarColor.testColors()
        } catch (error) {
            console.error('[Adaptive Tab Color] Failed to initialize:', error);
        }
    }, 1000);
    
})(); 