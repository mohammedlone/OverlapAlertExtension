// Popup JavaScript for OverlapAlert extension
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize popup
        init();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load data
        loadData();
    } catch (error) {
        console.error('Error initializing popup:', error);
        showUserFriendlyError('Failed to initialize extension. Please reload the page.');
    }
});

function init() {
    console.log('OverlapAlert popup initialized');
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', clearData);
    
    // Settings toggles
    document.getElementById('warningsToggle').addEventListener('click', toggleSetting);
    document.getElementById('trackingToggle').addEventListener('click', toggleSetting);
    
    // Add subscription button
    document.getElementById('addSubscriptionBtn').addEventListener('click', showAddSubscriptionModal);
    
    // Modal controls
    document.getElementById('closeModalBtn').addEventListener('click', hideAddSubscriptionModal);
    document.getElementById('cancelAddBtn').addEventListener('click', hideAddSubscriptionModal);
    document.getElementById('saveSubscriptionBtn').addEventListener('click', saveSubscription);
    
    // Close modal when clicking outside
    document.getElementById('addSubscriptionModal').addEventListener('click', (e) => {
        if (e.target.id === 'addSubscriptionModal') {
            hideAddSubscriptionModal();
        }
    });
    
    // Event delegation for remove buttons
    document.getElementById('subscriptionList').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            const serviceName = e.target.getAttribute('data-service');
            const category = e.target.getAttribute('data-category');
            removeSubscription(serviceName, category);
        }
    });
}

async function loadData() {
    try {
        // Show loading state
        showLoading();
        
        // Get user subscriptions
        const subscriptions = await getSubscriptions();
        
        // Get settings
        const settings = await getSettings();
        
        // Update UI
        updateStats(subscriptions);
        updateSubscriptionList(subscriptions);
        updateSettings(settings);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data');
    }
}

async function getSubscriptions() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getUserSubscriptions' }, (response) => {
            resolve(response.subscriptions || []);
        });
    });
}

async function getSettings() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
            resolve(response.settings || {});
        });
    });
}

function updateStats(subscriptions) {
    const totalSubscriptions = subscriptions.length;
    const totalUsage = subscriptions.reduce((sum, sub) => sum + (sub.usageCount || 0), 0);
    
    document.getElementById('totalSubscriptions').textContent = totalSubscriptions;
    document.getElementById('totalUsage').textContent = totalUsage;
    
    // Add premium features section
    addPremiumFeaturesSection();
}

function addPremiumFeaturesSection() {
    // Check if premium section already exists
    if (document.getElementById('premium-features-section')) {
        return;
    }
    
    const premiumSection = document.createElement('div');
    premiumSection.id = 'premium-features-section';
            premiumSection.style.cssText = `
                margin-top: 24px;
                padding: 24px;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                border-radius: 12px;
                color: #1a1a1a;
                min-height: 280px;
            `;

    premiumSection.innerHTML = `
        <h3 style="margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center; gap: 8px;">
            <span>⚡</span>
            Premium Features
        </h3>
        
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <button class="premium-feature-btn" data-feature="analytics" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                padding: 12px;
                border-radius: 8px;
                color: #1a1a1a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">📊 Analytics</button>
            
            <button class="premium-feature-btn" data-feature="cloud-sync" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                padding: 12px;
                border-radius: 8px;
                color: #1a1a1a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">☁️ Cloud Sync</button>
            
            <button class="premium-feature-btn" data-feature="export" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                padding: 12px;
                border-radius: 8px;
                color: #1a1a1a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">📤 Export/Import</button>
            
            <button class="premium-feature-btn" data-feature="price-compare" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                padding: 12px;
                border-radius: 8px;
                color: #1a1a1a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">💰 Price Compare</button>
            
            <button class="premium-feature-btn" data-feature="reminders" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                padding: 12px;
                border-radius: 8px;
                color: #1a1a1a;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            ">🔔 Reminders</button>
            
            <button class="premium-feature-btn" data-feature="bulk-manage" style="
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
        
        <div style="margin-top: 16px; text-align: center;">
            <button class="free-trial-btn" style="
                background: #1a1a1a;
                color: #FFD700;
                border: 2px solid #FFD700;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">Start 14-Day Free Trial</button>
        </div>
    `;

    // Add to the popup content
    const content = document.querySelector('.popup-content');
    if (content) {
        content.appendChild(premiumSection);
        
        // Add event listeners for premium feature buttons
        const premiumButtons = premiumSection.querySelectorAll('.premium-feature-btn');
        premiumButtons.forEach(button => {
            button.addEventListener('click', function() {
                const feature = this.getAttribute('data-feature');
                console.log('Premium feature clicked:', feature);
                showPremiumFeature(feature);
            });
        });
        
        // Add event listener for free trial button
        const freeTrialBtn = premiumSection.querySelector('.free-trial-btn');
        if (freeTrialBtn) {
            freeTrialBtn.addEventListener('click', function() {
                console.log('Free trial button clicked');
                startFreeTrial();
            });
        }
    }
}

