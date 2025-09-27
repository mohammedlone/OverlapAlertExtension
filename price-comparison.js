// Price Comparison System for OverlapAlert Premium
class PriceComparisonManager {
  constructor() {
    this.priceTrackingInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.comparisonServices = {
      'netflix': { basePrice: 15.49, alternatives: ['hulu', 'disney+', 'amazon-prime'] },
      'spotify': { basePrice: 10.99, alternatives: ['apple-music', 'youtube-music', 'amazon-music'] },
      'adobe-creative': { basePrice: 52.99, alternatives: ['figma', 'canva-pro', 'sketch'] },
      'microsoft-office': { basePrice: 6.99, alternatives: ['google-workspace', 'libreoffice', 'wps-office'] },
      'dropbox': { basePrice: 11.99, alternatives: ['google-drive', 'onedrive', 'icloud'] },
      'slack': { basePrice: 7.25, alternatives: ['microsoft-teams', 'discord', 'telegram'] },
      'zoom': { basePrice: 14.99, alternatives: ['google-meet', 'microsoft-teams', 'webex'] },
      'canva': { basePrice: 14.99, alternatives: ['adobe-creative', 'figma', 'sketch'] },
      'notion': { basePrice: 8.00, alternatives: ['obsidian', 'roam-research', 'logseq'] },
      'grammarly': { basePrice: 12.00, alternatives: ['proWritingAid', 'hemingway-editor', 'language-tool'] }
    };
    
    this.alternativeServices = {
      'hulu': { price: 7.99, features: ['TV shows', 'Movies', 'Live TV'] },
      'disney+': { price: 7.99, features: ['Disney content', 'Marvel', 'Star Wars'] },
      'amazon-prime': { price: 14.99, features: ['Movies', 'TV shows', 'Shipping', 'Music'] },
      'apple-music': { price: 10.99, features: ['Music streaming', 'Radio', 'Music videos'] },
      'youtube-music': { price: 10.99, features: ['Music streaming', 'YouTube videos', 'Background play'] },
      'amazon-music': { price: 8.99, features: ['Music streaming', 'Prime benefits'] },
      'figma': { price: 15.00, features: ['Design tools', 'Collaboration', 'Prototyping'] },
      'canva-pro': { price: 14.99, features: ['Design templates', 'Brand kit', 'Collaboration'] },
      'sketch': { price: 9.99, features: ['Design tools', 'Prototyping', 'Developer handoff'] },
      'google-workspace': { price: 6.00, features: ['Gmail', 'Drive', 'Docs', 'Sheets'] },
      'libreoffice': { price: 0, features: ['Word processor', 'Spreadsheet', 'Presentation'] },
      'wps-office': { price: 3.99, features: ['Office suite', 'PDF tools', 'Cloud sync'] },
      'google-drive': { price: 1.99, features: ['Cloud storage', 'Collaboration', 'Google apps'] },
      'onedrive': { price: 1.99, features: ['Cloud storage', 'Office integration', 'Collaboration'] },
      'icloud': { price: 0.99, features: ['Cloud storage', 'Apple ecosystem', 'Backup'] },
      'microsoft-teams': { price: 6.00, features: ['Chat', 'Video calls', 'File sharing', 'Office integration'] },
      'discord': { price: 9.99, features: ['Voice chat', 'Text chat', 'Screen sharing'] },
      'telegram': { price: 0, features: ['Messaging', 'File sharing', 'Voice calls'] },
      'google-meet': { price: 6.00, features: ['Video conferencing', 'Screen sharing', 'Recording'] },
      'webex': { price: 14.95, features: ['Video conferencing', 'Webinars', 'Recording'] },
      'obsidian': { price: 8.00, features: ['Note-taking', 'Knowledge management', 'Graph view'] },
      'roam-research': { price: 15.00, features: ['Note-taking', 'Block references', 'Graph database'] },
      'logseq': { price: 0, features: ['Note-taking', 'Block-based', 'Open source'] },
      'proWritingAid': { price: 20.00, features: ['Writing assistant', 'Grammar check', 'Style analysis'] },
      'hemingway-editor': { price: 19.99, features: ['Writing editor', 'Readability analysis', 'Style suggestions'] },
      'language-tool': { price: 4.92, features: ['Grammar check', 'Style suggestions', 'Multilingual'] }
    };
  }

