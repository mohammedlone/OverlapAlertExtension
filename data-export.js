// Data Export/Import System for OverlapAlert Premium
class DataExportManager {
  constructor() {
    this.supportedFormats = ['json', 'csv', 'xlsx'];
    this.exportTemplates = {
      subscriptions: ['serviceName', 'category', 'monthlyCost', 'notes', 'firstUsed', 'lastUsed', 'usageCount'],
      analytics: ['period', 'totalSpending', 'totalUsage', 'insights'],
      settings: ['enabled', 'showWarnings', 'trackUsage', 'warningDuration']
    };
  }

  // Export subscriptions to CSV
  async exportSubscriptionsToCSV() {
    try {
      const subscriptions = await this.getSubscriptions();
      
      if (!subscriptions || subscriptions.length === 0) {
        throw new Error('No subscriptions to export');
      }

      // Create CSV header
      const headers = ['Service Name', 'Category', 'Monthly Cost', 'Notes', 'First Used', 'Last Used', 'Usage Count'];
      
      // Create CSV rows
      const rows = subscriptions.map(sub => [
        this.escapeCSVField(sub.serviceName || ''),
        this.escapeCSVField(sub.category || ''),
        sub.monthlyCost || '0',
        this.escapeCSVField(sub.notes || ''),
        this.formatDate(sub.firstUsed),
        this.formatDate(sub.lastUsed),
        sub.usageCount || 0
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      // Download file
      this.downloadFile(csvContent, 'overlap-alert-subscriptions.csv', 'text/csv');
      
      return { success: true, message: 'Subscriptions exported to CSV successfully' };
    } catch (error) {
      console.error('Error exporting subscriptions to CSV:', error);
      return { success: false, error: error.message };
    }
  }

  // Export subscriptions to JSON
  async exportSubscriptionsToJSON() {
    try {
      const subscriptions = await this.getSubscriptions();
      const settings = await this.getSettings();
      const analytics = await this.getAnalytics();
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          subscriptions: subscriptions || [],
          settings: settings || {},
          analytics: analytics || {}
        }
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      
      // Download file
      this.downloadFile(jsonContent, 'overlap-alert-backup.json', 'application/json');
      
      return { success: true, message: 'Complete backup exported to JSON successfully' };
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      return { success: false, error: error.message };
    }
  }

  // Export analytics to Excel
  async exportAnalyticsToExcel() {
    try {
      const analytics = await this.getAnalytics();
      
      if (!analytics) {
        throw new Error('No analytics data to export');
      }

      // Create Excel-like CSV with multiple sheets
      const sheets = [];
      
      // Spending sheet
      if (analytics.spending) {
        sheets.push({
          name: 'Spending Analytics',
          data: this.createSpendingSheet(analytics.spending)
        });
      }
      
      // Usage sheet
      if (analytics.usage) {
        sheets.push({
          name: 'Usage Analytics',
          data: this.createUsageSheet(analytics.usage)
        });
      }
      
      // Insights sheet
      if (analytics.insights) {
        sheets.push({
          name: 'Insights & Recommendations',
          data: this.createInsightsSheet(analytics.insights)
        });
      }

      // For now, we'll export as CSV (Excel import)
      const excelContent = sheets.map(sheet => 
        `=== ${sheet.name} ===\n${sheet.data.join('\n')}\n`
      ).join('\n');
      
      this.downloadFile(excelContent, 'overlap-alert-analytics.csv', 'text/csv');
      
      return { success: true, message: 'Analytics exported to Excel format successfully' };
    } catch (error) {
      console.error('Error exporting analytics to Excel:', error);
      return { success: false, error: error.message };
    }
  }

  // Import data from file
  async importData(file) {
    try {
      const fileContent = await this.readFileContent(file);
      const fileExtension = this.getFileExtension(file.name);
      
      let importData;
      
      switch (fileExtension) {
        case 'json':
          importData = await this.importFromJSON(fileContent);
          break;
        case 'csv':
          importData = await this.importFromCSV(fileContent);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
      
      // Validate imported data
      const validation = this.validateImportData(importData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Import the data
      await this.saveImportedData(importData);
      
      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Import from JSON
  async importFromJSON(content) {
    try {
      const data = JSON.parse(content);
      
      // Check version compatibility
      if (data.version && data.version !== '1.0') {
        console.warn('Importing from different version:', data.version);
      }
      
      return data.data || data;
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  // Import from CSV
  async importFromCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const subscriptions = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has different number of columns than header`);
          continue;
        }
        
        const subscription = {};
        headers.forEach((header, index) => {
          const value = values[index];
          
          switch (header.toLowerCase()) {
            case 'service name':
              subscription.serviceName = value;
              break;
            case 'category':
              subscription.category = value;
              break;
            case 'monthly cost':
              subscription.monthlyCost = parseFloat(value) || 0;
              break;
            case 'notes':
              subscription.notes = value;
              break;
            case 'first used':
              subscription.firstUsed = this.parseDate(value);
              break;
            case 'last used':
              subscription.lastUsed = this.parseDate(value);
              break;
            case 'usage count':
              subscription.usageCount = parseInt(value) || 0;
              break;
          }
        });
        
        if (subscription.serviceName) {
          subscriptions.push(subscription);
        }
      }
      
      return { subscriptions };
    } catch (error) {
      throw new Error('Invalid CSV format: ' + error.message);
    }
  }

  // Validate imported data
  validateImportData(data) {
    try {
      if (!data) {
        return { valid: false, error: 'No data to import' };
      }
      
      // Validate subscriptions
      if (data.subscriptions && Array.isArray(data.subscriptions)) {
        for (const sub of data.subscriptions) {
          if (!sub.serviceName || typeof sub.serviceName !== 'string') {
            return { valid: false, error: 'Invalid subscription data: missing or invalid service name' };
          }
          
          if (sub.monthlyCost && (isNaN(sub.monthlyCost) || sub.monthlyCost < 0)) {
            return { valid: false, error: 'Invalid subscription data: invalid monthly cost' };
          }
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Data validation failed: ' + error.message };
    }
  }

  // Save imported data
  async saveImportedData(data) {
    try {
      const currentData = await this.getCurrentData();
      
      // Merge with existing data
      const mergedData = this.mergeImportedData(currentData, data);
      
      // Save to storage
      return new Promise((resolve) => {
        chrome.storage.local.set(mergedData, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving imported data:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error saving imported data:', error);
      return false;
    }
  }

  // Merge imported data with existing data
  mergeImportedData(current, imported) {
    try {
      const merged = { ...current };
      
      // Merge subscriptions
      if (imported.subscriptions) {
        const existingSubscriptions = current.userSubscriptions || [];
        const newSubscriptions = [...existingSubscriptions];
        
        imported.subscriptions.forEach(importedSub => {
          const existingIndex = existingSubscriptions.findIndex(existingSub =>
            existingSub.serviceName === importedSub.serviceName &&
            existingSub.category === importedSub.category
          );
          
          if (existingIndex >= 0) {
            // Update existing subscription
            newSubscriptions[existingIndex] = {
              ...newSubscriptions[existingIndex],
              ...importedSub
            };
          } else {
            // Add new subscription
            newSubscriptions.push(importedSub);
          }
        });
        
        merged.userSubscriptions = newSubscriptions;
      }
      
      // Merge settings (preserve user preferences)
      if (imported.settings) {
        merged.settings = {
          ...imported.settings,
          ...current.settings,
          // Preserve important local settings
          userTier: current.settings?.userTier || 'free',
          subscriptionStatus: current.settings?.subscriptionStatus || 'inactive'
        };
      }
      
      return merged;
    } catch (error) {
      console.error('Error merging imported data:', error);
      return current;
    }
  }

  // Helper methods
  async getSubscriptions() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting subscriptions:', chrome.runtime.lastError);
          resolve([]);
          return;
        }
        resolve(result.userSubscriptions || []);
      });
    });
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting settings:', chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(result.settings || {});
      });
    });
  }

  async getAnalytics() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['analytics'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting analytics:', chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(result.analytics || {});
      });
    });
  }

  async getCurrentData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userSubscriptions', 'settings', 'analytics'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting current data:', chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(result);
      });
    });
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

  parseDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toISOString();
    } catch (error) {
      return null;
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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

  createSpendingSheet(spending) {
    const rows = [];
    
    // Header
    rows.push('Period,Total Monthly,Total Yearly,By Category');
    
    // Current spending
    rows.push(`Current,${spending.totalMonthly || 0},${spending.totalYearly || 0},"${Object.entries(spending.byCategory || {}).map(([cat, amount]) => `${cat}: $${amount}`).join(', ')}"`);
    
    // Trends
    if (spending.trends && spending.trends.length > 0) {
      spending.trends.forEach(trend => {
        rows.push(`${trend.month},${trend.amount},${trend.amount * 12},""`);
      });
    }
    
    return rows;
  }

  createUsageSheet(usage) {
    const rows = [];
    
    // Header
    rows.push('Service,Category,Usage Count,Last Used');
    
    // Most used
    if (usage.mostUsed && usage.mostUsed.length > 0) {
      usage.mostUsed.forEach(item => {
        rows.push(`${item.name},${item.category},${item.visits},"${this.formatDate(item.lastUsed)}"`);
      });
    }
    
    return rows;
  }

  createInsightsSheet(insights) {
    const rows = [];
    
    // Header
    rows.push('Type,Priority,Title,Message,Potential Savings');
    
    // Recommendations
    if (insights.recommendations && insights.recommendations.length > 0) {
      insights.recommendations.forEach(rec => {
        rows.push(`${rec.type},${rec.priority},${rec.title},"${rec.message}",${rec.savings || 0}`);
      });
    }
    
    return rows;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExportManager;
} else if (typeof window !== 'undefined') {
  window.DataExportManager = DataExportManager;
}
