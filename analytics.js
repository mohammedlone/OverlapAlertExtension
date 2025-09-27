// Advanced Analytics System for OverlapAlert Premium
class AnalyticsManager {
  constructor() {
    this.analyticsData = {
      spending: {
        totalMonthly: 0,
        totalYearly: 0,
        byCategory: {},
        trends: []
      },
      usage: {
        totalVisits: 0,
        mostUsed: [],
        leastUsed: [],
        patterns: {}
      },
      insights: {
        duplicates: [],
        recommendations: [],
        savings: 0
      }
    };
  }

  // Calculate spending analytics
  async calculateSpendingAnalytics(subscriptions) {
    try {
      const spending = {
        totalMonthly: 0,
        totalYearly: 0,
        byCategory: {},
        trends: []
      };

      subscriptions.forEach(sub => {
        const cost = parseFloat(sub.monthlyCost) || 0;
        spending.totalMonthly += cost;
        spending.totalYearly += cost * 12;

        // Category breakdown
        if (!spending.byCategory[sub.category]) {
          spending.byCategory[sub.category] = 0;
        }
        spending.byCategory[sub.category] += cost;
      });

      // Calculate trends (last 6 months)
      const trends = await this.calculateSpendingTrends(subscriptions);
      spending.trends = trends;

      return spending;
    } catch (error) {
      console.error('Error calculating spending analytics:', error);
      return null;
    }
  }

  // Calculate usage analytics
  async calculateUsageAnalytics(subscriptions) {
    try {
      const usage = {
        totalVisits: 0,
        mostUsed: [],
        leastUsed: [],
        patterns: {}
      };

      subscriptions.forEach(sub => {
        const visitCount = sub.usageCount || 0;
        usage.totalVisits += visitCount;

        // Sort by usage
        if (visitCount > 0) {
          usage.mostUsed.push({
            name: sub.serviceName,
            category: sub.category,
            visits: visitCount,
            lastUsed: sub.lastUsed
          });
        } else {
          usage.leastUsed.push({
            name: sub.serviceName,
            category: sub.category,
            cost: sub.monthlyCost || 0
          });
        }
      });

      // Sort by usage
      usage.mostUsed.sort((a, b) => b.visits - a.visits);
      usage.leastUsed.sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));

      // Calculate usage patterns
      usage.patterns = await this.calculateUsagePatterns(subscriptions);

