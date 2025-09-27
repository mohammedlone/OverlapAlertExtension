/**
 * Smart Subscription Detector
 * Automatically detects subscription details from pricing pages
 * Follows .cursorrules for Chrome Extension development
 */

class SubscriptionDetector {
    constructor() {
        this.detectors = [
            new ClaudeDetector(),
            new NetflixDetector(),
            new SpotifyDetector(),
            new AdobeDetector(),
            new MicrosoftDetector(),
            new GenericDetector()
        ];
    }

    /**
     * Main detection method - tries all detectors
     * @param {string} url - Current page URL
     * @param {Document} document - Page document
     * @returns {Object|null} Detected subscription data or null
     */
    detectSubscription(url, document) {
        try {
            console.log('🔍 SubscriptionDetector: Starting detection for URL:', url);
            
            for (const detector of this.detectors) {
                try {
                    if (detector.canDetect(url)) {
                        console.log(`🔍 Trying ${detector.constructor.name}...`);
                        const result = detector.detect(document);
                        if (result) {
                            console.log('✅ Subscription detected:', result);
                            return result;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error in ${detector.constructor.name}:`, error);
                }
            }
            
            console.log('❌ No subscription detected');
            return null;
        } catch (error) {
            console.error('❌ SubscriptionDetector error:', error);
            return null;
        }
    }
}

/**
 * Base detector class with common functionality
 */
class BaseDetector {
    constructor(serviceName, patterns) {
        this.serviceName = serviceName;
        this.urlPatterns = patterns;
    }

    canDetect(url) {
        return this.urlPatterns.some(pattern => {
            if (typeof pattern === 'string') {
                return url.includes(pattern);
            } else if (pattern instanceof RegExp) {
                return pattern.test(url);
            }
            return false;
        });
    }

    /**
     * Extract price from text using various patterns
     * @param {string} text - Text to extract price from
     * @returns {number|null} Price amount or null
     */
    extractPrice(text) {
        if (!text) return null;
        
        // Common price patterns: $17, $17.99, $17/month, $17 per month, etc.
        const pricePatterns = [
            /\$(\d+(?:\.\d{2})?)\s*\/\s*month/i,
            /\$(\d+(?:\.\d{2})?)\s*per\s*month/i,
            /\$(\d+(?:\.\d{2})?)\s*monthly/i,
            /\$(\d+(?:\.\d{2})?)\s*billed\s*(?:annually|monthly)/i,
            /\$(\d+(?:\.\d{2})?)(?:\s|$)/i
        ];

        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                const price = parseFloat(match[1]);
                if (!isNaN(price) && price > 0) {
                    return price;
                }
            }
        }
        
        return null;
    }

    /**
     * Extract billing period from text
     * @param {string} text - Text to analyze
     * @returns {string} Billing period (monthly, annually, etc.)
     */
    extractBillingPeriod(text) {
        if (!text) return 'monthly';
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('annually') || lowerText.includes('yearly')) {
            return 'annually';
        } else if (lowerText.includes('monthly')) {
            return 'monthly';
        }
        
        return 'monthly';
    }

    /**
     * Extract plan type from text
     * @param {string} text - Text to analyze
     * @returns {string} Plan type
     */
    extractPlanType(text) {
        if (!text) return 'Standard';
        
        const lowerText = text.toLowerCase();
        const planTypes = ['free', 'basic', 'standard', 'pro', 'premium', 'max', 'plus', 'enterprise'];
        
        for (const plan of planTypes) {
            if (lowerText.includes(plan)) {
                return plan.charAt(0).toUpperCase() + plan.slice(1);
            }
        }
        
        return 'Standard';
    }
}

/**
 * Claude AI Subscription Detector
 */
class ClaudeDetector extends BaseDetector {
    constructor() {
        super('Claude', [
            'claude.ai/upgrade',
            'claude.ai/pricing',
            'claude.ai/plans',
            /claude\.ai.*(?:upgrade|pricing|plans)/
        ]);
    }

    detect(document) {
        try {
            console.log('🔍 ClaudeDetector: Starting detection...');
            
            // First, try to find current plan information
            let currentPlanElement = this.findCurrentPlanElement(document);
            let planText = currentPlanElement ? currentPlanElement.textContent || '' : '';
            
            // If no current plan found, try to find any pricing information on the page
            if (!currentPlanElement || !planText.includes('$')) {
                console.log('🔍 ClaudeDetector: No current plan found, searching entire page...');
                const pageText = document.body.textContent || '';
                
                // Look for pricing patterns in the entire page
                if (pageText.includes('$') && (pageText.includes('Pro') || pageText.includes('Max'))) {
                    planText = pageText;
                    console.log('🔍 ClaudeDetector: Found pricing info in page text');
                }
            }

            // Extract plan details
            const price = this.extractPrice(planText);
            const billingPeriod = this.extractBillingPeriod(planText);
            const planType = this.extractPlanType(planText);

            console.log('🔍 ClaudeDetector: Extracted data:', { price, billingPeriod, planType });

            // If we found a price, proceed with detection
            if (price) {
                // Look for usage information
                const usageInfo = this.extractUsageInfo(document);

                // Look for plan features
                const features = this.extractFeatures(document);

                const result = {
                    serviceName: 'Claude',
                    category: 'AI Writing',
                    monthlyCost: price.toString(),
                    planType: planType,
                    billingPeriod: billingPeriod,
                    currentPlan: planText.toLowerCase().includes('current') || planText.toLowerCase().includes('you are'),
                    detectedFrom: 'claude_pricing_page',
                    usageInfo: usageInfo,
                    features: features,
                    lastDetected: new Date().toISOString()
                };
                
                console.log('✅ ClaudeDetector: Detection successful:', result);
                return result;
            }

            console.log('❌ ClaudeDetector: No price found in:', planText.substring(0, 200));
            return null;
        } catch (error) {
            console.error('❌ ClaudeDetector error:', error);
            return null;
        }
    }

    findCurrentPlanElement(document) {
        // Look for elements that indicate current plan
        const selectors = [
            '[data-testid*="current-plan"]',
            '[class*="current-plan"]',
            '[class*="currentPlan"]',
            '.current-plan',
            '.currentPlan',
            // Look for text patterns
            'span:contains("You are on")',
            'div:contains("current plan")',
            'p:contains("billing plan")'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (element.textContent && element.textContent.toLowerCase().includes('plan')) {
                    return element;
                }
            }
        }

        // Enhanced fallback: look for price elements and plan cards
        const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [class*="amount"]');
        for (const element of priceElements) {
            const parent = element.closest('[class*="plan"], [class*="card"], [class*="option"]');
            if (parent && (parent.textContent.toLowerCase().includes('pro') || parent.textContent.toLowerCase().includes('max'))) {
                return parent;
            }
        }

        // Additional fallback: look for any element containing pricing information
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent || '';
            if (text.includes('$') && (text.includes('month') || text.includes('billed')) && 
                (text.includes('Pro') || text.includes('Max') || text.includes('Claude'))) {
                return element;
            }
        }

        return null;
    }

    extractUsageInfo(document) {
        // Look for usage information
        const usageSelectors = [
            '[class*="usage"]',
            '[class*="times"]',
            'span:contains("times")',
            'div:contains("used")'
        ];

        for (const selector of usageSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent || '';
                const usageMatch = text.match(/(\d+)\s*times?/i);
                if (usageMatch) {
                    return {
                        usageCount: parseInt(usageMatch[1]),
                        text: text.trim()
                    };
                }
            }
        }

        return null;
    }

    extractFeatures(document) {
        const features = [];
        
        // Look for feature lists
        const featureSelectors = [
            '[class*="feature"]',
            '[class*="benefit"]',
            'ul li',
            'ol li'
        ];

        for (const selector of featureSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent?.trim();
                if (text && text.length > 10 && text.length < 100) {
                    // Check if it looks like a feature
                    if (text.includes('AI') || text.includes('writing') || text.includes('analysis') || 
                        text.includes('code') || text.includes('research') || text.includes('thinking')) {
                        features.push(text);
                    }
                }
            }
        }

        return features.slice(0, 5); // Limit to 5 features
    }
}

/**
 * Netflix Subscription Detector
 */
class NetflixDetector extends BaseDetector {
    constructor() {
        super('Netflix', [
            'netflix.com/signup',
            'netflix.com/planform',
            'netflix.com/pricing',
            /netflix\.com.*(?:plan|pricing|signup)/
        ]);
    }

    detect(document) {
        try {
            // Look for Netflix plan information
            const planElements = document.querySelectorAll('[class*="plan"], [data-testid*="plan"]');
            
            for (const element of planElements) {
                const text = element.textContent || '';
                const price = this.extractPrice(text);
                
                if (price && (text.includes('Standard') || text.includes('Premium') || text.includes('Basic'))) {
                    return {
                        serviceName: 'Netflix',
                        category: 'Entertainment',
                        monthlyCost: price.toString(),
                        planType: this.extractPlanType(text),
                        billingPeriod: this.extractBillingPeriod(text),
                        currentPlan: text.includes('current') || text.includes('selected'),
                        detectedFrom: 'netflix_pricing_page',
                        lastDetected: new Date().toISOString()
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('NetflixDetector error:', error);
            return null;
        }
    }
}

/**
 * Spotify Subscription Detector
 */
class SpotifyDetector extends BaseDetector {
    constructor() {
        super('Spotify', [
            'spotify.com/premium',
            'spotify.com/upgrade',
            'spotify.com/pricing',
            /spotify\.com.*(?:premium|upgrade|pricing)/
        ]);
    }

    detect(document) {
        try {
            // Look for Spotify Premium information
            const premiumElements = document.querySelectorAll('[class*="premium"], [class*="plan"]');
            
            for (const element of premiumElements) {
                const text = element.textContent || '';
                const price = this.extractPrice(text);
                
                if (price && (text.includes('Premium') || text.includes('Individual') || text.includes('Family'))) {
                    return {
                        serviceName: 'Spotify Premium',
                        category: 'Entertainment',
                        monthlyCost: price.toString(),
                        planType: this.extractPlanType(text),
                        billingPeriod: this.extractBillingPeriod(text),
                        currentPlan: text.includes('current') || text.includes('selected'),
                        detectedFrom: 'spotify_pricing_page',
                        lastDetected: new Date().toISOString()
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('SpotifyDetector error:', error);
            return null;
        }
    }
}

/**
 * Adobe Subscription Detector
 */
class AdobeDetector extends BaseDetector {
    constructor() {
        super('Adobe Creative Cloud', [
            'adobe.com/products/creativecloud',
            'adobe.com/creativecloud/plans',
            'adobe.com/products/photoshop',
            /adobe\.com.*(?:creativecloud|plans|products)/
        ]);
    }

    detect(document) {
        // Implementation for Adobe detection
        return null; // Placeholder
    }
}

/**
 * Microsoft 365 Subscription Detector
 */
class MicrosoftDetector extends BaseDetector {
    constructor() {
        super('Microsoft 365', [
            'microsoft.com/microsoft-365',
            'office.com/microsoft-365',
            'microsoft.com/office',
            /(?:microsoft|office)\.com.*(?:365|office)/
        ]);
    }

    detect(document) {
        // Implementation for Microsoft detection
        return null; // Placeholder
    }
}

/**
 * Generic Detector for unknown services - Works on ANY website
 */
class GenericDetector extends BaseDetector {
    constructor() {
        super('Generic', [
            // This will match any URL that might be a pricing page
            /.*(?:pricing|plans|upgrade|subscription|billing|cost|price).*/
        ]);
    }

    detect(document) {
        console.log('🔍 GenericDetector: Analyzing page for subscription data...');
        
        // Enhanced detection logic for any website
        const detectionResults = [];
        
        // 1. Look for pricing cards/sections
        const pricingCards = this.findPricingCards(document);
        detectionResults.push(...pricingCards);
        
        // 2. Look for subscription tables
        const subscriptionTables = this.findSubscriptionTables(document);
        detectionResults.push(...subscriptionTables);
        
        // 3. Look for plan comparisons
        const planComparisons = this.findPlanComparisons(document);
        detectionResults.push(...planComparisons);
        
        // 4. Look for current plan indicators
        const currentPlans = this.findCurrentPlans(document);
        detectionResults.push(...currentPlans);
        
        // Return the best match
        if (detectionResults.length > 0) {
            const bestMatch = detectionResults[0]; // First match is usually the most relevant
            console.log('✅ GenericDetector: Found subscription data:', bestMatch);
            return bestMatch;
        }
        
        console.log('❌ GenericDetector: No subscription data found');
        return null;
    }

    findPricingCards(document) {
        const results = [];
        
        // Look for common pricing card selectors
        const cardSelectors = [
            '[class*="plan"]',
            '[class*="pricing"]',
            '[class*="subscription"]',
            '[class*="tier"]',
            '[data-testid*="plan"]',
            '[data-testid*="pricing"]',
            '.plan-card',
            '.pricing-card',
            '.subscription-card',
            '.tier-card'
        ];
        
        for (const selector of cardSelectors) {
            const cards = document.querySelectorAll(selector);
            for (const card of cards) {
                const result = this.extractFromCard(card);
                if (result) results.push(result);
            }
        }
        
        return results;
    }

    findSubscriptionTables(document) {
        const results = [];
        
        // Look for pricing tables
        const tables = document.querySelectorAll('table');
        for (const table of tables) {
            const result = this.extractFromTable(table);
            if (result) results.push(result);
        }
        
        return results;
    }

    findPlanComparisons(document) {
        const results = [];
        
        // Look for plan comparison sections
        const comparisonSelectors = [
            '[class*="comparison"]',
            '[class*="compare"]',
            '.plan-comparison',
            '.pricing-comparison'
        ];
        
        for (const selector of comparisonSelectors) {
            const sections = document.querySelectorAll(selector);
            for (const section of sections) {
                const result = this.extractFromComparison(section);
                if (result) results.push(result);
            }
        }
        
        return results;
    }

    findCurrentPlans(document) {
        const results = [];
        
        // Look for current plan indicators
        const currentPlanSelectors = [
            '[class*="current"]',
            '[class*="active"]',
            '[class*="selected"]',
            '.current-plan',
            '.active-plan',
            '.selected-plan'
        ];
        
        for (const selector of currentPlanSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const result = this.extractFromCurrentPlan(element);
                if (result) {
                    result.currentPlan = true;
                    results.push(result);
                }
            }
        }
        
        return results;
    }

    extractFromCard(card) {
        const text = card.textContent || '';
        const price = this.extractPrice(text);
        const planType = this.extractPlanType(text);
        const billingPeriod = this.extractBillingPeriod(text);
        
        if (price) {
            return {
                serviceName: this.extractServiceName(document),
                category: this.categorizeService(text),
                monthlyCost: price.toString(),
                planType: planType,
                billingPeriod: billingPeriod,
                currentPlan: false,
                detectedFrom: 'generic_pricing_card',
                features: this.extractFeaturesFromText(text),
                lastDetected: new Date().toISOString()
            };
        }
        
        return null;
    }

    extractFromTable(table) {
        const rows = table.querySelectorAll('tr');
        for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            for (const cell of cells) {
                const text = cell.textContent || '';
                const price = this.extractPrice(text);
                if (price) {
                    return {
                        serviceName: this.extractServiceName(document),
                        category: this.categorizeService(text),
                        monthlyCost: price.toString(),
                        planType: this.extractPlanType(text),
                        billingPeriod: this.extractBillingPeriod(text),
                        currentPlan: false,
                        detectedFrom: 'generic_pricing_table',
                        lastDetected: new Date().toISOString()
                    };
                }
            }
        }
        return null;
    }

    extractFromComparison(comparison) {
        const text = comparison.textContent || '';
        const price = this.extractPrice(text);
        
        if (price) {
            return {
                serviceName: this.extractServiceName(document),
                category: this.categorizeService(text),
                monthlyCost: price.toString(),
                planType: this.extractPlanType(text),
                billingPeriod: this.extractBillingPeriod(text),
                currentPlan: false,
                detectedFrom: 'generic_plan_comparison',
                features: this.extractFeaturesFromText(text),
                lastDetected: new Date().toISOString()
            };
        }
        
        return null;
    }

    extractFromCurrentPlan(element) {
        const text = element.textContent || '';
        const price = this.extractPrice(text);
        
        if (price) {
            return {
                serviceName: this.extractServiceName(document),
                category: this.categorizeService(text),
                monthlyCost: price.toString(),
                planType: this.extractPlanType(text),
                billingPeriod: this.extractBillingPeriod(text),
                currentPlan: true,
                detectedFrom: 'generic_current_plan',
                lastDetected: new Date().toISOString()
            };
        }
        
        return null;
    }

    categorizeService(text) {
        const lowerText = text.toLowerCase();
        
        // AI/ML Services
        if (lowerText.includes('ai') || lowerText.includes('artificial intelligence') || 
            lowerText.includes('machine learning') || lowerText.includes('gpt') || 
            lowerText.includes('claude') || lowerText.includes('chatbot')) {
            return 'AI Writing';
        }
        
        // Entertainment
        if (lowerText.includes('streaming') || lowerText.includes('video') || 
            lowerText.includes('movie') || lowerText.includes('tv') || 
            lowerText.includes('music') || lowerText.includes('podcast')) {
            return 'Entertainment';
        }
        
        // Productivity
        if (lowerText.includes('office') || lowerText.includes('productivity') || 
            lowerText.includes('collaboration') || lowerText.includes('workspace')) {
            return 'Productivity';
        }
        
        // Design
        if (lowerText.includes('design') || lowerText.includes('creative') || 
            lowerText.includes('photo') || lowerText.includes('video editing')) {
            return 'Design';
        }
        
        // Development
        if (lowerText.includes('code') || lowerText.includes('development') || 
            lowerText.includes('programming') || lowerText.includes('github')) {
            return 'Development';
        }
        
        // Analytics
        if (lowerText.includes('analytics') || lowerText.includes('data') || 
            lowerText.includes('tracking') || lowerText.includes('metrics')) {
            return 'Analytics';
        }
        
        return 'Other';
    }

    extractFeaturesFromText(text) {
        const features = [];
        const sentences = text.split(/[.!?]/);
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 10 && trimmed.length < 100) {
                // Look for feature-like text
                if (trimmed.includes('unlimited') || trimmed.includes('access') || 
                    trimmed.includes('includes') || trimmed.includes('features') ||
                    trimmed.includes('storage') || trimmed.includes('users')) {
                    features.push(trimmed);
                }
            }
        }
        
        return features.slice(0, 5); // Limit to 5 features
    }

    extractServiceName(document) {
        // Try multiple methods to get service name
        const methods = [
            () => document.title?.split(' - ')[0]?.split(' | ')[0],
            () => document.querySelector('h1')?.textContent?.trim(),
            () => document.querySelector('[class*="logo"]')?.textContent?.trim(),
            () => document.querySelector('[class*="brand"]')?.textContent?.trim(),
            () => window.location.hostname.replace('www.', '').split('.')[0]
        ];
        
        for (const method of methods) {
            try {
                const name = method();
                if (name && name.length > 2 && name.length < 50) {
                    return name.replace(/pricing|plans|upgrade|subscription|billing/gi, '').trim();
                }
            } catch (error) {
                continue;
            }
        }
        
        return 'Unknown Service';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionDetector;
}
