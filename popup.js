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
