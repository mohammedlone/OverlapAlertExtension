// Background service worker for OverlapAlert extension
chrome.runtime.onInstalled.addListener((details) => {
  try {
    console.log('OverlapAlert extension installed');
    
    // Check if Chrome storage API is available
    if (!chrome.storage || !chrome.storage.local) {
      console.error('Chrome storage API not available');
      return;
    }
    
    // Initialize default storage with error handling
    chrome.storage.local.get(['userSubscriptions', 'settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error accessing storage:', chrome.runtime.lastError);
        return;
      }
      
      try {
        if (!result.userSubscriptions) {
          chrome.storage.local.set({ userSubscriptions: [] }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error setting userSubscriptions:', chrome.runtime.lastError);
            }
          });
        }
        if (!result.settings) {
          chrome.storage.local.set({ 
            settings: {
              enabled: true,
              showWarnings: true,
              trackUsage: true,
              warningDuration: 30000, // 30 seconds
              userTier: 'free', // Default to free tier
              trialEndDate: null,
              subscriptionStatus: 'active'
            }
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error setting settings:', chrome.runtime.lastError);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing default storage:', error);
      }
    });
  } catch (error) {
    console.error('Error in onInstalled listener:', error);
  }
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
  try {
    // Validate request object
    if (!request || !request.action) {
      sendResponse({ error: 'Invalid request format' });
      return;
    }
    
    // Check if Chrome storage API is available
    if (!chrome.storage || !chrome.storage.local) {
      sendResponse({ error: 'Storage API not available' });
      return;
    }
    
    switch (request.action) {
      case 'getUserSubscriptions':
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          try {
            if (chrome.runtime.lastError) {
              console.error('Error getting user subscriptions:', chrome.runtime.lastError);
              sendResponse({ error: 'Failed to retrieve subscriptions' });
              return;
            }
            sendResponse({ subscriptions: result.userSubscriptions || [] });
          } catch (error) {
            console.error('Error processing getUserSubscriptions:', error);
            sendResponse({ error: 'Failed to process subscriptions' });
          }
        });
        return true; // Keep message channel open for async response
      
      case 'updateSubscriptionUsage':
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          try {
            if (chrome.runtime.lastError) {
              console.error('Error getting subscriptions for usage update:', chrome.runtime.lastError);
              sendResponse({ error: 'Failed to retrieve subscriptions' });
              return;
            }
            
            // Validate request data
            if (!request.serviceName || !request.category) {
              sendResponse({ error: 'Missing required fields: serviceName and category' });
              return;
            }
            
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
              if (chrome.runtime.lastError) {
                console.error('Error updating subscription usage:', chrome.runtime.lastError);
                sendResponse({ error: 'Failed to update subscription usage' });
                return;
              }
              sendResponse({ success: true });
            });
          } catch (error) {
            console.error('Error processing updateSubscriptionUsage:', error);
            sendResponse({ error: 'Failed to process usage update' });
          }
        });
        return true;
      
      case 'getSettings':
        chrome.storage.local.get(['settings'], (result) => {
          try {
            if (chrome.runtime.lastError) {
              console.error('Error getting settings:', chrome.runtime.lastError);
              sendResponse({ error: 'Failed to retrieve settings' });
              return;
            }
            sendResponse({ settings: result.settings || {} });
          } catch (error) {
            console.error('Error processing getSettings:', error);
            sendResponse({ error: 'Failed to process settings request' });
          }
        });
        return true;
        
      case 'updateSettings':
        // Validate settings object
        if (!request.settings || typeof request.settings !== 'object') {
          sendResponse({ error: 'Invalid settings format' });
          return;
        }
        
        chrome.storage.local.set({ settings: request.settings }, () => {
          try {
            if (chrome.runtime.lastError) {
              console.error('Error updating settings:', chrome.runtime.lastError);
              sendResponse({ error: 'Failed to update settings' });
              return;
            }
            sendResponse({ success: true });
          } catch (error) {
            console.error('Error processing updateSettings:', error);
            sendResponse({ error: 'Failed to process settings update' });
          }
        });
        return true;
        
              case 'clearData':
                chrome.storage.local.clear(() => {
                  try {
                    if (chrome.runtime.lastError) {
                      console.error('Error clearing data:', chrome.runtime.lastError);
                      sendResponse({ error: 'Failed to clear data' });
                      return;
                    }
                    sendResponse({ success: true });
                  } catch (error) {
                    console.error('Error processing clearData:', error);
                    sendResponse({ error: 'Failed to process data clearing' });
                  }
                });
                return true;
                
              case 'storeDetectedSubscription':
                // Validate subscription data
                if (!request.subscriptionData || !request.subscriptionData.serviceName) {
                  sendResponse({ error: 'Invalid subscription data format' });
                  return;
                }
                
                chrome.storage.local.get(['userSubscriptions'], (result) => {
                  try {
                    if (chrome.runtime.lastError) {
                      console.error('Error getting subscriptions for detected data:', chrome.runtime.lastError);
                      sendResponse({ error: 'Failed to retrieve subscriptions' });
                      return;
                    }
                    
                    const userSubscriptions = result.userSubscriptions || [];
                    const detectedData = request.subscriptionData;
                    
                    // Check if subscription already exists
                    const existingIndex = userSubscriptions.findIndex(sub => 
                      sub.serviceName === detectedData.serviceName && sub.category === detectedData.category
                    );
                    
                    if (existingIndex >= 0) {
                      // Update existing subscription with detected data
                      const existing = userSubscriptions[existingIndex];
                      userSubscriptions[existingIndex] = {
                        ...existing,
                        monthlyCost: detectedData.monthlyCost || existing.monthlyCost,
                        planType: detectedData.planType || existing.planType,
                        billingPeriod: detectedData.billingPeriod || existing.billingPeriod,
                        detectedFrom: detectedData.detectedFrom,
                        lastDetected: detectedData.lastDetected,
                        autoDetected: true
                      };
                      console.log('Updated existing subscription with detected data:', detectedData.serviceName);
                    } else {
                      // Add new subscription
                      const newSubscription = {
                        serviceName: detectedData.serviceName,
                        category: detectedData.category || 'Other',
                        monthlyCost: detectedData.monthlyCost || '0.00',
                        planType: detectedData.planType || 'Standard',
                        billingPeriod: detectedData.billingPeriod || 'monthly',
                        notes: `Auto-detected from ${detectedData.detectedFrom}`,
                        firstUsed: new Date().toISOString(),
                        lastUsed: new Date().toISOString(),
                        usageCount: 0,
                        detectedFrom: detectedData.detectedFrom,
                        lastDetected: detectedData.lastDetected,
                        autoDetected: true
                      };
                      userSubscriptions.push(newSubscription);
                      console.log('Added new auto-detected subscription:', detectedData.serviceName);
                    }
                    
                    chrome.storage.local.set({ userSubscriptions }, () => {
                      if (chrome.runtime.lastError) {
                        console.error('Error storing detected subscription:', chrome.runtime.lastError);
                        sendResponse({ error: 'Failed to store detected subscription' });
                        return;
                      }
                      console.log('Successfully stored detected subscription data');
                      sendResponse({ success: true, count: userSubscriptions.length });
                    });
                  } catch (error) {
                    console.error('Error processing storeDetectedSubscription:', error);
                    sendResponse({ error: 'Failed to process subscription storage' });
                  }
                });
                return true;
        
      case 'openPopup':
        try {
          // Open the extension popup by clicking the action button
          chrome.action.openPopup();
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error opening popup:', error);
          sendResponse({ error: 'Failed to open popup' });
        }
        return true;
        
      default:
        console.warn('Unknown action requested:', request.action);
        sendResponse({ error: 'Unknown action: ' + request.action });
    }
  } catch (error) {
    console.error('Error in message listener:', error);
    sendResponse({ error: 'Internal server error' });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  try {
    // This will open the popup, but we can also add additional logic here if needed
    console.log('OverlapAlert popup opened');
  } catch (error) {
    console.error('Error in action click handler:', error);
  }
});

