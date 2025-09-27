// Renewal Reminders System for OverlapAlert Premium
class RenewalReminderManager {
  constructor() {
    this.reminderIntervals = {
      '7_days': 7 * 24 * 60 * 60 * 1000,
      '3_days': 3 * 24 * 60 * 60 * 1000,
      '1_day': 24 * 60 * 60 * 1000,
      '1_hour': 60 * 60 * 1000
    };
    
    this.defaultReminderSettings = {
      enabled: true,
      intervals: ['7_days', '3_days', '1_day'],
      soundEnabled: true,
      browserNotifications: true,
      emailNotifications: false,
      reminderMessage: 'Your subscription to {serviceName} will renew in {timeLeft}. Current cost: ${cost}/month.'
    };
  }

  // Initialize renewal reminder system
  async initialize() {
    try {
      const settings = await this.getReminderSettings();
      
      if (!settings.enabled) {
        console.log('Renewal reminders are disabled');
        return;
      }

      // Set up periodic checks
      this.startPeriodicChecks();
      
      // Check for immediate reminders
      await this.checkForRenewals();
      
      console.log('Renewal reminder system initialized');
    } catch (error) {
      console.error('Error initializing renewal reminders:', error);
    }
  }

  // Start periodic checks for renewals
  startPeriodicChecks() {
    try {
      // Check every hour
      setInterval(async () => {
        try {
          await this.checkForRenewals();
        } catch (error) {
          console.error('Error in periodic renewal check:', error);
        }
      }, 60 * 60 * 1000); // 1 hour
      
      console.log('Periodic renewal checks started');
    } catch (error) {
      console.error('Error starting periodic checks:', error);
    }
  }

  // Check for upcoming renewals
  async checkForRenewals() {
    try {
      const subscriptions = await this.getSubscriptionsWithRenewalDates();
      const settings = await this.getReminderSettings();
      
      if (!settings.enabled) return;

      const now = new Date();
      const reminders = [];

      for (const subscription of subscriptions) {
        const renewalDate = new Date(subscription.renewalDate);
        const timeUntilRenewal = renewalDate - now;

        // Check if we need to send reminders
        for (const interval of settings.intervals) {
          const intervalMs = this.reminderIntervals[interval];
          
          if (timeUntilRenewal <= intervalMs && timeUntilRenewal > 0) {
            // Check if we've already sent this reminder
            const reminderKey = `${subscription.serviceName}_${interval}`;
            const lastReminder = await this.getLastReminder(reminderKey);
            
            if (!lastReminder || this.shouldSendReminder(lastReminder, interval)) {
              reminders.push({
                subscription,
                interval,
                timeUntilRenewal,
                reminderKey
              });
            }
          }
        }
      }

      // Send reminders
      for (const reminder of reminders) {
        await this.sendReminder(reminder);
      }

      return reminders;
    } catch (error) {
      console.error('Error checking for renewals:', error);
      return [];
    }
  }

  // Get subscriptions with renewal dates
  async getSubscriptionsWithRenewalDates() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions:', chrome.runtime.lastError);
            resolve([]);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          
          // Add renewal dates if not present
          const subscriptionsWithRenewals = subscriptions.map(sub => {
            if (!sub.renewalDate) {
              // Estimate renewal date based on subscription start
              const startDate = sub.firstUsed ? new Date(sub.firstUsed) : new Date();
              const renewalDate = new Date(startDate);
              renewalDate.setMonth(renewalDate.getMonth() + 1);
              
              return {
                ...sub,
                renewalDate: renewalDate.toISOString()
              };
            }
            return sub;
          });

