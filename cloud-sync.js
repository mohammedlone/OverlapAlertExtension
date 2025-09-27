// Cloud Sync System for OverlapAlert Premium
class CloudSyncManager {
  constructor() {
    this.apiBaseUrl = 'https://your-backend-api.com/api'; // Replace with your actual API
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.conflictResolution = 'server_wins'; // or 'client_wins', 'manual'
  }

  // Initialize cloud sync
  async initializeSync() {
    try {
      // Check if user is premium
      const isPremium = await this.checkPremiumStatus();
      if (!isPremium) {
        console.log('Cloud sync requires premium subscription');
        return false;
      }

      // Get user credentials
      const credentials = await this.getUserCredentials();
      if (!credentials) {
        console.log('User not authenticated');
        return false;
      }

      // Start periodic sync
      this.startPeriodicSync();
      
      // Perform initial sync
      await this.performSync();
      
      return true;
    } catch (error) {
      console.error('Error initializing cloud sync:', error);
      return false;
    }
  }

  // Check if user has premium subscription
  async checkPremiumStatus() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error checking premium status:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          
          const settings = result.settings || {};
          const userTier = settings.userTier || 'free';
          const subscriptionStatus = settings.subscriptionStatus || 'inactive';
          
          resolve(userTier === 'premium' && subscriptionStatus === 'active');
        });
      });
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  // Get user credentials for API authentication
  async getUserCredentials() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userCredentials'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting user credentials:', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          
          resolve(result.userCredentials || null);
        });
      });
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return null;
    }
  }

  // Start periodic sync
  startPeriodicSync() {
    try {
      // Clear any existing sync interval
      if (this.syncIntervalId) {
        clearInterval(this.syncIntervalId);
      }

      // Set up new sync interval
      this.syncIntervalId = setInterval(async () => {
        try {
          await this.performSync();
        } catch (error) {
          console.error('Error in periodic sync:', error);
        }
      }, this.syncInterval);

      console.log('Periodic sync started');
    } catch (error) {
      console.error('Error starting periodic sync:', error);
    }
  }

  // Perform sync with cloud
  async performSync() {
    try {
      if (this.syncInProgress) {
        console.log('Sync already in progress');
        return;
      }

      this.syncInProgress = true;
      console.log('Starting cloud sync...');

      // Get local data
      const localData = await this.getLocalData();
      
      // Get remote data
      const remoteData = await this.getRemoteData();
      
      // Resolve conflicts
      const resolvedData = await this.resolveConflicts(localData, remoteData);
      
      // Upload resolved data
      await this.uploadData(resolvedData);
      
      // Update local data
      await this.updateLocalData(resolvedData);
      
      this.lastSyncTime = new Date().toISOString();
      console.log('Cloud sync completed successfully');
      
    } catch (error) {
      console.error('Error during cloud sync:', error);
      this.showSyncError(error.message);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get local data for sync
  async getLocalData() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions', 'settings', 'analytics'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting local data:', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          
          resolve({
            subscriptions: result.userSubscriptions || [],
            settings: result.settings || {},
            analytics: result.analytics || {},
            lastModified: new Date().toISOString(),
            deviceId: this.getDeviceId()
          });
        });
      });
    } catch (error) {
      console.error('Error getting local data:', error);
      return null;
    }
  }

  // Get remote data from cloud
  async getRemoteData() {
    try {
      const credentials = await this.getUserCredentials();
      if (!credentials) {
        throw new Error('No credentials available');
      }

      const response = await fetch(`${this.apiBaseUrl}/sync/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch remote data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting remote data:', error);
      return null;
    }
  }

  // Resolve conflicts between local and remote data
  async resolveConflicts(localData, remoteData) {
    try {
      if (!remoteData) {
        return localData; // No remote data, use local
      }

      if (!localData) {
        return remoteData; // No local data, use remote
      }

      // Compare timestamps
      const localTime = new Date(localData.lastModified);
      const remoteTime = new Date(remoteData.lastModified);

      switch (this.conflictResolution) {
        case 'server_wins':
          return remoteTime > localTime ? remoteData : localData;
        
        case 'client_wins':
          return localTime > remoteTime ? localData : remoteData;
        
        case 'manual':
          return await this.manualConflictResolution(localData, remoteData);
        
        default:
          return remoteTime > localTime ? remoteData : localData;
      }
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      return localData; // Fallback to local data
    }
  }

  // Manual conflict resolution (show UI to user)
  async manualConflictResolution(localData, remoteData) {
    try {
      // This would show a UI for the user to choose
      // For now, we'll merge the data intelligently
      return {
        subscriptions: this.mergeSubscriptions(localData.subscriptions, remoteData.subscriptions),
        settings: this.mergeSettings(localData.settings, remoteData.settings),
        analytics: this.mergeAnalytics(localData.analytics, remoteData.analytics),
        lastModified: new Date().toISOString(),
        deviceId: this.getDeviceId()
      };
    } catch (error) {
      console.error('Error in manual conflict resolution:', error);
      return localData;
    }
  }

  // Merge subscriptions intelligently
  mergeSubscriptions(local, remote) {
    try {
      const merged = [...local];
      
      remote.forEach(remoteSub => {
        const localIndex = local.findIndex(localSub => 
          localSub.serviceName === remoteSub.serviceName && 
          localSub.category === remoteSub.category
        );
        
        if (localIndex >= 0) {
          // Merge existing subscription (keep the most recent data)
          const localSub = local[localIndex];
          merged[localIndex] = {
            ...localSub,
            ...remoteSub,
            lastUsed: remoteSub.lastUsed > localSub.lastUsed ? remoteSub.lastUsed : localSub.lastUsed,
            usageCount: Math.max(localSub.usageCount || 0, remoteSub.usageCount || 0)
          };
        } else {
          // Add new subscription
          merged.push(remoteSub);
        }
      });
      
      return merged;
    } catch (error) {
      console.error('Error merging subscriptions:', error);
      return local;
    }
  }

  // Merge settings
  mergeSettings(local, remote) {
    try {
      return {
        ...local,
        ...remote,
        // Keep local preferences but use remote sync settings
        userTier: remote.userTier || local.userTier,
        subscriptionStatus: remote.subscriptionStatus || local.subscriptionStatus
      };
    } catch (error) {
      console.error('Error merging settings:', error);
      return local;
    }
  }

  // Merge analytics
  mergeAnalytics(local, remote) {
    try {
      return {
        ...local,
        ...remote,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error merging analytics:', error);
      return local;
    }
  }

  // Upload data to cloud
  async uploadData(data) {
    try {
      const credentials = await this.getUserCredentials();
      if (!credentials) {
        throw new Error('No credentials available');
      }

      const response = await fetch(`${this.apiBaseUrl}/sync/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to upload data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading data:', error);
      throw error;
    }
  }

  // Update local data
  async updateLocalData(data) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({
          userSubscriptions: data.subscriptions,
          settings: data.settings,
          analytics: data.analytics,
          lastSyncTime: this.lastSyncTime
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error updating local data:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error updating local data:', error);
      return false;
    }
  }

  // Get device ID
  getDeviceId() {
    try {
      // Generate or retrieve a unique device ID
      let deviceId = localStorage.getItem('overlap-alert-device-id');
      if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('overlap-alert-device-id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return 'unknown_device';
    }
  }

  // Show sync error to user
  showSyncError(message) {
    try {
      // Create error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'sync-error-notification';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        line-height: 1.4;
      `;
      errorDiv.textContent = `Sync Error: ${message}`;
      
      document.body.appendChild(errorDiv);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    } catch (error) {
      console.error('Error showing sync error:', error);
    }
  }

  // Stop sync
  stopSync() {
    try {
      if (this.syncIntervalId) {
        clearInterval(this.syncIntervalId);
        this.syncIntervalId = null;
      }
      console.log('Cloud sync stopped');
    } catch (error) {
      console.error('Error stopping sync:', error);
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isActive: !!this.syncIntervalId,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      conflictResolution: this.conflictResolution
    };
  }

  // Force sync
  async forceSync() {
    try {
      await this.performSync();
      return true;
    } catch (error) {
      console.error('Error in force sync:', error);
      return false;
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudSyncManager;
} else if (typeof window !== 'undefined') {
  window.CloudSyncManager = CloudSyncManager;
}