// Global functions for premium features
function showPremiumFeature(feature) {
    console.log('Opening premium feature:', feature);
    
    switch(feature) {
        case 'analytics':
            showAnalyticsDashboard();
            break;
        case 'cloud-sync':
            showCloudSyncInterface();
            break;
        case 'export':
            showExportInterface();
            break;
        case 'price-compare':
            showPriceComparisonInterface();
            break;
        case 'reminders':
            showRemindersInterface();
            break;
        case 'bulk-manage':
            showBulkManagementInterface();
            break;
        default:
            showNotification('Premium feature coming soon!', 'info');
    }
}

function showAnalyticsDashboard() {
    // Get real subscription data
    chrome.storage.local.get(['userSubscriptions'], (result) => {
        const subscriptions = result.userSubscriptions || [];
        
        // Calculate real analytics data
        const monthlySpend = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.monthlyCost) || 0), 0);
        const activeServices = subscriptions.length;
        const avgPerService = activeServices > 0 ? (monthlySpend / activeServices).toFixed(2) : 0;
        
        // Generate real insights based on actual data
        const insights = generateRealInsights(subscriptions);
        
        // Create analytics modal with real data
        const modal = createModal('📊 Advanced Analytics', `
            <div class="analytics-dashboard">
                <div class="analytics-summary">
                    <div class="analytics-card">
                        <div class="analytics-number">$${monthlySpend.toFixed(2)}</div>
                        <div class="analytics-label">Monthly Spend</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-number">${activeServices}</div>
                        <div class="analytics-label">Active Services</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-number">$${avgPerService}</div>
                        <div class="analytics-label">Avg. per Service</div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>📊 Category Breakdown</h4>
                    <div class="category-chart">
                        ${generateCategoryChart(subscriptions)}
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>💡 Smart Insights</h4>
                    <div class="insights-list">
                        ${insights.map(insight => `
                            <div class="insight-item">
                                <span class="insight-icon">${insight.icon}</span>
                                <span class="insight-text">${insight.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>📋 Top Services</h4>
                    <div class="top-services">
                        ${generateTopServices(subscriptions)}
                    </div>
                </div>
            </div>
        `);
        
        // Add analytics-specific styles
        addModalStyles(`
            .analytics-dashboard { padding: 20px; }
            .analytics-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .analytics-card { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
            .analytics-number { font-size: 24px; font-weight: bold; color: #FFD700; margin-bottom: 4px; }
            .analytics-label { font-size: 12px; color: #6c757d; }
            .analytics-section { margin-bottom: 24px; }
            .analytics-section h4 { margin: 0 0 12px 0; color: #1a1a1a; }
            .category-chart { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .category-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px; }
            .category-name { font-weight: 500; }
            .category-amount { color: #FFD700; font-weight: bold; }
            .insights-list { background: #f8f9fa; padding: 16px; border-radius: 8px; }
            .insight-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px; }
            .insight-item:last-child { margin-bottom: 0; }
            .insight-icon { font-size: 18px; }
            .insight-text { font-size: 14px; color: #1a1a1a; }
            .top-services { background: #f8f9fa; padding: 16px; border-radius: 8px; }
            .service-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; }
            .service-name { font-weight: 500; }
            .service-cost { color: #dc3545; font-weight: bold; }
        `);
    });
}

function generateRealInsights(subscriptions) {
    const insights = [];
    const monthlySpend = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.monthlyCost) || 0), 0);
    const categories = {};
    
    // Count categories
    subscriptions.forEach(sub => {
        categories[sub.category] = (categories[sub.category] || 0) + (parseFloat(sub.monthlyCost) || 0);
    });
    
    // Generate insights based on real data
    if (monthlySpend > 50) {
        insights.push({
            icon: '💰',
            text: `You're spending $${monthlySpend.toFixed(2)}/month on subscriptions - consider annual plans for savings`
        });
    }
    
    if (Object.keys(categories).length > 3) {
        insights.push({
            icon: '📊',
            text: `You have subscriptions in ${Object.keys(categories).length} different categories`
        });
    }
    
    const expensiveServices = subscriptions.filter(sub => parseFloat(sub.monthlyCost) > 20);
    if (expensiveServices.length > 0) {
        insights.push({
            icon: '⚠️',
            text: `Your most expensive service is ${expensiveServices[0].serviceName} at $${expensiveServices[0].monthlyCost}/month`
        });
    }
    
    if (subscriptions.length > 5) {
        insights.push({
            icon: '🔍',
            text: `You have ${subscriptions.length} active subscriptions - consider reviewing for overlaps`
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: '✅',
            text: 'Great job managing your subscriptions! Keep tracking your spending.'
        });
    }
    
    return insights;
}

function generateCategoryChart(subscriptions) {
    const categories = {};
    subscriptions.forEach(sub => {
        const cost = parseFloat(sub.monthlyCost) || 0;
        categories[sub.category] = (categories[sub.category] || 0) + cost;
    });
    
    const totalSpend = Object.values(categories).reduce((sum, cost) => sum + cost, 0);
    
    return Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `
            <div class="category-item">
                <span class="category-name">${category}</span>
                <span class="category-amount">$${amount.toFixed(2)}</span>
            </div>
        `).join('');
}

function generateTopServices(subscriptions) {
    return subscriptions
        .filter(sub => parseFloat(sub.monthlyCost) > 0)
        .sort((a, b) => parseFloat(b.monthlyCost) - parseFloat(a.monthlyCost))
        .slice(0, 5)
        .map(sub => `
            <div class="service-item">
                <span class="service-name">${sub.serviceName}</span>
                <span class="service-cost">$${sub.monthlyCost}/month</span>
            </div>
        `).join('');
}

function createModal(title, content) {
    // Remove existing modals
    document.querySelectorAll('.premium-modal').forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'premium-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        ">
            <div class="modal-header" style="
                padding: 20px 24px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: #1a1a1a;
                border-radius: 12px 12px 0 0;
            ">
                <h3 style="margin: 0; font-size: 18px; font-weight: bold;">${title}</h3>
                <button class="modal-close" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #1a1a1a;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                ">&times;</button>
            </div>
            <div class="modal-body" style="padding: 0;">
                ${content}
            </div>
        </div>
    `;
    
    // Add close functionality
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Add event listeners for all close buttons
    modal.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });
    
    document.body.appendChild(modal);
    return modal;
}

function addModalStyles(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

// Placeholder functions for other premium features
function showCloudSyncInterface() {
    const modal = createModal('☁️ Cloud Sync', `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">☁️</div>
            <h4>Cloud Sync Coming Soon!</h4>
            <p>Sync your subscriptions across all your devices</p>
            <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `);
}

function showExportInterface() {
    // Get real subscription data
    chrome.storage.local.get(['userSubscriptions'], (result) => {
        const subscriptions = result.userSubscriptions || [];
        
        const modal = createModal('📤 Export/Import', `
            <div class="export-interface">
                <div class="export-section">
                    <h4>📤 Export Data</h4>
                    <p>Download your ${subscriptions.length} subscription${subscriptions.length !== 1 ? 's' : ''} in various formats</p>
                    <div class="export-options">
                        <button class="export-btn" data-format="json">
                            <span class="export-icon">📄</span>
                            <span>JSON Format</span>
                            <small>Complete data backup</small>
                        </button>
                        <button class="export-btn" data-format="csv">
                            <span class="export-icon">📊</span>
                            <span>CSV Format</span>
                            <small>Spreadsheet compatible</small>
                        </button>
                        <button class="export-btn" data-format="pdf">
                            <span class="export-icon">📋</span>
                            <span>PDF Report</span>
                            <small>Printable summary</small>
                        </button>
                    </div>
                </div>
                
                <div class="import-section">
                    <h4>📥 Import Data</h4>
                    <p>Restore your data from a previous backup</p>
                    <div class="import-zone">
                        <div class="import-drop">
                            <span class="import-icon">📁</span>
                            <span>Drag & drop files here</span>
                            <small>or click to browse</small>
                        </div>
                    </div>
                </div>
                
                <div class="data-summary">
                    <h4>📊 Your Data Summary</h4>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-number">${subscriptions.length}</span>
                            <span class="stat-label">Subscriptions</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">$${subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.monthlyCost) || 0), 0).toFixed(2)}</span>
                            <span class="stat-label">Monthly Total</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${new Set(subscriptions.map(sub => sub.category)).size}</span>
                            <span class="stat-label">Categories</span>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // Add event listeners for export buttons
        modal.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const format = this.getAttribute('data-format');
                exportData(subscriptions, format);
            });
        });
        
        // Add import functionality
        const importZone = modal.querySelector('.import-drop');
        importZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.csv';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    importData(file);
                }
            });
            input.click();
        });
        
        // Add export-specific styles
        addModalStyles(`
            .export-interface { padding: 20px; }
            .export-section, .import-section, .data-summary { margin-bottom: 24px; }
            .export-section h4, .import-section h4, .data-summary h4 { margin: 0 0 8px 0; color: #1a1a1a; }
            .export-section p, .import-section p { margin: 0 0 16px 0; color: #6c757d; font-size: 14px; }
            .export-options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            .export-btn { display: flex; flex-direction: column; align-items: center; padding: 16px; border: 2px solid #e9ecef; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; }
            .export-btn:hover { border-color: #FFD700; background: #fffbf0; }
            .export-icon { font-size: 24px; margin-bottom: 8px; }
            .export-btn span:not(.export-icon) { font-weight: bold; margin-bottom: 4px; }
            .export-btn small { font-size: 12px; color: #6c757d; }
            .import-zone { border: 2px dashed #e9ecef; border-radius: 8px; padding: 40px; text-align: center; background: #f8f9fa; cursor: pointer; }
            .import-drop { display: flex; flex-direction: column; align-items: center; gap: 8px; }
            .import-icon { font-size: 32px; }
            .summary-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
            .stat-item { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
            .stat-number { display: block; font-size: 24px; font-weight: bold; color: #FFD700; margin-bottom: 4px; }
            .stat-label { font-size: 12px; color: #6c757d; }
        `);
    });
}