          resolve(subscriptionsWithRenewals);
        });
      });
    } catch (error) {
      console.error('Error getting subscriptions with renewal dates:', error);
      return [];
    }
  }

  // Send renewal reminder
  async sendReminder(reminder) {
    try {
      const { subscription, interval, timeUntilRenewal } = reminder;
      const settings = await this.getReminderSettings();
      
      const timeLeft = this.formatTimeLeft(timeUntilRenewal);
      const message = this.formatReminderMessage(settings.reminderMessage, {
        serviceName: subscription.serviceName,
        timeLeft: timeLeft,
        cost: subscription.monthlyCost || 0
      });

      // Send browser notification
      if (settings.browserNotifications) {
        await this.sendBrowserNotification(subscription.serviceName, message);
      }

      // Send sound notification
      if (settings.soundEnabled) {
        this.playReminderSound();
      }

      // Update last reminder time
      await this.updateLastReminder(reminder.reminderKey);

      console.log(`Renewal reminder sent for ${subscription.serviceName}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  // Send browser notification
  async sendBrowserNotification(title, message) {
    try {
      // Request notification permission
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: 'icons/icon48.png',
          badge: 'icons/icon16.png',
          tag: 'renewal-reminder',
          requireInteraction: true
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.error('Error sending browser notification:', error);
    }
  }

  // Play reminder sound
  playReminderSound() {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing reminder sound:', error);
    }
  }

  // Format time left until renewal
  formatTimeLeft(timeMs) {
    const days = Math.floor(timeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` and ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  // Format reminder message
  formatReminderMessage(template, variables) {
    let message = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value);
    });

    return message;
  }

  // Get reminder settings
  async getReminderSettings() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['reminderSettings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting reminder settings:', chrome.runtime.lastError);
            resolve(this.defaultReminderSettings);
            return;
          }
          
          resolve({
            ...this.defaultReminderSettings,
            ...result.reminderSettings
          });
        });
      });
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return this.defaultReminderSettings;
    }
  }

  // Update reminder settings
  async updateReminderSettings(newSettings) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({ reminderSettings: newSettings }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error updating reminder settings:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      return false;
    }
  }

  // Get last reminder time
  async getLastReminder(reminderKey) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['lastReminders'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting last reminder:', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          
          resolve(result.lastReminders?.[reminderKey] || null);
        });
      });
    } catch (error) {
      console.error('Error getting last reminder:', error);
      return null;
    }
  }

  // Update last reminder time
  async updateLastReminder(reminderKey) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['lastReminders'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error updating last reminder:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          
          const lastReminders = result.lastReminders || {};
          lastReminders[reminderKey] = new Date().toISOString();
          
          chrome.storage.local.set({ lastReminders }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving last reminder:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error updating last reminder:', error);
      return false;
    }
  }

  // Check if we should send a reminder
  shouldSendReminder(lastReminder, interval) {
    try {
      const lastTime = new Date(lastReminder);
      const now = new Date();
      const timeSinceLastReminder = now - lastTime;
      const intervalMs = this.reminderIntervals[interval];
      
      // Don't send the same reminder more than once per interval
      return timeSinceLastReminder >= intervalMs;
    } catch (error) {
      console.error('Error checking if should send reminder:', error);
      return true; // Default to sending reminder if there's an error
    }
  }

  // Manually set renewal date for a subscription
  async setRenewalDate(serviceName, renewalDate) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          const subscriptionIndex = subscriptions.findIndex(sub => 
            sub.serviceName === serviceName
          );

          if (subscriptionIndex >= 0) {
            subscriptions[subscriptionIndex].renewalDate = renewalDate.toISOString();
            
            chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
              if (chrome.runtime.lastError) {
                console.error('Error updating subscription:', chrome.runtime.lastError);
                resolve(false);
                return;
              }
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error setting renewal date:', error);
      return false;
    }
  }

  // Get upcoming renewals
  async getUpcomingRenewals(daysAhead = 30) {
    try {
      const subscriptions = await this.getSubscriptionsWithRenewalDates();
      const now = new Date();
      const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

      const upcomingRenewals = subscriptions
        .filter(sub => {
          const renewalDate = new Date(sub.renewalDate);
          return renewalDate > now && renewalDate <= futureDate;
        })
        .map(sub => ({
          ...sub,
          renewalDate: new Date(sub.renewalDate),
          daysUntilRenewal: Math.ceil((new Date(sub.renewalDate) - now) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => a.renewalDate - b.renewalDate);

      return upcomingRenewals;
    } catch (error) {
      console.error('Error getting upcoming renewals:', error);
      return [];
    }
  }

  // Test reminder system
  async testReminder(serviceName) {
    try {
      const subscription = {
        serviceName: serviceName,
        monthlyCost: 9.99,
        renewalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
      };

      await this.sendReminder({
        subscription,
        interval: '1_day',
        timeUntilRenewal: 24 * 60 * 60 * 1000,
        reminderKey: `${serviceName}_test`
      });

      return true;
    } catch (error) {
      console.error('Error testing reminder:', error);
      return false;
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RenewalReminderManager;
} else if (typeof window !== 'undefined') {
  window.RenewalReminderManager = RenewalReminderManager;
}
