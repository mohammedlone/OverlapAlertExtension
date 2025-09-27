# Security Guidelines for OVERLAPALERT1

## Never Do These Things ❌

### 1. Don't Use localStorage for Sensitive Data
**Wrong:**
```javascript
localStorage.setItem('apiKey', 'secret123'); // BAD!
localStorage.setItem('licenseKey', 'abc-123'); // BAD!
await chrome.storage.local.set({ apiKey: 'secret123' }); // GOOD!
await chrome.storage.local.set({ licenseKey: 'abc-123' }); // GOOD!
const API_KEY = 'sk_live_abc123xyz'; // BAD!
fetch('https://api.stripe.com', {
  headers: { 'Authorization': 'Bearer sk_live_abc123xyz' } // BAD!
});
// Use environment variables or server-side
const response = await fetch('https://YOUR-SERVER.com/api/validate');
fetch('https://myapi.com/data'); // GOOD!
element.innerHTML = userInput; // BAD! Can be hacked
element.textContent = userInput; // GOOD! Safe
// Save data
await chrome.storage.local.set({ 
  userSettings: { theme: 'dark' } 
});

// Get data
const result = await chrome.storage.local.get(['userSettings']);
console.log(result.userSettings);
try {
  const response = await fetch('https://api.example.com');
  const data = await response.json();
  // Use data
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Show user-friendly message
}
// Checking license in extension code - can be hacked!
if (licenseKey === 'valid-key-123') { // BAD!
  enableFeature();
}
// Check with your server
const response = await fetch('https://your-server.com/validate', {
  method: 'POST',
  body: JSON.stringify({ licenseKey })
});
const result = await response.json();
if (result.valid) {
  enableFeature();
}
if (chrome.storage) {
  // Safe to use
  await chrome.storage.local.set({ data: 'value' });
} else {
  console.error('chrome.storage not available');
}

Quick Security Checklist
Before committing code, check:

 No API keys or passwords in code
 Using chrome.storage (not localStorage)
 All fetch requests use HTTPS
 User inputs are sanitized
 Error handling is in place
 License validation is server-side
 7. **Save the file**

---

## Step 5: Update Your README.md

**What to do:**

1. **Click on `README.md`** in your file list to open it
2. **Add this text at the very top** (above whatever is already there):
```markdown
# OVERLAPALERT1 Chrome Extension

> **🤖 FOR AI ASSISTANTS (Cursor, Claude, etc.):**  
> This is a monetized Chrome extension. ALWAYS follow these rules:
> - Read `.cursorrules` file for all development rules
> - Check `/docs/guidelines.md` for full best practices
> - Check `/docs/security.md` for security rules
> - Ask if unclear - user is learning (skill level 3/10)
> - Explain code in simple terms

---

[Keep the rest of your README below this]