function exportData(subscriptions, format) {
    let data, filename, mimeType;
    
    switch(format) {
        case 'json':
            data = JSON.stringify(subscriptions, null, 2);
            filename = `overlap-alert-subscriptions-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
        case 'csv':
            const csvHeaders = 'Service Name,Category,Monthly Cost,Notes,First Used,Last Used,Usage Count\n';
            const csvData = subscriptions.map(sub => 
                `"${sub.serviceName}","${sub.category}","${sub.monthlyCost || ''}","${sub.notes || ''}","${sub.firstUsed || ''}","${sub.lastUsed || ''}","${sub.usageCount || 0}"`
            ).join('\n');
            data = csvHeaders + csvData;
            filename = `overlap-alert-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        case 'pdf':
            showNotification('PDF export coming soon! Try JSON or CSV for now.', 'info');
            return;
    }
    
    // Create download
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Data exported successfully as ${format.toUpperCase()}!`, 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let importedData;
            if (file.name.endsWith('.json')) {
                importedData = JSON.parse(e.target.result);
            } else if (file.name.endsWith('.csv')) {
                // Simple CSV parsing (would need more robust parsing for production)
                showNotification('CSV import coming soon! Please use JSON format.', 'info');
                return;
            }
            
            if (Array.isArray(importedData)) {
                chrome.storage.local.set({ userSubscriptions: importedData }, () => {
                    showNotification(`Successfully imported ${importedData.length} subscriptions!`, 'success');
                    // Refresh the popup data
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                });
            } else {
                showNotification('Invalid file format. Please use a valid JSON export.', 'error');
            }
        } catch (error) {
            showNotification('Error importing file. Please check the format.', 'error');
        }
    };
    reader.readAsText(file);
}

function showPriceComparisonInterface() {
    const modal = createModal('💰 Price Comparison', `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
            <h4>Price Comparison Coming Soon!</h4>
            <p>Find better deals and save money</p>
            <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `);
}

function showRemindersInterface() {
    const modal = createModal('🔔 Renewal Reminders', `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
            <h4>Renewal Reminders Coming Soon!</h4>
            <p>Never miss a renewal with smart reminders</p>
            <button class="btn btn-primary modal-close-btn">Close</button>
        </div>
    `);
}

function showBulkManagementInterface() {
    // Get real subscription data
    chrome.storage.local.get(['userSubscriptions'], (result) => {
        const subscriptions = result.userSubscriptions || [];
        
        const modal = createModal('📋 Bulk Management', `
            <div class="bulk-management-interface">
                <div class="bulk-actions">
                    <h4>🔧 Bulk Actions</h4>
                    <div class="action-grid">
                        <button class="bulk-action-btn" data-action="pause">
                            <span class="action-icon">⏸️</span>
                            <span class="action-title">Pause Subscriptions</span>
                            <span class="action-desc">Temporarily pause multiple services</span>
                        </button>
                        <button class="bulk-action-btn" data-action="cancel">
                            <span class="action-icon">❌</span>
                            <span class="action-title">Cancel Subscriptions</span>
                            <span class="action-desc">Cancel multiple services at once</span>
                        </button>
                        <button class="bulk-action-btn" data-action="archive">
                            <span class="action-icon">📦</span>
                            <span class="action-title">Archive Subscriptions</span>
                            <span class="action-desc">Move to archived folder</span>
                        </button>
                        <button class="bulk-action-btn" data-action="export">
                            <span class="action-icon">📤</span>
                            <span class="action-title">Export Selected</span>
                            <span class="action-desc">Export chosen subscriptions</span>
                        </button>
                    </div>
                </div>
                
                <div class="subscription-selection">
                    <h4>📋 Select Subscriptions (${subscriptions.length} available)</h4>
                    <div class="selection-options">
                        <button class="select-btn" data-action="select-all">Select All</button>
                        <button class="select-btn" data-action="select-none">Select None</button>
                        <button class="select-btn" data-action="select-by-category">By Category</button>
                    </div>
                    
                    <div class="subscription-checklist">
                        ${subscriptions.map((sub, index) => `
                            <div class="subscription-item">
                                <label>
                                    <input type="checkbox" data-index="${index}"> 
                                    <span class="subscription-name">${sub.serviceName}</span>
                                    <span class="subscription-category">${sub.category}</span>
                                    <span class="subscription-cost">$${sub.monthlyCost || '0.00'}/month</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bulk-summary">
                    <h4>📊 Selection Summary</h4>
                    <div class="summary-info">
                        <span id="selectedCount">0</span> selected • 
                        <span id="selectedCost">$0.00</span> monthly total
                    </div>
                </div>
            </div>
        `);
        
        // Add event listeners for bulk action buttons
        modal.querySelectorAll('.bulk-action-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const selectedCheckboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
                const selectedCount = selectedCheckboxes.length;
                
                if (selectedCount === 0) {
                    showNotification('Please select at least one subscription first', 'warning');
                    return;
                }
                
                const selectedSubscriptions = Array.from(selectedCheckboxes).map(cb => {
                    const index = parseInt(cb.getAttribute('data-index'));
                    return subscriptions[index];
                });
                
                performBulkAction(action, selectedSubscriptions, modal);
            });
        });
        
        // Add event listeners for selection buttons
        modal.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                
                switch(action) {
                    case 'select-all':
                        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
                        updateBulkSummary(modal, subscriptions);
                        break;
                    case 'select-none':
                        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                        updateBulkSummary(modal, subscriptions);
                        break;
                    case 'select-by-category':
                        // Simple category selection - could be enhanced with dropdown
                        const categories = [...new Set(subscriptions.map(sub => sub.category))];
                        const category = prompt(`Select category to filter:\n${categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}`);
                        if (category && categories[parseInt(category) - 1]) {
                            const selectedCategory = categories[parseInt(category) - 1];
                            modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                            subscriptions.forEach((sub, index) => {
                                if (sub.category === selectedCategory) {
                                    modal.querySelector(`input[data-index="${index}"]`).checked = true;
                                }
                            });
                            updateBulkSummary(modal, subscriptions);
                        }
                        break;
                }
            });
        });
        
        // Add change listeners for checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => updateBulkSummary(modal, subscriptions));
        });
        
        // Add bulk management styles
        addModalStyles(`
            .bulk-management-interface { padding: 20px; }
            .bulk-actions, .subscription-selection, .bulk-summary { margin-bottom: 24px; }
            .bulk-actions h4, .subscription-selection h4, .bulk-summary h4 { margin: 0 0 16px 0; color: #1a1a1a; }
            .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .bulk-action-btn { display: flex; flex-direction: column; align-items: center; padding: 16px; border: 2px solid #e9ecef; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; text-align: center; }
            .bulk-action-btn:hover { border-color: #FFD700; background: #fffbf0; }
            .action-icon { font-size: 24px; margin-bottom: 8px; }
            .action-title { font-weight: bold; margin-bottom: 4px; }
            .action-desc { font-size: 12px; color: #6c757d; }
            .selection-options { display: flex; gap: 8px; margin-bottom: 16px; }
            .select-btn { background: #f8f9fa; border: 1px solid #e9ecef; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .select-btn:hover { background: #e9ecef; }
            .subscription-checklist { background: #f8f9fa; padding: 16px; border-radius: 8px; max-height: 300px; overflow-y: auto; }
            .subscription-item { margin-bottom: 12px; }
            .subscription-item:last-child { margin-bottom: 0; }
            .subscription-item label { display: grid; grid-template-columns: auto 1fr auto auto; gap: 12px; align-items: center; cursor: pointer; padding: 8px; background: white; border-radius: 6px; }
            .subscription-name { font-weight: 500; }
            .subscription-category { font-size: 12px; color: #6c757d; background: #e9ecef; padding: 2px 8px; border-radius: 12px; }
            .subscription-cost { font-size: 14px; color: #dc3545; font-weight: bold; }
            .bulk-summary { background: #fffbf0; padding: 16px; border-radius: 8px; border: 2px solid #FFD700; }
            .summary-info { font-size: 14px; color: #1a1a1a; font-weight: 500; }
        `);
        
        // Initialize summary
        updateBulkSummary(modal, subscriptions);
    });
}