      return usage;
    } catch (error) {
      console.error('Error calculating usage analytics:', error);
      return null;
    }
  }

  // Generate insights and recommendations
  async generateInsights(subscriptions, spending, usage) {
    try {
      const insights = {
        duplicates: [],
        recommendations: [],
        savings: 0
      };

      // Find potential duplicates
      insights.duplicates = this.findDuplicateServices(subscriptions);

      // Generate recommendations
      insights.recommendations = this.generateRecommendations(subscriptions, spending, usage);

      // Calculate potential savings
      insights.savings = this.calculatePotentialSavings(subscriptions, insights.duplicates);

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return null;
    }
  }

  // Find duplicate services
  findDuplicateServices(subscriptions) {
    const duplicates = [];
    const serviceMap = {};

    subscriptions.forEach(sub => {
      const key = sub.serviceName.toLowerCase();
      if (!serviceMap[key]) {
        serviceMap[key] = [];
      }
      serviceMap[key].push(sub);
    });

    Object.values(serviceMap).forEach(group => {
      if (group.length > 1) {
        duplicates.push({
          serviceName: group[0].serviceName,
          count: group.length,
          subscriptions: group,
          totalCost: group.reduce((sum, sub) => sum + (parseFloat(sub.monthlyCost) || 0), 0)
        });
      }
    });

    return duplicates;
  }

  // Generate recommendations
  generateRecommendations(subscriptions, spending, usage) {
    const recommendations = [];

    // Unused subscription recommendations
    usage.leastUsed.forEach(sub => {
      if (parseFloat(sub.cost) > 0) {
        recommendations.push({
          type: 'unused_subscription',
          priority: 'high',
          title: 'Unused Subscription Detected',
          message: `${sub.name} costs $${sub.cost}/month but hasn't been used. Consider canceling to save money.`,
          savings: parseFloat(sub.cost) * 12,
          action: 'cancel_subscription'
        });
      }
    });

    // High spending recommendations
    if (spending.totalMonthly > 100) {
      recommendations.push({
        type: 'high_spending',
        priority: 'medium',
        title: 'High Monthly Spending',
        message: `You're spending $${spending.totalMonthly.toFixed(2)}/month on subscriptions. Consider reviewing your subscriptions.`,
        savings: spending.totalMonthly * 0.2, // 20% potential savings
        action: 'review_spending'
      });
    }

    // Category spending recommendations
    Object.entries(spending.byCategory).forEach(([category, amount]) => {
      if (amount > 50) {
        recommendations.push({
          type: 'category_spending',
          priority: 'medium',
          title: `High ${category} Spending`,
          message: `You're spending $${amount.toFixed(2)}/month on ${category} services. Consider consolidating.`,
          savings: amount * 0.15, // 15% potential savings
          action: 'consolidate_category'
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Calculate potential savings
  calculatePotentialSavings(subscriptions, duplicates) {
    let savings = 0;

    // Savings from duplicates
    duplicates.forEach(duplicate => {
      // Assume we can cancel all but one
      const duplicateCount = duplicate.count - 1;
      savings += duplicate.subscriptions.slice(0, duplicateCount).reduce((sum, sub) => {
        return sum + (parseFloat(sub.monthlyCost) || 0) * 12;
      }, 0);
    });

    // Savings from unused subscriptions
    const unusedSubscriptions = subscriptions.filter(sub => 
      (sub.usageCount || 0) === 0 && parseFloat(sub.monthlyCost || 0) > 0
    );
    
    unusedSubscriptions.forEach(sub => {
      savings += parseFloat(sub.monthlyCost) * 12;
    });

    return savings;
  }

  // Calculate spending trends
  async calculateSpendingTrends(subscriptions) {
    try {
      // This would typically analyze historical data
      // For now, we'll create a simple trend based on current data
      const currentSpending = subscriptions.reduce((sum, sub) => 
        sum + (parseFloat(sub.monthlyCost) || 0), 0
      );

      // Simulate 6 months of trends
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Simulate some variation
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const amount = currentSpending * (1 + variation);
        
        trends.push({
          month: date.toISOString().substring(0, 7),
          amount: Math.max(0, amount)
        });
      }

      return trends;
    } catch (error) {
      console.error('Error calculating spending trends:', error);
      return [];
    }
  }

  // Calculate usage patterns
  async calculateUsagePatterns(subscriptions) {
    try {
      const patterns = {
        peakHours: {},
        peakDays: {},
        seasonalTrends: {}
      };

      // This would analyze actual usage data
      // For now, we'll create sample patterns
      const now = new Date();
      const currentHour = now.getHours();
      
      // Simulate peak usage hours (9 AM - 5 PM)
      for (let hour = 0; hour < 24; hour++) {
        if (hour >= 9 && hour <= 17) {
          patterns.peakHours[hour] = Math.random() * 0.8 + 0.2; // 20-100%
        } else {
          patterns.peakHours[hour] = Math.random() * 0.3; // 0-30%
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error calculating usage patterns:', error);
      return {};
    }
  }

  // Get comprehensive analytics
  async getComprehensiveAnalytics() {
    try {
      const subscriptions = await this.getSubscriptions();
      
      const spending = await this.calculateSpendingAnalytics(subscriptions);
      const usage = await this.calculateUsageAnalytics(subscriptions);
      const insights = await this.generateInsights(subscriptions, spending, usage);

      return {
        spending,
        usage,
        insights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      return null;
    }
  }

  // Get subscriptions from storage
  async getSubscriptions() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userSubscriptions'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting subscriptions for analytics:', chrome.runtime.lastError);
          resolve([]);
          return;
        }
        resolve(result.userSubscriptions || []);
      });
    });
  }

  // Export analytics data
  exportAnalytics(analytics) {
    try {
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `overlap-alert-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsManager;
} else if (typeof window !== 'undefined') {
  window.AnalyticsManager = AnalyticsManager;
}
