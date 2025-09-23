// Background service worker for OverlapAlert extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('OverlapAlert extension installed');
  
  // Initialize default storage
  chrome.storage.local.get(['userSubscriptions', 'settings'], (result) => {
    if (!result.userSubscriptions) {
      chrome.storage.local.set({ userSubscriptions: [] });
    }
    if (!result.settings) {
      chrome.storage.local.set({ 
        settings: {
          enabled: true,
          showWarnings: true,
          trackUsage: true,
          warningDuration: 30000 // 30 seconds
        }
      });
    }
  });
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a subscription page
    const subscriptionPatterns = [
      '/pricing', '/subscribe', '/signup', '/plans', 
      '/billing', '/checkout', '/upgrade', '/pro', 
      '/premium', '/subscription', '/payment', '/buy'
    ];
    
    const isSubscriptionPage = subscriptionPatterns.some(pattern => 
      tab.url.toLowerCase().includes(pattern)
    );
    
    if (isSubscriptionPage) {
      // The subscription database is already loaded as a content script
      console.log('Subscription page detected, content script will handle overlap detection');
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getUserSubscriptions':
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        sendResponse({ subscriptions: result.userSubscriptions || [] });
      });
      return true; // Keep message channel open for async response
      
    case 'updateSubscriptionUsage':
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        const userSubscriptions = result.userSubscriptions || [];
        const { serviceName, category } = request;
        
        let subscription = userSubscriptions.find(sub => 
          sub.serviceName === serviceName && sub.category === category
        );
        
        if (!subscription) {
          subscription = {
            serviceName,
            category,
            usageCount: 0,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString()
          };
          userSubscriptions.push(subscription);
        }
        
        subscription.usageCount = (subscription.usageCount || 0) + 1;
        subscription.lastUsed = new Date().toISOString();
        
        chrome.storage.local.set({ userSubscriptions }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
      
    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse({ settings: result.settings || {} });
      });
      return true;
      
    case 'updateSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'clearData':
      chrome.storage.local.clear(() => {
        sendResponse({ success: true });
      });
      return true;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, but we can also add additional logic here if needed
  console.log('OverlapAlert popup opened');
});

// Periodic cleanup of old data (run once per day)
chrome.alarms.create('dailyCleanup', { 
  delayInMinutes: 1, 
  periodInMinutes: 24 * 60 // 24 hours
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyCleanup') {
    // Clean up old usage data (keep last 90 days)
    chrome.storage.local.get(['userSubscriptions'], (result) => {
      const userSubscriptions = result.userSubscriptions || [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const filteredSubscriptions = userSubscriptions.filter(sub => {
        const lastUsed = new Date(sub.lastUsed);
        return lastUsed > cutoffDate;
      });
      
      if (filteredSubscriptions.length !== userSubscriptions.length) {
        chrome.storage.local.set({ userSubscriptions: filteredSubscriptions });
        console.log('Cleaned up old subscription data');
      }
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('OverlapAlert extension started');
});
