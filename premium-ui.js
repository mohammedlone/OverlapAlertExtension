// Premium Features UI for OverlapAlert
class PremiumUIManager {
  constructor() {
    this.monetizationManager = null;
    this.analyticsManager = null;
    this.cloudSyncManager = null;
    this.dataExportManager = null;
    this.priceComparisonManager = null;
    this.renewalReminderManager = null;
    this.bulkManagementManager = null;
    
    this.initializeManagers();
  }

  // Initialize all premium managers
  async initializeManagers() {
    try {
      // Check if managers are available (loaded from web_accessible_resources)
      if (typeof MonetizationManager !== 'undefined') {
        this.monetizationManager = new MonetizationManager();
      }
      
      if (typeof AnalyticsManager !== 'undefined') {
        this.analyticsManager = new AnalyticsManager();
      }
      
      if (typeof CloudSyncManager !== 'undefined') {
        this.cloudSyncManager = new CloudSyncManager();
      }
      
      if (typeof DataExportManager !== 'undefined') {
        this.dataExportManager = new DataExportManager();
      }
      
      if (typeof PriceComparisonManager !== 'undefined') {
        this.priceComparisonManager = new PriceComparisonManager();
      }
      
      if (typeof RenewalReminderManager !== 'undefined') {
        this.renewalReminderManager = new RenewalReminderManager();
      }
      
      if (typeof BulkManagementManager !== 'undefined') {
        this.bulkManagementManager = new BulkManagementManager();
      }
      
      console.log('Premium managers initialized');
    } catch (error) {
      console.error('Error initializing premium managers:', error);
    }
  }

