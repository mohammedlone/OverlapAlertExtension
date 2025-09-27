// Content script to monitor subscription pages and detect overlaps
(function() {
  'use strict';

  // Global error handler for extension context issues
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('Extension context invalidated')) {
      console.log('Caught extension context error, stopping execution');
      event.preventDefault();
      return false;
    }
  });

  // Import subscription database functions
  const { isSubscriptionPage, getServiceByDomain, findPotentialOverlaps } = window.subscriptionDatabase || {};

  // Import subscription detector
  const SubscriptionDetector = window.SubscriptionDetector;

  // Subscription detection function
  function detectAndStoreSubscriptionDetails() {
    try {
      console.log('🔍 Starting subscription detection...');
      
      const detector = new SubscriptionDetector();
      const detectedData = detector.detectSubscription(window.location.href, document);
      
      if (detectedData) {
        console.log('✅ Subscription detected:', detectedData);
        
        // Send detected data to background script for storage
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'storeDetectedSubscription',
            subscriptionData: detectedData
          }, (response) => {
            if (response && response.success) {
              console.log('✅ Subscription data stored successfully');
              // Show a subtle notification that data was detected
              showDetectionNotification(detectedData);
            } else {
              console.error('❌ Failed to store subscription data:', response?.error);
            }
          });
        }
      } else {
        console.log('❌ No subscription detected on this page');
      }
    } catch (error) {
      console.error('❌ Error in subscription detection:', error);
    }
  }

  // Show notification when subscription is detected
  function showDetectionNotification(detectedData) {
    try {
      // Create a subtle notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        border: 2px solid #1a1a1a;
      `;
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 16px;">⚡</span>
          <strong>Subscription Detected!</strong>
        </div>
        <div style="font-size: 13px;">
          ${detectedData.serviceName} - ${detectedData.planType} Plan
          ${detectedData.monthlyCost ? `($${detectedData.monthlyCost}/month)` : ''}
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 4000);
      
    } catch (error) {
      console.error('Error showing detection notification:', error);
    }
  }

  // Smart detection system with session-based popup management
  function checkSubscriptionPage() {
    try {
      const currentUrl = window.location.href;
      
      // First, try to detect subscription details from the current page
      if (SubscriptionDetector) {
        detectAndStoreSubscriptionDetails();
      }
      const currentDomain = window.location.hostname;
      
      console.log('Smart detection - Checking page:', currentUrl);
      
      // Check if extension context is still valid before proceeding
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context invalidated, skipping detection');
        return;
      }
    
    // Get user's existing subscriptions from storage with error handling
    try {
      chrome.storage.local.get(['userSubscriptions', 'settings'], (result) => {
        // Check if extension context is still valid
        if (chrome.runtime.lastError) {
          console.log('Extension context invalidated, skipping detection');
          return;
        }
        
        const userSubscriptions = result.userSubscriptions || [];
        const settings = result.settings || {};
        
        console.log('User subscriptions:', userSubscriptions);
      
      // 1. Check domain-based detection (primary method)
      const domainService = getServiceByDomain(currentDomain);
      if (domainService) {
        console.log('Domain-based service found:', domainService);
        handleDomainServiceDetection(domainService, userSubscriptions, settings);
      }
      
        // 2. Monitor for subscribe buttons and forms (secondary, contextual)
        monitorSubscriptionActions();
      });
    } catch (error) {
      console.log('Error accessing Chrome storage:', error);
    }
    } catch (error) {
      console.log('Extension context error in checkSubscriptionPage:', error);
    }
  }

  // Normalize domain for session tracking (handle subdomains)
  function normalizeDomainForSession(hostname, serviceDomains) {
    // Find the main domain from the service's domain list
    const mainDomain = serviceDomains.find(domain => {
      // Check if current hostname matches or is a subdomain
      return hostname === domain || hostname.endsWith('.' + domain);
    });
    
    // Return the main domain or the hostname if no match found
    return mainDomain || hostname;
  }

  // Check if this is a main domain page (any page that's not a pricing page)
  function isMainDomainPage(url, domain) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // Check if this is a pricing page
      const isPricingPage = isSubscriptionPage(url);
      
      // Show domain popup on any page that's NOT a pricing page
      const isMainPage = !isPricingPage;
      
      console.log('Checking if main page:', {
        url: url,
        pathname: pathname,
        isPricingPage: isPricingPage,
        isMainPage: isMainPage
      });
      
      return isMainPage;
    } catch (error) {
      console.log('Error checking main page:', error);
      return true; // Default to showing popup if we can't determine
    }
  }

  // Handle domain-based service detection with session tracking
  function handleDomainServiceDetection(domainService, userSubscriptions, settings) {
    const currentUrl = window.location.href;
    const currentDomain = window.location.hostname;
    const isPricingPage = isSubscriptionPage(currentUrl);
    
    console.log('=== DOMAIN DETECTION DEBUG ===');
    console.log('Domain service:', domainService);
    console.log('Current URL:', currentUrl);
    console.log('Current domain:', currentDomain);
    console.log('Is pricing page:', isPricingPage);
    console.log('User subscriptions:', userSubscriptions);
    
    // Check if user already has this service
    const existingSubscription = userSubscriptions.find(sub => 
      sub.serviceName === domainService.serviceName && sub.category === domainService.category
    );
    
    console.log('Existing subscription found:', existingSubscription);
    
    if (existingSubscription) {
      console.log('User already has this subscription:', existingSubscription);
      console.log('=== USER HAS SUBSCRIPTION - NO AUTO-ADD SHOULD HAPPEN ===');
      
      // Normalize domain for session tracking (handle subdomains)
      const normalizedDomain = normalizeDomainForSession(currentDomain, domainService.domains);
      console.log('Normalized domain for session:', normalizedDomain);
      
      // Check session-based popup tracking using normalized domain
      const sessionKey = `session_${domainService.serviceName}_${normalizedDomain}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      const sessionInfo = sessionData ? JSON.parse(sessionData) : { 
        domainShown: false, 
        pricingShown: false 
      };
      
      console.log('Session info:', sessionInfo);
      
      let shouldShowPopup = false;
      let popupType = '';
      
      if (isPricingPage && !sessionInfo.pricingShown) {
        // Show pricing page warning
        shouldShowPopup = true;
        popupType = 'pricing';
        sessionInfo.pricingShown = true;
        console.log('Should show pricing popup');
      } else if (!isPricingPage && !sessionInfo.domainShown) {
        // Show domain visit warning (first time on domain - only on home page or main pages)
        const isMainPage = isMainDomainPage(currentUrl, normalizedDomain);
        if (isMainPage) {
          shouldShowPopup = true;
          popupType = 'domain';
          sessionInfo.domainShown = true;
          console.log('Should show domain popup (main page)');
        } else {
          console.log('Not showing domain popup - not a main page');
        }
      }
      
      if (shouldShowPopup) {
        // Update session storage
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionInfo));
        console.log('=== POPUP DECISION ===');
        console.log('Showing popup:', popupType);
        console.log('Service:', domainService.serviceName);
        console.log('URL:', currentUrl);
        console.log('Existing subscription:', existingSubscription);
        
        if (popupType === 'pricing') {
          console.log('Calling showSubscriptionReminder with type: pricing');
          showSubscriptionReminder(existingSubscription, domainService, 'pricing');
        } else {
          console.log('Calling showSubscriptionReminder with type: domain');
          showSubscriptionReminder(existingSubscription, domainService, 'domain');
        }
      } else {
        console.log('Not showing popup - already shown in this session');
        console.log('Session info:', sessionInfo);
      }
      
      // Update usage tracking
      trackSubscriptionUsage(domainService.serviceName, domainService.category);
      
    } else {
      // User doesn't have this service yet
      console.log('User does not have this subscription');
      
      if (isPricingPage) {
        // Check if warnings are enabled
        if (settings.showWarnings === false) {
          console.log('Warnings disabled');
          return;
        }
        
        // Find potential overlaps with other services in same category
        const overlaps = findPotentialOverlaps(domainService, userSubscriptions);
        console.log('Found overlaps:', overlaps);
        
        if (overlaps.length > 0) {
          showOverlapWarning(overlaps[0], domainService);
        }
      }
      
      // Only auto-add if user doesn't have subscription AND page indicates they're already subscribed
      console.log('Auto-add check:', {
        url: currentUrl,
        isPricingPage: isPricingPage,
        serviceName: domainService.serviceName,
        userHasSubscription: false
      });
      
      // Check if page indicates user is already subscribed
      const isAlreadySubscribed = checkIfAlreadySubscribed(domainService);
      
      if (isAlreadySubscribed) {
        console.log('Auto-adding subscription - page indicates user is already subscribed');
        autoAddSubscription(domainService);
      } else {
        console.log('NOT auto-adding - page does not indicate existing subscription');
      }
    }
  }

  // Check if page content indicates user is already subscribed
  function checkIfAlreadySubscribed(domainService) {
    try {
      const pageText = document.body.innerText.toLowerCase();
      const serviceName = domainService.serviceName.toLowerCase();
      
      // Keywords that indicate user is already subscribed
      const subscriptionIndicators = [
        'you are subscribed',
        'your subscription',
        'current plan',
        'active subscription',
        'manage subscription',
        'billing information',
        'account settings',
        'subscription details',
        'your account',
        'dashboard',
        'my account',
        'profile',
        'settings',
        'billing',
        'payment method',
        'next billing date',
        'subscription expires',
        'renewal date'
      ];
      
      // Service-specific indicators
      const serviceSpecificIndicators = {
        'disney+': ['watch now', 'start watching', 'continue watching', 'your disney+'],
        'netflix': ['watch now', 'continue watching', 'your netflix'],
        'spotify': ['listen now', 'your music', 'your spotify'],
        'chatgpt': ['start chatting', 'your conversations', 'chat history'],
        'claude': ['start a new conversation', 'conversation history']
      };
      
      // Check for general subscription indicators
      const hasSubscriptionIndicators = subscriptionIndicators.some(indicator => 
        pageText.includes(indicator)
      );
      
      // Check for service-specific indicators
      const serviceIndicators = serviceSpecificIndicators[serviceName] || [];
      const hasServiceIndicators = serviceIndicators.some(indicator => 
        pageText.includes(indicator)
      );
      
      // Check for "subscribe" or "sign up" buttons (indicates NOT subscribed)
      const hasSubscribeButtons = pageText.includes('subscribe now') || 
                                 pageText.includes('sign up') ||
                                 pageText.includes('start free trial') ||
                                 pageText.includes('get started');
      
      console.log('Subscription check:', {
        serviceName: serviceName,
        hasSubscriptionIndicators: hasSubscriptionIndicators,
        hasServiceIndicators: hasServiceIndicators,
        hasSubscribeButtons: hasSubscribeButtons,
        result: (hasSubscriptionIndicators || hasServiceIndicators) && !hasSubscribeButtons
      });
      
      // User is likely subscribed if:
      // 1. Page has subscription indicators AND
      // 2. Page does NOT have subscribe/sign up buttons
      return (hasSubscriptionIndicators || hasServiceIndicators) && !hasSubscribeButtons;
      
    } catch (error) {
      console.log('Error checking subscription status:', error);
      return false; // Default to not subscribed if we can't determine
    }
  }

  // Generate keywords for a service (for subscribe button context analysis)
  function generateServiceKeywords(service) {
    const keywords = [];
    const serviceName = service.serviceName.toLowerCase();
    
    // Service-specific keywords for contextual analysis
    switch (serviceName) {
      case 'chatgpt':
        keywords.push('openai', 'gpt', 'chat gpt', 'ai assistant', 'ai writing tool');
        break;
      case 'claude':
        keywords.push('anthropic', 'ai assistant', 'ai writing tool');
        break;
      case 'netflix':
        keywords.push('streaming', 'movies', 'tv shows', 'entertainment');
        break;
      case 'spotify':
        keywords.push('music streaming', 'podcasts', 'audio');
        break;
      case 'disney+':
        keywords.push('disney plus', 'disney+', 'marvel', 'star wars');
        break;
      case 'figma':
        keywords.push('design tool', 'ui design', 'prototyping');
        break;
      case 'canva':
        keywords.push('graphic design', 'templates', 'social media');
        break;
      case 'notion':
        keywords.push('notes', 'productivity', 'workspace');
        break;
      case 'slack':
        keywords.push('team chat', 'workplace communication');
        break;
      case 'zoom':
        keywords.push('video conferencing', 'meetings');
        break;
    }
    
    return keywords;
  }

  // Monitor subscription actions (buttons, forms)
  function monitorSubscriptionActions() {
    // Watch for subscribe/signup buttons - use valid CSS selectors
    const subscribeSelectors = [
      '[class*="subscribe"]',
      '[class*="signup"]',
      '[id*="subscribe"]',
      '[id*="signup"]',
      '[class*="upgrade"]',
      '[id*="upgrade"]',
      '[class*="pricing"]',
      '[id*="pricing"]'
    ];
    
    // Also look for buttons with specific text content
    const allButtons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    const textBasedButtons = Array.from(allButtons).filter(button => {
      const text = button.textContent.toLowerCase();
      return text.includes('subscribe') || 
             text.includes('sign up') || 
             text.includes('get started') || 
             text.includes('start free trial') || 
             text.includes('upgrade') || 
             text.includes('buy now');
    });
    
    // Add click listeners to CSS-based selectors
    subscribeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener('click', (e) => {
          console.log('Subscribe button clicked:', element);
          analyzeSubscriptionContext(element);
        });
      });
    });
    
    // Add click listeners to text-based buttons
    textBasedButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        console.log('Text-based subscribe button clicked:', button);
        analyzeSubscriptionContext(button);
      });
    });
    
    // Watch for new elements added dynamically
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check CSS-based selectors
            subscribeSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                node.addEventListener('click', (e) => {
                  console.log('Dynamic subscribe button clicked:', node);
                  analyzeSubscriptionContext(node);
                });
              }
            });
            
            // Check text-based buttons
            if (node.tagName && ['BUTTON', 'A', 'INPUT'].includes(node.tagName)) {
              const text = node.textContent.toLowerCase();
              if (text.includes('subscribe') || 
                  text.includes('sign up') || 
                  text.includes('get started') || 
                  text.includes('start free trial') || 
                  text.includes('upgrade') || 
                  text.includes('buy now')) {
                node.addEventListener('click', (e) => {
                  console.log('Dynamic text-based button clicked:', node);
                  analyzeSubscriptionContext(node);
                });
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Analyze context around subscription actions
  function analyzeSubscriptionContext(element) {
    const context = element.closest('div, section, article, form') || element.parentElement;
    const contextText = context ? context.innerText.toLowerCase() : '';
    
    console.log('Subscription context:', contextText);
    
    // Get user subscriptions
    chrome.storage.local.get(['userSubscriptions', 'settings'], (result) => {
      const userSubscriptions = result.userSubscriptions || [];
      const settings = result.settings || {};
      
      // Check if any user subscriptions are mentioned in context
      userSubscriptions.forEach(subscription => {
        const serviceName = subscription.serviceName.toLowerCase();
        const serviceKeywords = generateServiceKeywords(subscription);
        
        let isMentioned = false;
        serviceKeywords.forEach(keyword => {
          if (contextText.includes(keyword.toLowerCase())) {
            isMentioned = true;
          }
        });
        
        if (isMentioned || contextText.includes(serviceName)) {
          console.log('Found existing subscription in context:', subscription);
          showContextualWarning(subscription, contextText);
        }
      });
    });
  }

  // Show contextual warning for existing subscriptions
  function showContextualWarning(existingSubscription, context) {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'contextual-subscription-warning';
    warningDiv.innerHTML = `
      <div class="contextual-warning-container">
        <div class="contextual-warning-header">
          <div class="contextual-warning-icon">⚠️</div>
          <div class="contextual-warning-title">You Already Have This!</div>
          <button class="contextual-warning-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="contextual-warning-content">
          <div class="contextual-warning-message">
            You already have <strong>${existingSubscription.serviceName}</strong> subscription
          </div>
          <div class="contextual-warning-details">
            Category: ${existingSubscription.category}<br>
            Usage: ${existingSubscription.usageCount || 0} times tracked<br>
            ${existingSubscription.monthlyCost ? `Cost: $${existingSubscription.monthlyCost}/month<br>` : ''}
          </div>
          <div class="contextual-warning-actions">
            <button class="contextual-warning-btn" onclick="this.closest('#contextual-subscription-warning').remove()">
              Got it!
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #contextual-subscription-warning {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-radius: 12px;
        background: white;
        border: 2px solid #ff6b6b;
        animation: slideIn 0.3s ease-out;
      }
      
      .contextual-warning-container {
        padding: 0;
      }
      
      .contextual-warning-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        border-radius: 10px 10px 0 0;
      }
      
      .contextual-warning-icon {
        font-size: 18px;
        margin-right: 10px;
      }
      
      .contextual-warning-title {
        font-weight: 600;
        font-size: 14px;
        flex: 1;
      }
      
      .contextual-warning-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .contextual-warning-content {
        padding: 16px;
      }
      
      .contextual-warning-message {
        font-size: 14px;
        margin-bottom: 10px;
        color: #2c3e50;
      }
      
      .contextual-warning-details {
        font-size: 12px;
        color: #7f8c8d;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      
      .contextual-warning-btn {
        width: 100%;
        padding: 8px 16px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(warningDiv);
    
    // Popup will only close when user clicks the close button
  }


  // Show overlap warning popup
  function showOverlapWarning(overlap, currentService) {
    // Remove any existing warning
    const existingWarning = document.getElementById('overlap-alert-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create warning popup
    const warningDiv = document.createElement('div');
    warningDiv.id = 'overlap-alert-warning';
    warningDiv.innerHTML = `
      <div class="overlap-alert-container">
        <div class="overlap-alert-header">
          <div class="overlap-alert-icon">⚠️</div>
          <div class="overlap-alert-title">Subscription Overlap Detected</div>
          <button class="overlap-alert-close" data-action="close">×</button>
        </div>
        <div class="overlap-alert-content">
          <div class="overlap-alert-message">
            You already have <strong>${overlap.existingService}</strong> for <strong>${overlap.category}</strong>
          </div>
          <div class="overlap-alert-usage">
            You've used it <strong>${overlap.existingUsage} times</strong> this month
          </div>
          <div class="overlap-alert-comparison">
            <div class="overlap-alert-section">
              <h4>What's different about ${overlap.newService}?</h4>
              <ul class="overlap-alert-features">
                ${overlap.newFeatures.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
            <div class="overlap-alert-section">
              <h4>Your current ${overlap.existingService} includes:</h4>
              <ul class="overlap-alert-features">
                ${overlap.existingFeatures.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="overlap-alert-actions">
            <button class="overlap-alert-btn overlap-alert-btn-primary" onclick="window.open('${window.location.href}', '_blank')">
              Continue to ${overlap.newService}
            </button>
            <button class="overlap-alert-btn overlap-alert-btn-secondary" onclick="this.closest('#overlap-alert-warning').remove()">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #overlap-alert-warning {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-radius: 12px;
        background: white;
        border: 1px solid #e1e5e9;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .overlap-alert-container {
        padding: 0;
      }

      .overlap-alert-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        border-radius: 12px 12px 0 0;
        position: relative;
      }

      .overlap-alert-icon {
        font-size: 20px;
        margin-right: 12px;
      }

      .overlap-alert-title {
        font-weight: 600;
        font-size: 16px;
        flex: 1;
      }

      .overlap-alert-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }

      .overlap-alert-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .overlap-alert-content {
        padding: 20px;
      }

      .overlap-alert-message {
        font-size: 16px;
        margin-bottom: 12px;
        color: #2c3e50;
        line-height: 1.4;
      }

      .overlap-alert-usage {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 20px;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #ff6b6b;
      }

      .overlap-alert-comparison {
        margin-bottom: 20px;
      }

      .overlap-alert-section {
        margin-bottom: 16px;
      }

      .overlap-alert-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #34495e;
        font-weight: 600;
      }

      .overlap-alert-features {
        margin: 0;
        padding-left: 16px;
        color: #5a6c7d;
      }

      .overlap-alert-features li {
        margin-bottom: 4px;
        font-size: 13px;
        line-height: 1.3;
      }

      .overlap-alert-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }

      .overlap-alert-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .overlap-alert-btn-primary {
        background: #3498db;
        color: white;
      }

      .overlap-alert-btn-primary:hover {
        background: #2980b9;
        transform: translateY(-1px);
      }

      .overlap-alert-btn-secondary {
        background: #ecf0f1;
        color: #7f8c8d;
      }

      .overlap-alert-btn-secondary:hover {
        background: #d5dbdb;
        transform: translateY(-1px);
      }
    `;

    // Add to page
    document.head.appendChild(style);
    document.body.appendChild(warningDiv);

    // Popup will only close when user clicks the dismiss button
  }

  // Show subscription reminder popup
  function showSubscriptionReminder(existingSubscription, currentService, popupType = 'domain') {
    console.log('=== SHOWING POPUP ===');
    console.log('Subscription:', existingSubscription);
    console.log('Service:', currentService);
    console.log('Popup type:', popupType);
    console.log('TIMESTAMP:', new Date().toISOString());
    
    // Remove any existing warning
    const existingWarning = document.getElementById('overlap-alert-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create reminder popup with different messages based on type
    const title = popupType === 'pricing' ? 'You Already Have This Subscription' : 'Subscription Reminder';
    const message = popupType === 'pricing' 
      ? `You already have <strong>${existingSubscription.serviceName}</strong> for <strong>${existingSubscription.category}</strong>`
      : `You're visiting <strong>${existingSubscription.serviceName}</strong> - you already have this subscription!`;
    
    const reminderDiv = document.createElement('div');
    reminderDiv.id = 'overlap-alert-warning';
    reminderDiv.innerHTML = `
      <div class="overlap-alert-container">
        <div class="overlap-alert-header">
          <div class="overlap-alert-icon">${popupType === 'pricing' ? 'ℹ️' : '💡'}</div>
          <div class="overlap-alert-title">${title}</div>
          <button class="overlap-alert-close" data-action="close">×</button>
        </div>
        <div class="overlap-alert-content">
          <div class="overlap-alert-message">
            ${message}
          </div>
          <div class="overlap-alert-usage">
            You've used it <strong>${existingSubscription.usageCount || 0} times</strong> since tracking started
            ${existingSubscription.monthlyCost ? `<br>Monthly cost: <strong>$${existingSubscription.monthlyCost}/month</strong>` : ''}
          </div>
          ${popupType === 'pricing' ? `
          <div class="overlap-alert-comparison">
            <div class="overlap-alert-section">
              <h4>Your current ${existingSubscription.serviceName} includes:</h4>
              <ul class="overlap-alert-features">
                ${currentService.features.slice(0, 4).map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
          </div>
          ` : ''}
          <div class="overlap-alert-actions">
            <button class="overlap-alert-btn overlap-alert-btn-primary" id="overlap-alert-got-it">
              Got it, thanks!
            </button>
            <button class="overlap-alert-btn overlap-alert-btn-secondary" id="overlap-alert-manage">
              Manage Subscriptions
            </button>
          </div>
        </div>
      </div>
    `;

    // Add styles (reuse existing styles)
    const style = document.createElement('style');
    style.textContent = `
      #overlap-alert-warning {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-radius: 12px;
        background: white;
        border: 1px solid #e1e5e9;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .overlap-alert-container {
        padding: 0;
      }

      .overlap-alert-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(135deg, #3498db, #5dade2);
        color: white;
        border-radius: 12px 12px 0 0;
        position: relative;
      }

      .overlap-alert-icon {
        font-size: 20px;
        margin-right: 12px;
      }

      .overlap-alert-title {
        font-weight: 600;
        font-size: 16px;
        flex: 1;
      }

      .overlap-alert-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }

      .overlap-alert-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .overlap-alert-content {
        padding: 20px;
      }

      .overlap-alert-message {
        font-size: 16px;
        margin-bottom: 12px;
        color: #2c3e50;
        line-height: 1.4;
      }

      .overlap-alert-usage {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 20px;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #3498db;
      }

      .overlap-alert-comparison {
        margin-bottom: 20px;
      }

      .overlap-alert-section {
        margin-bottom: 16px;
      }

      .overlap-alert-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #34495e;
        font-weight: 600;
      }

      .overlap-alert-features {
        margin: 0;
        padding-left: 16px;
        color: #5a6c7d;
      }

      .overlap-alert-features li {
        margin-bottom: 4px;
        font-size: 13px;
        line-height: 1.3;
      }

      .overlap-alert-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }

      .overlap-alert-btn {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .overlap-alert-btn-primary {
        background: #3498db;
        color: white;
      }

      .overlap-alert-btn-primary:hover {
        background: #2980b9;
        transform: translateY(-1px);
      }

      .overlap-alert-btn-secondary {
        background: #ecf0f1;
        color: #7f8c8d;
      }

      .overlap-alert-btn-secondary:hover {
        background: #d5dbdb;
        transform: translateY(-1px);
      }
    `;

    // Add to page
    document.head.appendChild(style);
    document.body.appendChild(reminderDiv);

    // Add event listeners for buttons
    const gotItButton = document.getElementById('overlap-alert-got-it');
    const manageButton = document.getElementById('overlap-alert-manage');
    
    if (gotItButton) {
      gotItButton.addEventListener('click', function() {
        console.log('Got it button clicked - closing popup');
        reminderDiv.remove();
      });
    }
    
    if (manageButton) {
      manageButton.addEventListener('click', function() {
        console.log('Manage subscriptions button clicked');
        
        // Show helpful message to user (keep popup open for 10 seconds)
        const manageMessage = document.createElement('div');
        manageMessage.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #1a1a1a;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          max-width: 300px;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
        `;
        
        manageMessage.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 18px;">⚡</span>
            <strong>Manage Subscriptions</strong>
          </div>
          <div>Click the OverlapAlert icon in your browser toolbar to manage your subscriptions and view analytics.</div>
        `;
        
        document.body.appendChild(manageMessage);
        
        // Close the original popup and remove message after 10 seconds
        setTimeout(() => {
          reminderDiv.remove();
          if (manageMessage.parentNode) {
            manageMessage.parentNode.removeChild(manageMessage);
          }
        }, 10000);
      });
    }

    // Debug: Log popup creation
    console.log('=== POPUP CREATED ===');
    console.log('Popup element:', reminderDiv);
    console.log('Popup position:', reminderDiv.style.position);
    console.log('Popup z-index:', reminderDiv.style.zIndex);
    console.log('Popup visible:', reminderDiv.offsetHeight > 0);
    console.log('Creation timestamp:', new Date().toISOString());
    
    // Monitor if popup gets removed unexpectedly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          mutation.removedNodes.forEach((node) => {
            if (node === reminderDiv) {
              console.log('⚠️ POPUP REMOVED UNEXPECTEDLY at:', new Date().toISOString());
              console.trace('Removal stack trace:');
            }
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Add event delegation for close button
    reminderDiv.addEventListener('click', (e) => {
      if (e.target.getAttribute('data-action') === 'close') {
        console.log('Close button clicked, removing popup');
        reminderDiv.remove();
      }
    });

    // Popup will only close when user clicks "Got it, thanks!" button
  }

  // Extract pricing information from the page
  function extractPricingFromPage() {
    const pricingInfo = {
      monthlyCost: null,
      planName: null,
      notes: null
    };
    
    // Common pricing patterns to look for
    const priceSelectors = [
      // Direct price elements
      '[data-testid*="price"]',
      '[class*="price"]',
      '[id*="price"]',
      // Currency patterns
      'span:contains("$")',
      'div:contains("$")',
      'p:contains("$")',
      // Plan elements
      '[data-testid*="plan"]',
      '[class*="plan"]',
      '[id*="plan"]'
    ];
    
    // Look for current plan indicators
    const currentPlanSelectors = [
      '[class*="current"]',
      '[data-testid*="current"]',
      'span:contains("Your current plan")',
      'div:contains("Your current plan")',
      'p:contains("Your current plan")',
      'span:contains("Current plan")',
      'div:contains("Current plan")',
      'p:contains("Current plan")'
    ];
    
    // Try to find current plan first
    for (const selector of currentPlanSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.toLowerCase();
        if (text.includes('current') && text.includes('plan')) {
          // Look for price in this element or nearby
          const priceMatch = element.textContent.match(/\$(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            pricingInfo.monthlyCost = parseFloat(priceMatch[1]);
            pricingInfo.planName = element.textContent.trim();
            break;
          }
        }
      }
      if (pricingInfo.monthlyCost) break;
    }
    
    // If no current plan found, look for any pricing
    if (!pricingInfo.monthlyCost) {
      for (const selector of priceSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent;
          const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            pricingInfo.monthlyCost = parseFloat(priceMatch[1]);
            pricingInfo.planName = text.trim();
            break;
          }
        }
        if (pricingInfo.monthlyCost) break;
      }
    }
    
    // Look for monthly indicators
    if (pricingInfo.monthlyCost && pricingInfo.planName) {
      const text = pricingInfo.planName.toLowerCase();
      if (text.includes('year') || text.includes('annual')) {
        // Convert annual to monthly
        pricingInfo.monthlyCost = pricingInfo.monthlyCost / 12;
        pricingInfo.notes = 'Annual plan (converted to monthly)';
      }
    }
    
    console.log('Extracted pricing info:', pricingInfo);
    return pricingInfo;
  }

  // Auto-add subscription to user's list
  function autoAddSubscription(currentService) {
    // Check if extension context is still valid
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log('Extension context invalidated, skipping auto-add');
      return;
    }
    
    try {
      // Check if we've already tried to add this service recently
      const storageKey = `autoAdd_${currentService.serviceName}_${currentService.category}`;
      chrome.storage.local.get([storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.log('Extension context invalidated, skipping auto-add');
          return;
        }
        
        const lastAttempt = result[storageKey];
        const now = Date.now();
      
      // Only auto-add if we haven't tried in the last 24 hours
      if (!lastAttempt || (now - lastAttempt) > 24 * 60 * 60 * 1000) {
        chrome.storage.local.get(['userSubscriptions'], (storageResult) => {
          const userSubscriptions = storageResult.userSubscriptions || [];
          
          // Check if it's already been manually added
          const alreadyExists = userSubscriptions.find(sub => 
            sub.serviceName === currentService.serviceName && sub.category === currentService.category
          );
          
          if (!alreadyExists) {
            // Extract pricing information from the page
            const pricingInfo = extractPricingFromPage();
            
            // Auto-add the subscription
            const newSubscription = {
              serviceName: currentService.serviceName,
              category: currentService.category,
              usageCount: 1,
              firstUsed: new Date().toISOString(),
              lastUsed: new Date().toISOString(),
              autoAdded: true, // Flag to indicate this was auto-added
              monthlyCost: pricingInfo.monthlyCost,
              notes: pricingInfo.notes || (pricingInfo.planName ? `Auto-detected: ${pricingInfo.planName}` : null)
            };
            
            userSubscriptions.push(newSubscription);
            
            chrome.storage.local.set({ 
              userSubscriptions,
              [storageKey]: now 
            }, () => {
              console.log('Auto-added subscription with pricing:', newSubscription);
            });
          }
        });
      }
      });
    } catch (error) {
      console.log('Error auto-adding subscription:', error);
    }
  }

  // Track subscription usage
  function trackSubscriptionUsage(serviceName, category) {
    // Check if extension context is still valid
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log('Extension context invalidated, skipping usage tracking');
      return;
    }
    
    try {
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        if (chrome.runtime.lastError) {
          console.log('Extension context invalidated, skipping usage tracking');
          return;
        }
        
        const userSubscriptions = result.userSubscriptions || [];
      
      // Find existing subscription or create new one
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
      
      // Update usage
      subscription.usageCount = (subscription.usageCount || 0) + 1;
      subscription.lastUsed = new Date().toISOString();
      
        // Save back to storage
        chrome.storage.local.set({ userSubscriptions });
      });
    } catch (error) {
      console.log('Error tracking subscription usage:', error);
    }
  }

  // Clear session storage for testing (call this in console to reset)
  window.clearOverlapAlertSession = function() {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('session_')) {
        sessionStorage.removeItem(key);
        console.log('Cleared session key:', key);
      }
    });
    console.log('Session storage cleared for OverlapAlert');
    console.log('Now refresh the page to see the popup again');
  };

  // Show current session state for debugging
  window.showOverlapAlertSession = function() {
    const keys = Object.keys(sessionStorage);
    const sessionKeys = keys.filter(key => key.startsWith('session_'));
    console.log('Current OverlapAlert session keys:', sessionKeys);
    sessionKeys.forEach(key => {
      const data = JSON.parse(sessionStorage.getItem(key));
      console.log(`${key}:`, data);
    });
  };

  // Make function available immediately
  console.log('OverlapAlert: clearOverlapAlertSession() function is now available in console');

  // Initialize with safety checks
  function init() {
    try {
      // Check if extension context is still valid
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context invalidated, skipping initialization');
        return;
      }
      
      // Check if we're on a subscription page
      checkSubscriptionPage();
      
      // Track usage for known services
      const currentDomain = window.location.hostname;
      const currentService = getServiceByDomain(currentDomain);
      if (currentService) {
        trackSubscriptionUsage(currentService.serviceName, currentService.category);
      }
    } catch (error) {
      console.log('Error during initialization:', error);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also check on URL changes (for SPAs) with safety checks
  let lastUrl = location.href;
  new MutationObserver(() => {
    try {
      // Check if extension context is still valid
      if (!chrome || !chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context invalidated, stopping URL observer');
        return;
      }
      
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(checkSubscriptionPage, 1000); // Delay to let page load
      }
    } catch (error) {
      console.log('Error in URL observer:', error);
    }
  }).observe(document, { subtree: true, childList: true });

})();
