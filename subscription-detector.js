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
            // Look for current plan information
            const currentPlanElement = this.findCurrentPlanElement(document);
            if (!currentPlanElement) return null;

            // Extract plan details
            const planText = currentPlanElement.textContent || '';
            const price = this.extractPrice(planText);
            const billingPeriod = this.extractBillingPeriod(planText);
            const planType = this.extractPlanType(planText);

            // Look for usage information
            const usageInfo = this.extractUsageInfo(document);

            // Look for plan features
            const features = this.extractFeatures(document);

            return {
                serviceName: 'Claude',
                category: 'AI Writing',
                monthlyCost: price ? price.toString() : null,
                planType: planType,
                billingPeriod: billingPeriod,
                currentPlan: true,
                detectedFrom: 'pricing_page',
                usageInfo: usageInfo,
                features: features,
                lastDetected: new Date().toISOString()
            };
        } catch (error) {
            console.error('ClaudeDetector error:', error);
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

        // Fallback: look for price elements near plan indicators
        const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [class*="amount"]');
        for (const element of priceElements) {
            const parent = element.closest('[class*="plan"], [class*="card"], [class*="option"]');
            if (parent && parent.textContent.toLowerCase().includes('pro') || parent.textContent.toLowerCase().includes('max')) {
                return parent;
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
        // Implementation for Netflix detection
        // This would parse Netflix pricing pages
        return null; // Placeholder
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
        // Implementation for Spotify detection
        return null; // Placeholder
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
 * Generic Detector for unknown services
 */
class GenericDetector extends BaseDetector {
    constructor() {
        super('Generic', [
            // This will match any URL that might be a pricing page
            /.*(?:pricing|plans|upgrade|subscription|billing).*/
        ]);
    }

    detect(document) {
        // Generic detection logic for unknown services
        // Look for common pricing patterns
        const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [data-testid*="price"]');
        
        if (priceElements.length > 0) {
            // Try to extract service name from page title or headings
            const serviceName = this.extractServiceName(document);
            const price = this.extractPrice(priceElements[0].textContent);
            
            if (serviceName && price) {
                return {
                    serviceName: serviceName,
                    category: 'Other',
                    monthlyCost: price.toString(),
                    planType: 'Standard',
                    billingPeriod: 'monthly',
                    currentPlan: false,
                    detectedFrom: 'generic_pricing_page',
                    lastDetected: new Date().toISOString()
                };
            }
        }
        
        return null;
    }

    extractServiceName(document) {
        // Try to get service name from title or main heading
        const title = document.title || '';
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        
        const text = h1?.textContent || h2?.textContent || title;
        if (text) {
            // Clean up the text to get service name
            return text.replace(/pricing|plans|upgrade|subscription/gi, '').trim().split(' ')[0];
        }
        
        return 'Unknown Service';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionDetector;
}
