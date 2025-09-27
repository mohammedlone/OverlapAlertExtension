// Bulk Management System for OverlapAlert Premium
class BulkManagementManager {
  constructor() {
    this.operations = {
      'bulk_delete': 'Delete multiple subscriptions',
      'bulk_edit_category': 'Change category for multiple subscriptions',
      'bulk_edit_cost': 'Update cost for multiple subscriptions',
      'bulk_archive': 'Archive multiple subscriptions',
      'bulk_export': 'Export multiple subscriptions',
      'bulk_import': 'Import multiple subscriptions'
    };
    
    this.batchSize = 10; // Process in batches to avoid performance issues
  }

  // Bulk delete subscriptions
  async bulkDelete(serviceNames) {
    try {
      if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
        throw new Error('No subscriptions selected for deletion');
      }

      const results = {
        success: [],
        failed: [],
        total: serviceNames.length
      };

      // Process in batches
      for (let i = 0; i < serviceNames.length; i += this.batchSize) {
        const batch = serviceNames.slice(i, i + this.batchSize);
        
        for (const serviceName of batch) {
          try {
            const success = await this.deleteSingleSubscription(serviceName);
            if (success) {
              results.success.push(serviceName);
            } else {
              results.failed.push({ serviceName, error: 'Failed to delete' });
            }
          } catch (error) {
            results.failed.push({ serviceName, error: error.message });
          }
        }
        
        // Small delay between batches to avoid overwhelming the system
        if (i + this.batchSize < serviceNames.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return {
        success: [],
        failed: serviceNames.map(name => ({ serviceName: name, error: error.message })),
        total: serviceNames.length
      };
    }
  }

  // Bulk edit category
  async bulkEditCategory(serviceNames, newCategory) {
    try {
      if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
        throw new Error('No subscriptions selected for category update');
      }

      if (!newCategory || typeof newCategory !== 'string') {
        throw new Error('Invalid category provided');
      }

      const results = {
        success: [],
        failed: [],
        total: serviceNames.length
      };

      // Process in batches
      for (let i = 0; i < serviceNames.length; i += this.batchSize) {
        const batch = serviceNames.slice(i, i + this.batchSize);
        
        for (const serviceName of batch) {
          try {
            const success = await this.updateSubscriptionCategory(serviceName, newCategory);
            if (success) {
              results.success.push(serviceName);
            } else {
              results.failed.push({ serviceName, error: 'Failed to update category' });
            }
          } catch (error) {
            results.failed.push({ serviceName, error: error.message });
          }
        }
        
        // Small delay between batches
        if (i + this.batchSize < serviceNames.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk edit category:', error);
      return {
        success: [],
        failed: serviceNames.map(name => ({ serviceName: name, error: error.message })),
        total: serviceNames.length
      };
    }
  }

  // Bulk edit cost
  async bulkEditCost(serviceNames, newCost) {
    try {
      if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
        throw new Error('No subscriptions selected for cost update');
      }

      const cost = parseFloat(newCost);
      if (isNaN(cost) || cost < 0) {
        throw new Error('Invalid cost provided');
      }

      const results = {
        success: [],
        failed: [],
        total: serviceNames.length
      };

      // Process in batches
      for (let i = 0; i < serviceNames.length; i += this.batchSize) {
        const batch = serviceNames.slice(i, i + this.batchSize);
        
        for (const serviceName of batch) {
          try {
            const success = await this.updateSubscriptionCost(serviceName, cost);
            if (success) {
              results.success.push(serviceName);
            } else {
              results.failed.push({ serviceName, error: 'Failed to update cost' });
            }
          } catch (error) {
            results.failed.push({ serviceName, error: error.message });
          }
        }
        
        // Small delay between batches
        if (i + this.batchSize < serviceNames.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk edit cost:', error);
      return {
        success: [],
        failed: serviceNames.map(name => ({ serviceName: name, error: error.message })),
        total: serviceNames.length
      };
    }
  }

  // Bulk archive subscriptions
  async bulkArchive(serviceNames, archive = true) {
    try {
      if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
        throw new Error('No subscriptions selected for archiving');
      }

      const results = {
        success: [],
        failed: [],
        total: serviceNames.length
      };

      // Process in batches
      for (let i = 0; i < serviceNames.length; i += this.batchSize) {
        const batch = serviceNames.slice(i, i + this.batchSize);
        
        for (const serviceName of batch) {
          try {
            const success = await this.archiveSubscription(serviceName, archive);
            if (success) {
              results.success.push(serviceName);
            } else {
              results.failed.push({ serviceName, error: 'Failed to archive' });
            }
          } catch (error) {
            results.failed.push({ serviceName, error: error.message });
          }
        }
        
        // Small delay between batches
        if (i + this.batchSize < serviceNames.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk archive:', error);
      return {
        success: [],
        failed: serviceNames.map(name => ({ serviceName: name, error: error.message })),
        total: serviceNames.length
      };
    }
  }

  // Bulk export subscriptions
  async bulkExport(serviceNames, format = 'json') {
    try {
      if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
        throw new Error('No subscriptions selected for export');
      }

      const subscriptions = await this.getSubscriptionsByNames(serviceNames);
      
      if (subscriptions.length === 0) {
        throw new Error('No valid subscriptions found for export');
      }

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportedCount: subscriptions.length,
        subscriptions: subscriptions
      };

      let content, filename, mimeType;

      switch (format.toLowerCase()) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `overlap-alert-bulk-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        
        case 'csv':
          content = this.convertToCSV(subscriptions);
          filename = `overlap-alert-bulk-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.downloadFile(content, filename, mimeType);

      return {
        success: true,
        exportedCount: subscriptions.length,
        filename: filename
      };
    } catch (error) {
      console.error('Error in bulk export:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Bulk import subscriptions
  async bulkImport(subscriptions, options = {}) {
    try {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        throw new Error('No subscriptions provided for import');
      }

      const results = {
        success: [],
        failed: [],
        total: subscriptions.length,
        skipped: 0
      };

      const existingSubscriptions = await this.getAllSubscriptions();
      const existingMap = new Map();
      existingSubscriptions.forEach(sub => {
        existingMap.set(`${sub.serviceName}_${sub.category}`, sub);
      });

      // Process in batches
      for (let i = 0; i < subscriptions.length; i += this.batchSize) {
        const batch = subscriptions.slice(i, i + this.batchSize);
        
        for (const subscription of batch) {
          try {
            // Validate subscription data
            const validation = this.validateSubscription(subscription);
            if (!validation.valid) {
              results.failed.push({ 
                serviceName: subscription.serviceName || 'Unknown', 
                error: validation.error 
              });
              continue;
            }

            // Check for duplicates
            const key = `${subscription.serviceName}_${subscription.category}`;
            if (existingMap.has(key) && !options.overwrite) {
              results.skipped++;
              continue;
            }

            // Add or update subscription
            const success = await this.addOrUpdateSubscription(subscription, options.overwrite);
            if (success) {
              results.success.push(subscription.serviceName);
            } else {
              results.failed.push({ 
                serviceName: subscription.serviceName, 
                error: 'Failed to import' 
              });
            }
          } catch (error) {
            results.failed.push({ 
              serviceName: subscription.serviceName || 'Unknown', 
              error: error.message 
            });
          }
        }
        
        // Small delay between batches
        if (i + this.batchSize < subscriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk import:', error);
      return {
        success: [],
        failed: subscriptions.map(sub => ({ 
          serviceName: sub.serviceName || 'Unknown', 
          error: error.message 
        })),
        total: subscriptions.length
      };
    }
  }

  // Helper methods
  async deleteSingleSubscription(serviceName) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          const filteredSubscriptions = subscriptions.filter(sub => 
            sub.serviceName !== serviceName
          );

          if (filteredSubscriptions.length === subscriptions.length) {
            resolve(false); // No subscription was found to delete
            return;
          }

          chrome.storage.local.set({ userSubscriptions: filteredSubscriptions }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error deleting subscription:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error deleting single subscription:', error);
      return false;
    }
  }

  async updateSubscriptionCategory(serviceName, newCategory) {
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

          if (subscriptionIndex < 0) {
            resolve(false);
            return;
          }

          subscriptions[subscriptionIndex].category = newCategory;
          subscriptions[subscriptionIndex].lastModified = new Date().toISOString();

          chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error updating subscription category:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error updating subscription category:', error);
      return false;
    }
  }

  async updateSubscriptionCost(serviceName, newCost) {
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

          if (subscriptionIndex < 0) {
            resolve(false);
            return;
          }

          subscriptions[subscriptionIndex].monthlyCost = newCost;
          subscriptions[subscriptionIndex].lastModified = new Date().toISOString();

          chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error updating subscription cost:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error updating subscription cost:', error);
      return false;
    }
  }

  async archiveSubscription(serviceName, archive) {
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

          if (subscriptionIndex < 0) {
            resolve(false);
            return;
          }

          subscriptions[subscriptionIndex].archived = archive;
          subscriptions[subscriptionIndex].archivedDate = archive ? new Date().toISOString() : null;
          subscriptions[subscriptionIndex].lastModified = new Date().toISOString();

          chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error archiving subscription:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error archiving subscription:', error);
      return false;
    }
  }

  async getSubscriptionsByNames(serviceNames) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions:', chrome.runtime.lastError);
            resolve([]);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          const filteredSubscriptions = subscriptions.filter(sub => 
            serviceNames.includes(sub.serviceName)
          );

          resolve(filteredSubscriptions);
        });
      });
    } catch (error) {
      console.error('Error getting subscriptions by names:', error);
      return [];
    }
  }

  async getAllSubscriptions() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting all subscriptions:', chrome.runtime.lastError);
            resolve([]);
            return;
          }
          resolve(result.userSubscriptions || []);
        });
      });
    } catch (error) {
      console.error('Error getting all subscriptions:', error);
      return [];
    }
  }

  async addOrUpdateSubscription(subscription, overwrite = false) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscriptions:', chrome.runtime.lastError);
            resolve(false);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          const existingIndex = subscriptions.findIndex(sub => 
            sub.serviceName === subscription.serviceName && 
            sub.category === subscription.category
          );

          if (existingIndex >= 0) {
            if (overwrite) {
              subscriptions[existingIndex] = {
                ...subscriptions[existingIndex],
                ...subscription,
                lastModified: new Date().toISOString()
              };
            } else {
              resolve(false); // Subscription already exists and overwrite is false
              return;
            }
          } else {
            // Add new subscription
            subscriptions.push({
              ...subscription,
              firstUsed: subscription.firstUsed || new Date().toISOString(),
              lastUsed: subscription.lastUsed || new Date().toISOString(),
              usageCount: subscription.usageCount || 0,
              lastModified: new Date().toISOString()
            });
          }

          chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving subscription:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      console.error('Error adding or updating subscription:', error);
      return false;
    }
  }

  validateSubscription(subscription) {
    try {
      if (!subscription || typeof subscription !== 'object') {
        return { valid: false, error: 'Invalid subscription object' };
      }

      if (!subscription.serviceName || typeof subscription.serviceName !== 'string') {
        return { valid: false, error: 'Service name is required' };
      }

      if (!subscription.category || typeof subscription.category !== 'string') {
        return { valid: false, error: 'Category is required' };
      }

      if (subscription.monthlyCost !== undefined && subscription.monthlyCost !== null) {
        const cost = parseFloat(subscription.monthlyCost);
        if (isNaN(cost) || cost < 0) {
          return { valid: false, error: 'Invalid monthly cost' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Validation error: ' + error.message };
    }
  }

  convertToCSV(subscriptions) {
    try {
      const headers = ['Service Name', 'Category', 'Monthly Cost', 'Notes', 'First Used', 'Last Used', 'Usage Count'];
      const rows = subscriptions.map(sub => [
        this.escapeCSVField(sub.serviceName || ''),
        this.escapeCSVField(sub.category || ''),
        sub.monthlyCost || '0',
        this.escapeCSVField(sub.notes || ''),
        this.formatDate(sub.firstUsed),
        this.formatDate(sub.lastUsed),
        sub.usageCount || 0
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } catch (error) {
      console.error('Error converting to CSV:', error);
      return '';
    }
  }

  escapeCSVField(field) {
    if (typeof field !== 'string') return field;
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }

  downloadFile(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  // Get operation status
  getOperationStatus() {
    return {
      supportedOperations: Object.keys(this.operations),
      batchSize: this.batchSize,
      operations: this.operations
    };
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BulkManagementManager;
} else if (typeof window !== 'undefined') {
  window.BulkManagementManager = BulkManagementManager;
}