  // Get price comparison for a service
  async getPriceComparison(serviceName) {
    try {
      const normalizedName = this.normalizeServiceName(serviceName);
      const serviceInfo = this.comparisonServices[normalizedName];
      
      if (!serviceInfo) {
        return {
          success: false,
          error: 'Service not found in comparison database'
        };
      }

      // Get current subscription data
      const subscription = await this.getSubscriptionData(serviceName);
      const currentPrice = subscription ? parseFloat(subscription.monthlyCost) : serviceInfo.basePrice;

      // Find alternatives
      const alternatives = await this.findAlternatives(normalizedName, currentPrice);

      // Calculate savings
      const savings = this.calculateSavings(currentPrice, alternatives);

      return {
        success: true,
        data: {
          currentService: {
            name: serviceName,
            price: currentPrice,
            category: subscription?.category || 'Unknown'
          },
          alternatives: alternatives,
          savings: savings,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting price comparison:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Find alternatives for a service
  async findAlternatives(serviceName, currentPrice) {
    try {
      const serviceInfo = this.comparisonServices[serviceName];
      if (!serviceInfo) return [];

      const alternatives = serviceInfo.alternatives.map(altName => {
        const altInfo = this.alternativeServices[altName];
        if (!altInfo) return null;

        const monthlySavings = currentPrice - altInfo.price;
        const yearlySavings = monthlySavings * 12;
        const savingsPercentage = ((monthlySavings / currentPrice) * 100).toFixed(1);

        return {
          name: this.formatServiceName(altName),
          price: altInfo.price,
          features: altInfo.features,
          monthlySavings: monthlySavings,
          yearlySavings: yearlySavings,
          savingsPercentage: savingsPercentage,
          rating: this.calculateServiceRating(altName),
          pros: this.getServicePros(altName),
          cons: this.getServiceCons(altName)
        };
      }).filter(alt => alt !== null);

      // Sort by savings (highest first)
      return alternatives.sort((a, b) => b.monthlySavings - a.monthlySavings);
    } catch (error) {
      console.error('Error finding alternatives:', error);
      return [];
    }
  }

  // Calculate total savings
  calculateSavings(currentPrice, alternatives) {
    try {
      if (!alternatives || alternatives.length === 0) {
        return { monthly: 0, yearly: 0, bestAlternative: null };
      }

      const bestAlternative = alternatives[0];
      return {
        monthly: bestAlternative.monthlySavings,
        yearly: bestAlternative.yearlySavings,
        bestAlternative: bestAlternative.name,
        percentage: bestAlternative.savingsPercentage
      };
    } catch (error) {
      console.error('Error calculating savings:', error);
      return { monthly: 0, yearly: 0, bestAlternative: null };
    }
  }

  // Get subscription data
  async getSubscriptionData(serviceName) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSubscriptions'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting subscription data:', chrome.runtime.lastError);
            resolve(null);
            return;
          }

          const subscriptions = result.userSubscriptions || [];
          const subscription = subscriptions.find(sub => 
            sub.serviceName.toLowerCase() === serviceName.toLowerCase()
          );
          
          resolve(subscription);
        });
      });
    } catch (error) {
      console.error('Error getting subscription data:', error);
      return null;
    }
  }

  // Track price changes over time
  async trackPriceChanges() {
    try {
      const subscriptions = await this.getAllSubscriptions();
      const priceHistory = await this.getPriceHistory();
      
      const updates = [];
      
      for (const subscription of subscriptions) {
        const serviceName = this.normalizeServiceName(subscription.serviceName);
        const currentPrice = parseFloat(subscription.monthlyCost) || 0;
        
        if (currentPrice > 0) {
          const lastPrice = priceHistory[serviceName];
          
          if (lastPrice && lastPrice.price !== currentPrice) {
            updates.push({
              service: subscription.serviceName,
              oldPrice: lastPrice.price,
              newPrice: currentPrice,
              change: currentPrice - lastPrice.price,
              changePercentage: (((currentPrice - lastPrice.price) / lastPrice.price) * 100).toFixed(1),
              date: new Date().toISOString()
            });
          }
          
          // Update price history
          priceHistory[serviceName] = {
            price: currentPrice,
            date: new Date().toISOString()
          };
        }
      }
      
      // Save updated price history
      await this.savePriceHistory(priceHistory);
      
      return updates;
    } catch (error) {
      console.error('Error tracking price changes:', error);
      return [];
    }
  }

  // Get all subscriptions
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

  // Get price history
  async getPriceHistory() {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(['priceHistory'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting price history:', chrome.runtime.lastError);
            resolve({});
            return;
          }
          resolve(result.priceHistory || {});
        });
      });
    } catch (error) {
      console.error('Error getting price history:', error);
      return {};
    }
  }

  // Save price history
  async savePriceHistory(priceHistory) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set({ priceHistory }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving price history:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error saving price history:', error);
      return false;
    }
  }

  // Get comprehensive price analysis
  async getComprehensivePriceAnalysis() {
    try {
      const subscriptions = await this.getAllSubscriptions();
      const totalCurrentSpending = subscriptions.reduce((sum, sub) => 
        sum + (parseFloat(sub.monthlyCost) || 0), 0
      );

      let totalPotentialSavings = 0;
      let recommendations = [];

      for (const subscription of subscriptions) {
        const comparison = await this.getPriceComparison(subscription.serviceName);
        
        if (comparison.success && comparison.data.savings.monthly > 0) {
          totalPotentialSavings += comparison.data.savings.monthly;
          
          recommendations.push({
            service: subscription.serviceName,
            currentPrice: parseFloat(subscription.monthlyCost) || 0,
            bestAlternative: comparison.data.savings.bestAlternative,
            monthlySavings: comparison.data.savings.monthly,
            yearlySavings: comparison.data.savings.yearly,
            alternatives: comparison.data.alternatives.slice(0, 3) // Top 3 alternatives
          });
        }
      }

      // Sort recommendations by savings
      recommendations.sort((a, b) => b.monthlySavings - a.monthlySavings);

      return {
        currentSpending: totalCurrentSpending,
        potentialSavings: totalPotentialSavings,
        savingsPercentage: totalCurrentSpending > 0 ? 
          ((totalPotentialSavings / totalCurrentSpending) * 100).toFixed(1) : 0,
        recommendations: recommendations,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting comprehensive price analysis:', error);
      return null;
    }
  }

  // Helper methods
  normalizeServiceName(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '-');
  }

  formatServiceName(name) {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  calculateServiceRating(serviceName) {
    // This would typically come from user reviews or external APIs
    const ratings = {
      'hulu': 4.2,
      'disney+': 4.5,
      'amazon-prime': 4.3,
      'apple-music': 4.4,
      'youtube-music': 4.1,
      'amazon-music': 4.0,
      'figma': 4.7,
      'canva-pro': 4.3,
      'sketch': 4.4,
      'google-workspace': 4.5,
      'libreoffice': 4.0,
      'wps-office': 4.1,
      'google-drive': 4.4,
      'onedrive': 4.2,
      'icloud': 4.1,
      'microsoft-teams': 4.3,
      'discord': 4.6,
      'telegram': 4.5,
      'google-meet': 4.3,
      'webex': 4.2,
      'obsidian': 4.6,
      'roam-research': 4.4,
      'logseq': 4.2,
      'proWritingAid': 4.3,
      'hemingway-editor': 4.1,
      'language-tool': 4.2
    };
    
    return ratings[serviceName] || 4.0;
  }

  getServicePros(serviceName) {
    const pros = {
      'hulu': ['Extensive TV show library', 'Live TV options'],
      'disney+': ['Exclusive Disney content', 'Family-friendly'],
      'amazon-prime': ['Multiple services included', 'Fast shipping'],
      'apple-music': ['High-quality audio', 'Apple ecosystem integration'],
      'youtube-music': ['Huge music library', 'YouTube integration'],
      'figma': ['Excellent collaboration', 'Browser-based'],
      'canva-pro': ['Easy to use', 'Great templates'],
      'google-workspace': ['Cloud integration', 'Real-time collaboration']
    };
    
    return pros[serviceName] || ['Good value', 'Reliable service'];
  }

  getServiceCons(serviceName) {
    const cons = {
      'hulu': ['Limited movie selection', 'Ads in basic plan'],
      'disney+': ['Limited content variety', 'No live TV'],
      'amazon-prime': ['Complex pricing', 'Interface could be better'],
      'apple-music': ['Limited free tier', 'Apple ecosystem required'],
      'youtube-music': ['Limited offline features', 'YouTube ads'],
      'figma': ['Requires internet', 'Learning curve'],
      'canva-pro': ['Limited advanced features', 'Template dependency'],
      'google-workspace': ['Privacy concerns', 'Limited offline access']
    };
    
    return cons[serviceName] || ['Limited features', 'Learning curve'];
  }

  // Start price tracking
  startPriceTracking() {
    try {
      // Track prices immediately
      this.trackPriceChanges();
      
      // Set up periodic tracking
      setInterval(() => {
        this.trackPriceChanges();
      }, this.priceTrackingInterval);
      
      console.log('Price tracking started');
    } catch (error) {
      console.error('Error starting price tracking:', error);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceComparisonManager;
} else if (typeof window !== 'undefined') {
  window.PriceComparisonManager = PriceComparisonManager;
}
