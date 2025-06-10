# Adaptive Tab Bar Color for Zen Browser

Dynamically changes the tab bar color based on the active tab's content, providing a more immersive browsing experience. This mod replicates the functionality of the popular Firefox "Adaptive Tab Bar Color" extension for Zen Browser.

## Features

- 🎨 **Automatic Color Extraction**: Extracts colors from favicons, theme-color meta tags, and page content
- 🌈 **Smooth Transitions**: Beautiful color transitions with configurable duration
- ⚡ **Performance Optimized**: Color caching and debounced updates for optimal performance
- 🔧 **Highly Configurable**: Multiple extraction methods and customization options
- 🎯 **Selective Application**: Choose which UI elements receive adaptive colors

## How It Works

The mod analyzes the currently active tab and extracts dominant colors from:
1. **Favicon**: Primary method for most websites
2. **Theme Color Meta Tag**: For modern web apps with theme-color support
3. **Page Content**: Fallback method using computed styles

The extracted colors are then applied to various browser elements including:
- Tab bar background
- Navigation bar
- URL bar
- Toolbar buttons
- Sidebar (optional)

## Installation

### Via Sine (Recommended)

```bash
sine install adaptive-tab-bar-color-zen
```

### Manual Installation

1. Download or clone this repository
2. Copy the files to your Zen Browser chrome folder:
   - `chrome.css` → `chrome/`
   - `adaptive-tab-color.uc.js` → `chrome/`
   - `preferences.json` → `chrome/`

## Configuration

The mod includes several configurable options in `preferences.json`:

### Basic Settings

- **Enable/Disable**: Toggle the mod on/off
- **Color Intensity**: Adjust the opacity of adaptive colors (0.1 - 1.0)
- **Transition Duration**: Set animation speed (0 - 2000ms)

### Advanced Settings

- **Extraction Method**: Choose how colors are extracted
  - `auto`: Favicon + theme color (recommended)
  - `favicon`: Favicon only
  - `theme`: Theme color only
  - `content`: Page content analysis

- **Apply To Elements**: Select which UI elements use adaptive colors
  - Tab Bar
  - Navigation Bar
  - URL Bar
  - Sidebar
  - Toolbar Buttons

- **Performance Options**:
  - Color caching for faster repeated visits
  - Debug mode for troubleshooting

## Browser Compatibility

- **Zen Browser**: v1.0.0+
- **Firefox Base**: v120.0+

## Development

### File Structure

```
adaptive-tab-bar-color-zen/
├── chrome.css              # Main CSS styling
├── adaptive-tab-color.uc.js # Color extraction logic
├── preferences.json        # Configuration options
├── README.md              # Documentation
└── LICENSE                # MIT License
```

### Key Components

- **Color Extraction Engine**: Analyzes favicons and page content
- **CSS Variable System**: Dynamic color application via custom properties
- **Event Listeners**: Tab change and page load detection
- **Performance Optimization**: Debouncing and caching mechanisms

### Debugging

Enable debug mode in preferences to see detailed logging:

```javascript
// In browser console
window.adaptiveTabBarColor.toggle(); // Toggle on/off
window.adaptiveTabBarColor.currentColors; // View current colors
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Inspired by the Firefox "Adaptive Tab Bar Color" extension. Adapted for Zen Browser with enhanced features and performance optimizations.

## Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join the Zen Browser community
- **Updates**: Star the repository for updates

---

**Note**: This mod modifies browser appearance and may conflict with other theme modifications. Disable other tab color mods before installation. 