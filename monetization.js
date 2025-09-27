// Monetization system for OverlapAlert extension
// Handles user tiers, subscriptions, and Stripe integration

class MonetizationManager {
  constructor() {
    this.stripePublicKey = 'pk_test_...'; // Replace with your Stripe public key
    this.pricing = {
      monthly: {
        price: 499, // $4.99 in cents
        interval: 'month',
        name: 'Monthly Premium'
      },
      yearly: {
        price: 4999, // $49.99 in cents
        interval: 'year',
        name: 'Yearly Premium (17% savings)'
      }
    };
    
    this.featureLimits = {
      free: {
        maxSubscriptions: 5,
        features: ['basic_detection', 'manual_management', 'basic_tracking']
      },
      premium: {
        maxSubscriptions: -1, // Unlimited
        features: ['basic_detection', 'manual_management', 'basic_tracking', 
                  'advanced_analytics', 'cloud_sync', 'export_import', 
                  'price_comparison', 'renewal_reminders', 'bulk_management']
      }
    };
    
    this.trialDuration = 14; // days
  }

  // Check if user has access to a feature
  async hasFeatureAccess(featureName) {
    try {
      const userTier = await this.getUserTier();
      const trialStatus = await this.getTrialStatus();
      
      // Premium features require premium tier or active trial
      const premiumFeatures = ['advanced_analytics', 'cloud_sync', 'export_import', 
                              'price_comparison', 'renewal_reminders', 'bulk_management'];
      
      if (premiumFeatures.includes(featureName)) {
        return userTier === 'premium' || trialStatus.isActive;
      }
      
      return true; // Free features available to everyone
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  // Check if user can add more subscriptions
  async canAddSubscription() {
    try {
      const userTier = await this.getUserTier();
      const trialStatus = await this.getTrialStatus();
      const currentCount = await this.getCurrentSubscriptionCount();
      
      if (userTier === 'premium' || trialStatus.isActive) {
        return true; // Unlimited for premium/trial users
      }
      
      const limit = this.featureLimits.free.maxSubscriptions;
      return currentCount < limit;
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      return false;
    }
  }

  // Get current user tier
  async getUserTier() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting user tier:', chrome.runtime.lastError);
            resolve('free');
            return;
          }
          
          const settings = result.settings || {};
          resolve(settings.userTier || 'free');
        });
      });
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'free';
    }
  }

  // Get trial status
  async getTrialStatus() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting trial status:', chrome.runtime.lastError);
            resolve({ isActive: false, daysRemaining: 0 });
            return;
          }
          
          const settings = result.settings || {};
          const trialEndDate = settings.trialEndDate;
          
          if (!trialEndDate) {
            resolve({ isActive: false, daysRemaining: 0 });
            return;
          }
          
          const now = new Date();
          const trialEnd = new Date(trialEndDate);
          const isActive = now < trialEnd;
          const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
          
          resolve({ isActive, daysRemaining });
        });
      });
    } catch (error) {
      console.error('Error getting trial status:', error);
      return { isActive: false, daysRemaining: 0 };
    }
  }

  // Start free trial
  async startFreeTrial() {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + this.trialDuration);
      
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error starting trial:', chrome.runtime.lastError);
            resolve({ success: false, error: 'Storage error' });
            return;
          }
          
          const settings = result.settings || {};
          settings.trialEndDate = trialEndDate.toISOString();
          settings.trialStarted = new Date().toISOString();
          
          chrome.storage.local.set({ settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving trial settings:', chrome.runtime.lastError);
              resolve({ success: false, error: 'Save error' });
              return;
            }
            
            resolve({ success: true, trialEndDate: trialEndDate.toISOString() });
          });
        });
      });
    } catch (error) {
      console.error('Error starting free trial:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  // Get current subscription count
  async getCurrentSubscriptionCount() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscription count:', chrome.runtime.lastError);
            resolve(0);
            return;
          }
          
          const subscriptions = result.userSubscriptions || [];
          resolve(subscriptions.length);
        });
      });
    } catch (error) {
      console.error('Error getting subscription count:', error);
      return 0;
    }
  }

  // Show upgrade prompt
  showUpgradePrompt(featureName) {
    const messages = {
      'subscription_limit': `You've reached the free tier limit of ${this.featureLimits.free.maxSubscriptions} subscriptions. Upgrade to Premium for unlimited subscriptions!`,
      'advanced_analytics': 'Advanced analytics are available in Premium. Get insights into your subscription usage patterns!',
      'cloud_sync': 'Cloud sync is available in Premium. Access your subscriptions across all devices!',
      'export_import': 'Export/Import is available in Premium. Backup and restore your subscription data!',
      'price_comparison': 'Price comparison tools are available in Premium. Find the best deals!',
      'renewal_reminders': 'Renewal reminders are available in Premium. Never miss a payment again!',
      'bulk_management': 'Bulk management is available in Premium. Manage multiple subscriptions at once!'
    };
    
    const message = messages[featureName] || 'This feature is available in Premium. Upgrade to unlock all features!';
    
    // Show upgrade modal or notification
    this.showUpgradeModal(message);
  }

  // Show upgrade modal
  showUpgradeModal(message) {
    // This would integrate with your popup UI
    // For now, we'll use a simple alert (replace with proper modal in production)
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message + '\n\nUpgrade to Premium for $4.99/month or $49.99/year!');
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(priceType) {
    try {
      const response = await fetch('https://your-backend.com/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceType: priceType, // 'monthly' or 'yearly'
          extensionId: chrome.runtime.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId, url } = await response.json();
      return { success: true, sessionId, checkoutUrl: url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(sessionId) {
    try {
      // Verify payment with your backend
      const response = await fetch('https://your-backend.com/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error('Payment verification failed');
      }
      
      const { customerId, subscriptionId } = await response.json();
      
      // Update user tier to premium
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error updating user tier:', chrome.runtime.lastError);
            resolve({ success: false, error: 'Storage error' });
            return;
          }
          
          const settings = result.settings || {};
          settings.userTier = 'premium';
          settings.customerId = customerId;
          settings.subscriptionId = subscriptionId;
          settings.subscriptionStatus = 'active';
          settings.premiumStartDate = new Date().toISOString();
          
          chrome.storage.local.set({ settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving premium settings:', chrome.runtime.lastError);
              resolve({ success: false, error: 'Save error' });
              return;
            }
            
            resolve({ success: true });
          });
        });
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pricing information
  getPricing() {
    return this.pricing;
  }

  // Get feature limits
  getFeatureLimits() {
    return this.featureLimits;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonetizationManager;
} else if (typeof window !== 'undefined') {
  window.MonetizationManager = MonetizationManager;
}
