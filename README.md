# OverlapAlertExtension - Smart Subscription Monitoring

A Chrome extension that intelligently detects and warns users about potential subscription service overlaps when visiting pricing pages.

## 🚀 Features

- **Smart Detection**: Automatically detects subscription services when you visit their websites
- **Overlap Warnings**: Warns you when you're about to subscribe to a service you already have
- **Subscription Management**: Add, remove, and track your subscriptions
- **Usage Analytics**: Track how often you use each service
- **Auto-Add Detection**: Automatically adds services when you visit their pages (if you're already subscribed)

## 🎨 Design

- **Black & Yellow Theme**: Professional interface with golden lightning bolt on dark background
- **Lightning Bolt Logo**: ⚡ Represents fast detection and alerts
- **Clean UI**: Professional, minimalist design with high contrast
- **Responsive**: Works on all screen sizes

## 📁 Project Structure

```
OverlapAlert1/
├── manifest.json              # Extension configuration
├── background.js              # Background service worker
├── content.js                 # Main content script
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup functionality
├── styles.css                 # Styling and theme
├── subscription-database.js   # Service database and utilities
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                  # This file
```

## 🛠️ Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

## 🎯 How It Works

### Popup Behavior
- **First Visit**: Shows popup when you visit any page of a service domain
- **Pricing Pages**: Shows additional popup when you visit pricing/subscription pages
- **Session Tracking**: Maximum 2 popups per domain per session

### Smart Detection
- **Domain Detection**: Recognizes services by their domain names
- **Content Analysis**: Analyzes page content to determine if you're already subscribed
- **Auto-Add Logic**: Only auto-adds services when page indicates existing subscription

### Subscription Management
- **Manual Addition**: Add subscriptions through the popup interface
- **Auto-Detection**: Automatically detects when you visit services you're subscribed to
- **Usage Tracking**: Counts how many times you visit each service
- **Overlap Detection**: Warns about potential duplicate subscriptions

## 🔧 Configuration

### Adding Services to Database
Edit `subscription-database.js` to add new services:

```javascript
"Service Name": {
  "domains": ["example.com", "www.example.com"],
  "features": ["Feature 1", "Feature 2"],
  "pricing": "From $X/month"
}
```

### Customizing Detection
- **URL Patterns**: Modify `SUBSCRIPTION_URL_PATTERNS` for pricing page detection
- **Session Behavior**: Adjust popup logic in `content.js`
- **Styling**: Customize theme in `styles.css`

## 💰 Pricing & Features

### Free Tier (Always Free)
- ✅ Basic overlap detection
- ✅ Manual subscription management
- ✅ Up to 5 active subscriptions
- ✅ Basic usage tracking
- ✅ Essential overlap warnings

### Premium Tier ($4.99/month or $49.99/year)
- ✅ Unlimited subscriptions
- ✅ Advanced analytics & insights
- ✅ Cloud sync across devices
- ✅ Export/import subscription data
- ✅ Price comparison tools
- ✅ Renewal reminders
- ✅ Bulk subscription management
- ✅ Priority customer support

### 14-Day Free Trial
- Try all premium features for 14 days
- No credit card required to start
- Easy cancellation anytime
- Upgrade or downgrade anytime

## 🎨 Customization

### Theme Colors
- **Primary Gold**: `#FFD700` (Lightning bolt color)
- **Secondary Gold**: `#FFA500` (Accent gradients)
- **Background Black**: `#1a1a1a` (Header background)
- **Secondary Black**: `#333333` (Gradients)

### Logo Design
- **Lightning Bolt**: ⚡ Fast detection symbol in golden yellow
- **Dark Circle**: Professional black background
- **High Contrast**: Excellent visibility in toolbar
- **Animated Border**: Pulsing golden effect in popup

## 🐛 Troubleshooting

### Common Issues
1. **Extension not loading**: Check manifest.json for syntax errors
2. **Popups not showing**: Verify content script permissions
3. **Auto-add not working**: Check console for JavaScript errors
4. **Styling issues**: Ensure styles.css is properly linked

### Debug Mode
Open Chrome DevTools (F12) and check the console for debug messages:
- `Smart detection - Checking page: [URL]`
- `Is pricing page: true/false`
- `Auto-add check: [details]`

## 📝 Development

### File Overview
- **manifest.json**: Extension metadata and permissions
- **background.js**: Service worker for extension lifecycle
- **content.js**: Main detection and popup logic
- **popup.js**: User interface interactions
- **subscription-database.js**: Service definitions and utilities

### Key Functions
- `checkSubscriptionPage()`: Main detection function
- `handleDomainServiceDetection()`: Domain-based detection
- `checkIfAlreadySubscribed()`: Content analysis
- `autoAddSubscription()`: Smart subscription addition

## 🔮 Future Enhancements

- [ ] Export/import subscription data
- [ ] Cloud sync across devices
- [ ] More detailed analytics
- [ ] Price comparison features
- [ ] Subscription renewal reminders
- [ ] Browser history analysis

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve OverlapAlert!

---

**OverlapAlertExtension** - Never pay for duplicate subscriptions again! ⚡