  // Check if user has premium access
  async checkPremiumAccess() {
    try {
      if (!this.monetizationManager) return false;
      
      const userTier = await this.monetizationManager.getUserTier();
      const trialStatus = await this.monetizationManager.getTrialStatus();
      
      return userTier === 'premium' || trialStatus.isActive;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  // Show upgrade prompt for premium features
  showUpgradePrompt(featureName) {
    try {
      const upgradeModal = this.createUpgradeModal(featureName);
      document.body.appendChild(upgradeModal);
    } catch (error) {
      console.error('Error showing upgrade prompt:', error);
    }
  }

  // Create upgrade modal
  createUpgradeModal(featureName) {
    try {
      const modal = document.createElement('div');
      modal.className = 'upgrade-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      `;

      const featureMessages = {
        'advanced_analytics': 'Get detailed insights into your subscription spending and usage patterns',
        'cloud_sync': 'Sync your subscriptions across all your devices',
        'export_import': 'Export and import your subscription data',
        'price_comparison': 'Find better deals and save money with price comparison tools',
        'renewal_reminders': 'Never miss a renewal with smart reminders',
        'bulk_management': 'Manage multiple subscriptions at once'
      };

      modalContent.innerHTML = `
        <div style="margin-bottom: 24px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
          <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px;">Premium Feature</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">${featureMessages[featureName] || 'This feature is available in Premium'}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">Premium Benefits</h3>
          <ul style="margin: 0; padding-left: 20px; text-align: left; color: #1a1a1a;">
            <li>Unlimited subscriptions</li>
            <li>Advanced analytics & insights</li>
            <li>Cloud sync across devices</li>
            <li>Export/import data</li>
            <li>Price comparison tools</li>
            <li>Renewal reminders</li>
            <li>Bulk management</li>
          </ul>
        </div>
        
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #FFD700;">$4.99</div>
              <div style="font-size: 14px; color: #666;">per month</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #FFD700;">$49.99</div>
              <div style="font-size: 14px; color: #666;">per year (17% off)</div>
            </div>
          </div>
          <div style="background: #f0f8ff; padding: 12px; border-radius: 8px; color: #0066cc; font-size: 14px;">
            <strong>14-day free trial</strong> - No credit card required to start
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="startTrialBtn" style="
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #1a1a1a;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
          ">Start Free Trial</button>
          
          <button id="upgradeBtn" style="
            background: #1a1a1a;
            color: #FFD700;
            border: 2px solid #FFD700;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
          ">Upgrade Now</button>
          
          <button id="closeUpgradeModal" style="
            background: #f5f5f5;
            color: #666;
            border: 1px solid #ddd;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">Maybe Later</button>
        </div>
      `;

      modal.appendChild(modalContent);

      // Add event listeners
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'closeUpgradeModal') {
          document.body.removeChild(modal);
        }
      });

      document.getElementById('startTrialBtn')?.addEventListener('click', () => {
        this.startFreeTrial();
        document.body.removeChild(modal);
      });

      document.getElementById('upgradeBtn')?.addEventListener('click', () => {
        this.upgradeToPremium();
        document.body.removeChild(modal);
      });

      return modal;
    } catch (error) {
      console.error('Error creating upgrade modal:', error);
      return document.createElement('div');
    }
  }

  // Start free trial
  async startFreeTrial() {
    try {
      if (!this.monetizationManager) {
        this.showError('Premium features not available');
        return;
      }

      const result = await this.monetizationManager.startFreeTrial();
      
      if (result.success) {
        this.showSuccess('Free trial started! You now have access to all premium features for 14 days.');
        this.updateUIForPremium();
      } else {
        this.showError(result.error || 'Failed to start free trial');
      }
    } catch (error) {
      console.error('Error starting free trial:', error);
      this.showError('Failed to start free trial');
    }
  }

  // Upgrade to premium
  async upgradeToPremium() {
    try {
      if (!this.monetizationManager) {
        this.showError('Premium features not available');
        return;
      }

      // This would redirect to Stripe checkout
      const result = await this.monetizationManager.createCheckoutSession('monthly');
      
      if (result.success) {
        // Open checkout URL
        chrome.tabs.create({ url: result.checkoutUrl });
      } else {
        this.showError(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      this.showError('Failed to upgrade to premium');
    }
  }

  // Update UI for premium users
  async updateUIForPremium() {
    try {
      const isPremium = await this.checkPremiumAccess();
      
      if (isPremium) {
        // Show premium features
        this.showPremiumFeatures();
        this.hideUpgradePrompts();
      } else {
        // Show upgrade prompts
        this.hidePremiumFeatures();
        this.showUpgradePrompts();
      }
    } catch (error) {
      console.error('Error updating UI for premium:', error);
    }
  }

  // Show premium features
  showPremiumFeatures() {
    try {
      // Add premium features to the UI
      const premiumSection = this.createPremiumSection();
      const existingSection = document.getElementById('premium-features-section');
      
      if (existingSection) {
        existingSection.remove();
      }
      
      const content = document.querySelector('.popup-content');
      if (content) {
        content.appendChild(premiumSection);
      }
    } catch (error) {
      console.error('Error showing premium features:', error);
    }
  }

  // Create premium features section
  createPremiumSection() {
    try {
      const section = document.createElement('div');
      section.id = 'premium-features-section';
      section.style.cssText = `
        margin-top: 24px;
        padding: 20px;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        border-radius: 12px;
        color: #1a1a1a;
      `;

      section.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span>⚡</span>
          Premium Features
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <button id="analyticsBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">📊 Analytics</button>
          
          <button id="cloudSyncBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">☁️ Cloud Sync</button>
          
          <button id="exportBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">📤 Export/Import</button>
          
          <button id="priceComparisonBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">💰 Price Compare</button>
          
          <button id="remindersBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">🔔 Reminders</button>
          
          <button id="bulkManagementBtn" class="premium-feature-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #1a1a1a;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">📋 Bulk Manage</button>
        </div>
      `;

      // Add event listeners
      document.getElementById('analyticsBtn')?.addEventListener('click', () => this.openAnalytics());
      document.getElementById('cloudSyncBtn')?.addEventListener('click', () => this.openCloudSync());
      document.getElementById('exportBtn')?.addEventListener('click', () => this.openExportImport());
      document.getElementById('priceComparisonBtn')?.addEventListener('click', () => this.openPriceComparison());
      document.getElementById('remindersBtn')?.addEventListener('click', () => this.openReminders());
      document.getElementById('bulkManagementBtn')?.addEventListener('click', () => this.openBulkManagement());

      return section;
    } catch (error) {
      console.error('Error creating premium section:', error);
      return document.createElement('div');
    }
  }

  // Premium feature handlers
  async openAnalytics() {
    try {
      if (!this.analyticsManager) {
        this.showError('Analytics not available');
        return;
      }

      const analytics = await this.analyticsManager.getComprehensiveAnalytics();
      this.showAnalyticsModal(analytics);
    } catch (error) {
      console.error('Error opening analytics:', error);
      this.showError('Failed to load analytics');
    }
  }

  async openCloudSync() {
    try {
      if (!this.cloudSyncManager) {
        this.showError('Cloud sync not available');
        return;
      }

      const status = this.cloudSyncManager.getSyncStatus();
      this.showCloudSyncModal(status);
    } catch (error) {
      console.error('Error opening cloud sync:', error);
      this.showError('Failed to load cloud sync');
    }
  }

  async openExportImport() {
    try {
      if (!this.dataExportManager) {
        this.showError('Export/Import not available');
        return;
      }

      this.showExportImportModal();
    } catch (error) {
      console.error('Error opening export/import:', error);
      this.showError('Failed to load export/import');
    }
  }

  async openPriceComparison() {
    try {
      if (!this.priceComparisonManager) {
        this.showError('Price comparison not available');
        return;
      }

      const analysis = await this.priceComparisonManager.getComprehensivePriceAnalysis();
      this.showPriceComparisonModal(analysis);
    } catch (error) {
      console.error('Error opening price comparison:', error);
      this.showError('Failed to load price comparison');
    }
  }

  async openReminders() {
    try {
      if (!this.renewalReminderManager) {
        this.showError('Renewal reminders not available');
        return;
      }

      const upcoming = await this.renewalReminderManager.getUpcomingRenewals();
      this.showRemindersModal(upcoming);
    } catch (error) {
      console.error('Error opening reminders:', error);
      this.showError('Failed to load reminders');
    }
  }

  async openBulkManagement() {
    try {
      if (!this.bulkManagementManager) {
        this.showError('Bulk management not available');
        return;
      }

      const status = this.bulkManagementManager.getOperationStatus();
      this.showBulkManagementModal(status);
    } catch (error) {
      console.error('Error opening bulk management:', error);
      this.showError('Failed to load bulk management');
    }
  }

  // Modal creators (simplified versions)
  showAnalyticsModal(analytics) {
    this.showModal('Analytics', `Spending: $${analytics?.spending?.totalMonthly || 0}/month`);
  }

  showCloudSyncModal(status) {
    this.showModal('Cloud Sync', `Status: ${status.isActive ? 'Active' : 'Inactive'}`);
  }

  showExportImportModal() {
    this.showModal('Export/Import', 'Export and import your subscription data');
  }

  showPriceComparisonModal(analysis) {
    this.showModal('Price Comparison', `Potential savings: $${analysis?.potentialSavings || 0}/month`);
  }

  showRemindersModal(upcoming) {
    this.showModal('Renewal Reminders', `${upcoming?.length || 0} upcoming renewals`);
  }

  showBulkManagementModal(status) {
    this.showModal('Bulk Management', `${status.supportedOperations.length} operations available`);
  }

  showModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 32px; border-radius: 16px; max-width: 400px; text-align: center;">
        <h2 style="margin: 0 0 16px 0; color: #1a1a1a;">${title}</h2>
        <p style="margin: 0 0 24px 0; color: #666;">${content}</p>
        <button onclick="this.closest('.modal').remove()" style="
          background: #FFD700;
          color: #1a1a1a;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        ">Close</button>
      </div>
    `;

    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  // Utility methods
  hidePremiumFeatures() {
    const section = document.getElementById('premium-features-section');
    if (section) {
      section.remove();
    }
  }

  showUpgradePrompts() {
    // Add upgrade prompts to existing buttons
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(button => {
      if (!button.dataset.upgradePromptAdded) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.showUpgradePrompt('basic_features');
        });
        button.dataset.upgradePromptAdded = 'true';
      }
    });
  }

  hideUpgradePrompts() {
    // Remove upgrade prompts
    const buttons = document.querySelectorAll('[data-upgrade-prompt-added]');
    buttons.forEach(button => {
      button.removeAttribute('data-upgrade-prompt-added');
    });
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Initialize premium UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.premiumUIManager = new PremiumUIManager();
    
    // Update UI based on premium status
    setTimeout(() => {
      window.premiumUIManager.updateUIForPremium();
    }, 1000);
  } catch (error) {
    console.error('Error initializing premium UI:', error);
  }
});