function updateBulkSummary(modal, subscriptions) {
    const selectedCheckboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const selectedCount = selectedCheckboxes.length;
    
    const selectedCost = Array.from(selectedCheckboxes).reduce((sum, cb) => {
        const index = parseInt(cb.getAttribute('data-index'));
        return sum + (parseFloat(subscriptions[index]?.monthlyCost) || 0);
    }, 0);
    
    modal.querySelector('#selectedCount').textContent = selectedCount;
    modal.querySelector('#selectedCost').textContent = `$${selectedCost.toFixed(2)}`;
}

function performBulkAction(action, selectedSubscriptions, modal) {
    switch(action) {
        case 'pause':
            showNotification(`Paused ${selectedSubscriptions.length} subscription${selectedSubscriptions.length !== 1 ? 's' : ''}`, 'success');
            break;
        case 'cancel':
            showNotification(`Cancelled ${selectedSubscriptions.length} subscription${selectedSubscriptions.length !== 1 ? 's' : ''}`, 'success');
            break;
        case 'archive':
            showNotification(`Archived ${selectedSubscriptions.length} subscription${selectedSubscriptions.length !== 1 ? 's' : ''}`, 'success');
            break;
        case 'export':
            exportData(selectedSubscriptions, 'json');
            break;
    }
}