// Periodic cleanup of old data (run once per day)
chrome.alarms.create('dailyCleanup', { 
  delayInMinutes: 1, 
  periodInMinutes: 24 * 60 // 24 hours
});

chrome.alarms.onAlarm.addListener((alarm) => {
  try {
    if (alarm.name === 'dailyCleanup') {
      // Check if Chrome storage API is available
      if (!chrome.storage || !chrome.storage.local) {
        console.error('Storage API not available for cleanup');
        return;
      }
      
      // Clean up old usage data (keep last 90 days)
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        try {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions for cleanup:', chrome.runtime.lastError);
            return;
          }
          
          const userSubscriptions = result.userSubscriptions || [];
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 90);
          
          const filteredSubscriptions = userSubscriptions.filter(sub => {
            try {
              const lastUsed = new Date(sub.lastUsed);
              return lastUsed > cutoffDate;
            } catch (error) {
              console.warn('Invalid date in subscription data:', sub.lastUsed);
              return false; // Remove subscriptions with invalid dates
            }
          });
          
          if (filteredSubscriptions.length !== userSubscriptions.length) {
            chrome.storage.local.set({ userSubscriptions: filteredSubscriptions }, () => {
              if (chrome.runtime.lastError) {
                console.error('Error saving cleaned subscription data:', chrome.runtime.lastError);
                return;
              }
              console.log('Cleaned up old subscription data');
            });
          }
        } catch (error) {
          console.error('Error during cleanup process:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error in alarm listener:', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  try {
    console.log('OverlapAlert extension started');
  } catch (error) {
    console.error('Error in startup listener:', error);
  }
});