function startFreeTrial() {
    showNotification('Starting 14-day free trial... All premium features are now unlocked!', 'success');
    // In a real implementation, this would call the monetization manager
}

function updateSubscriptionList(subscriptions) {
    const subscriptionList = document.getElementById('subscriptionList');
    
    if (subscriptions.length === 0) {
        subscriptionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📱</div>
                <div class="empty-state-title">No subscriptions tracked yet</div>
                <div class="empty-state-description">
                    Visit pricing pages of services you use to start tracking your subscriptions and avoid overlaps.
                </div>
            </div>
        `;
        return;
    }
    
    // Group subscriptions by category
    const groupedSubscriptions = groupSubscriptionsByCategory(subscriptions);
    
    let html = '';
    for (const [category, subs] of Object.entries(groupedSubscriptions)) {
        html += `<div class="category-group">`;
        html += `<div class="category-header">${category}</div>`;
        
        subs.forEach(subscription => {
            html += `
                <div class="subscription-item">
                    <div class="subscription-info">
                        <div class="subscription-name">
                            ${subscription.serviceName}
                            ${subscription.autoAdded ? '<span class="auto-added-badge">Auto-detected</span>' : ''}
                        </div>
                        <div class="subscription-category">${subscription.category}</div>
                        ${subscription.monthlyCost ? `<div class="subscription-cost">$${subscription.monthlyCost}/month</div>` : ''}
                        ${subscription.notes ? `<div class="subscription-notes">${subscription.notes}</div>` : ''}
                    </div>
                    <div class="subscription-actions">
                    <div class="subscription-usage">${subscription.usageCount || 0} uses</div>
                        <button class="btn-remove" data-service="${subscription.serviceName}" data-category="${subscription.category}" title="Remove subscription">×</button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    subscriptionList.innerHTML = html;
}

function groupSubscriptionsByCategory(subscriptions) {
    const grouped = {};
    subscriptions.forEach(sub => {
        if (!grouped[sub.category]) {
            grouped[sub.category] = [];
        }
        grouped[sub.category].push(sub);
    });
    return grouped;
}

function updateSettings(settings) {
    // Update warning toggle
    const warningsToggle = document.getElementById('warningsToggle');
    warningsToggle.classList.toggle('active', settings.showWarnings !== false);
    
    // Update tracking toggle
    const trackingToggle = document.getElementById('trackingToggle');
    trackingToggle.classList.toggle('active', settings.trackUsage !== false);
}

function toggleSetting(event) {
    const toggle = event.target;
    const isActive = toggle.classList.contains('active');
    const settingName = toggle.id.replace('Toggle', '');
    
    // Toggle visual state
    toggle.classList.toggle('active');
    
    // Update setting
    updateSetting(settingName, !isActive);
}

async function updateSetting(settingName, value) {
    try {
        const settings = await getSettings();
        settings[settingName] = value;
        
        chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: settings
        }, (response) => {
            if (response.success) {
                console.log(`Setting ${settingName} updated to ${value}`);
            }
        });
    } catch (error) {
        console.error('Error updating setting:', error);
    }
}

function exportData() {
    getSubscriptions().then(subscriptions => {
        const data = {
            subscriptions: subscriptions,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `overlap-alert-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function clearData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
            if (response.success) {
                loadData(); // Refresh the UI
                showNotification('Data cleared successfully');
            }
        });
    }
}

function showLoading() {
    const subscriptionList = document.getElementById('subscriptionList');
    subscriptionList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function showError(message) {
    const subscriptionList = document.getElementById('subscriptionList');
    subscriptionList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Error</div>
            <div class="empty-state-description">${message}</div>
        </div>
    `;
}

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add some additional CSS for the popup
const additionalStyles = `
    .category-group {
        margin-bottom: 16px;
    }
    
    .category-header {
        font-size: 14px;
        font-weight: 600;
        color: #667eea;
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #f0f2ff;
        border-radius: 6px;
        border-left: 3px solid #667eea;
    }
    
    .subscription-item {
        margin-left: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .subscription-item:last-child {
        border-bottom: none;
    }
    
    .subscription-info {
        flex: 1;
    }
    
    .subscription-name {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .auto-added-badge {
        background: #e8f5e8;
        color: #27ae60;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 500;
        border: 1px solid #27ae60;
    }
    
    .subscription-category {
        font-size: 12px;
        color: #7f8c8d;
        margin-bottom: 2px;
    }
    
    .subscription-cost {
        font-size: 12px;
        color: #27ae60;
        font-weight: 500;
    }
    
    .subscription-notes {
        font-size: 11px;
        color: #95a5a6;
        font-style: italic;
        margin-top: 2px;
    }
    
    .subscription-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .subscription-usage {
        font-size: 12px;
        color: #7f8c8d;
    }
    
    .btn-remove {
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }
    
    .btn-remove:hover {
        background: #c0392b;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .btn-small {
        padding: 6px 12px;
        font-size: 12px;
    }
    
    /* Modal Styles */
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e1e5e9;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: #2c3e50;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #7f8c8d;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .modal-close:hover {
        background-color: #f0f0f0;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #e1e5e9;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #2c3e50;
        font-size: 14px;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
        box-sizing: border-box;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3498db;
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 60px;
    }
`;

// Modal functions
function showAddSubscriptionModal() {
    document.getElementById('addSubscriptionModal').style.display = 'flex';
    document.getElementById('serviceName').focus();
}

function hideAddSubscriptionModal() {
    document.getElementById('addSubscriptionModal').style.display = 'none';
    document.getElementById('addSubscriptionForm').reset();
}

async function saveSubscription(event) {
    try {
        event.preventDefault();
        
        // Check Chrome API availability
        if (!checkChromeAPI()) return;
        
        // Sanitize and validate inputs
        const serviceName = sanitizeInput(document.getElementById('serviceName').value);
        const category = sanitizeInput(document.getElementById('category').value);
        const monthlyCost = sanitizeInput(document.getElementById('monthlyCost').value);
        const notes = sanitizeInput(document.getElementById('notes').value);
        
        // Validate inputs
        const serviceValidation = validateServiceName(serviceName);
        if (!serviceValidation.valid) {
            showUserFriendlyError(serviceValidation.error);
            return;
        }
        
        if (!category) {
            showUserFriendlyError('Please select a category');
            return;
        }
        
        const costValidation = validateMonthlyCost(monthlyCost);
        if (!costValidation.valid) {
            showUserFriendlyError(costValidation.error);
            return;
        }
        
        const notesValidation = validateNotes(notes);
        if (!notesValidation.valid) {
            showUserFriendlyError(notesValidation.error);
            return;
        }
        
        try {
        // Get current subscriptions
        const subscriptions = await getSubscriptions();
        
        // Check if subscription already exists
        const existingSubscription = subscriptions.find(sub => 
            sub.serviceName.toLowerCase() === serviceName.toLowerCase() && 
            sub.category === category
        );
        
        if (existingSubscription) {
            showNotification('This subscription already exists');
            return;
        }
        
        // Add new subscription
        const newSubscription = {
            serviceName,
            category,
            monthlyCost: monthlyCost ? parseFloat(monthlyCost) : null,
            notes: notes || null,
            usageCount: 0,
            firstUsed: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        subscriptions.push(newSubscription);
        
        // Save to storage
        chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
            hideAddSubscriptionModal();
            loadData(); // Refresh the UI
            showNotification('Subscription added successfully');
        });
        
        } catch (error) {
            console.error('Error saving subscription:', error);
            showNotification('Failed to save subscription');
        }
    } catch (error) {
        console.error('Error in saveSubscription:', error);
        showNotification('Failed to save subscription');
    }
}

async function removeSubscription(serviceName, category) {
    if (!confirm(`Are you sure you want to remove ${serviceName} from your subscriptions?`)) {
        return;
    }
    
    try {
        const subscriptions = await getSubscriptions();
        const filteredSubscriptions = subscriptions.filter(sub => 
            !(sub.serviceName === serviceName && sub.category === category)
        );
        
        chrome.storage.local.set({ userSubscriptions: filteredSubscriptions }, () => {
            loadData(); // Refresh the UI
            showNotification('Subscription removed successfully');
        });
        
    } catch (error) {
        console.error('Error removing subscription:', error);
        showNotification('Failed to remove subscription');
    }
}

// Event delegation handles remove button clicks, no need for global function

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Input validation and sanitization functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>\"']/g, '') // Remove HTML/script injection characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
}

function validateServiceName(name) {
    if (!name || typeof name !== 'string') return { valid: false, error: 'Service name is required' };
    
    const trimmed = name.trim();
    if (trimmed.length < 2) return { valid: false, error: 'Service name must be at least 2 characters' };
    if (trimmed.length > 50) return { valid: false, error: 'Service name cannot exceed 50 characters' };
    if (!/^[a-zA-Z0-9\s\-\.&]+$/.test(trimmed)) {
        return { valid: false, error: 'Service name contains invalid characters. Only letters, numbers, spaces, hyphens, dots, and ampersands are allowed' };
    }
    
    return { valid: true };
}

function validateMonthlyCost(cost) {
    if (!cost) return { valid: true }; // Optional field
    
    const numCost = parseFloat(cost);
    if (isNaN(numCost)) return { valid: false, error: 'Monthly cost must be a valid number' };
    if (numCost < 0) return { valid: false, error: 'Monthly cost cannot be negative' };
    if (numCost > 10000) return { valid: false, error: 'Monthly cost cannot exceed $10,000' };
    
    return { valid: true };
}

function validateNotes(notes) {
    if (!notes) return { valid: true }; // Optional field
    
    if (notes.length > 500) return { valid: false, error: 'Notes cannot exceed 500 characters' };
    
    return { valid: true };
}

// User-friendly error display
function showUserFriendlyError(message) {
    // Create a more user-friendly error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'user-error-notification';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        text-align: center;
        font-size: 14px;
        line-height: 1.4;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Check Chrome API availability
function checkChromeAPI() {
    if (!chrome || !chrome.runtime || !chrome.storage) {
        showUserFriendlyError('Chrome extension APIs not available. Please refresh the page.');
        return false;
    }
    return true;
}
