const API_URL = 'http://localhost:3001/api';
let refreshInterval;
let consecutiveErrors = 0;
let currentBackoffDelay = 5000; // Start with 5 seconds
const MAX_BACKOFF_DELAY = 60000; // Max 1 minute
const BASE_REFRESH_INTERVAL = 5000;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadData();
    loadHardwareMetrics();
    startAutoRefresh();
    setupEventListeners();
});

// Check Ollama server health
async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (data.status === 'online') {
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Online';
        } else {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'Offline';
        }
    } catch (error) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Error';
        console.error('Health check failed:', error);
    }
}

// Load all dashboard data
async function loadData() {
    await Promise.all([
        loadRunningModels(),
        loadAvailableModels(),
        loadHardwareMetrics()
    ]);
    updateLastUpdated();
}

// Load running models (condensed view)
async function loadRunningModels() {
    const container = document.getElementById('runningModels');
    
    try {
        const response = await fetch(`${API_URL}/models/running`);
        const data = await response.json();
        
        const runningCount = document.getElementById('runningCount');
        const runningCountBadge = document.getElementById('runningCountBadge');
        
        if (data.models && data.models.length > 0) {
            runningCount.textContent = data.models.length;
            runningCountBadge.textContent = data.models.length;
            container.innerHTML = data.models.map(model => `
                <div class="model-compact-item">
                    <div class="model-compact-header">
                        <strong>${model.name}</strong>
                    </div>
                    <div class="model-compact-details">
                        ${model.size_vram ? `VRAM: ${formatBytes(model.size_vram)}` : `Size: ${formatBytes(model.size)}`}
                    </div>
                </div>
            `).join('');
        } else {
            runningCount.textContent = '0';
            runningCountBadge.textContent = '0';
            container.innerHTML = '<p class="empty">No models running</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load</p>';
        console.error('Error loading running models:', error);
    }
}

// Load available models
async function loadAvailableModels() {
    const container = document.getElementById('availableModels');
    const modelSelect = document.getElementById('modelSelect');
    
    try {
        const response = await fetch(`${API_URL}/models`);
        const data = await response.json();
        
        const totalModels = document.getElementById('totalModels');
        const totalModelsBadge = document.getElementById('totalModelsBadge');
        
        if (data.models && data.models.length > 0) {
            totalModels.textContent = data.models.length;
            totalModelsBadge.textContent = data.models.length;
            
            container.innerHTML = data.models.map(model => `
                <div class="model-item">
                    <div class="model-header">
                        <strong>${model.name}</strong>
                        <span class="badge">${formatBytes(model.size)}</span>
                    </div>
                    <div class="model-details">
                        <div>Modified: ${new Date(model.modified_at).toLocaleString()}</div>
                        ${model.details?.family ? `<div>Family: ${model.details.family}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            // Populate model select dropdown (preserve current selection)
            const currentSelection = modelSelect.value;
            modelSelect.innerHTML = '<option value="">Select a model...</option>' +
                data.models.map(model => `<option value="${model.name}">${model.name}</option>`).join('');
            
            // Restore the previous selection if it still exists in the list
            if (currentSelection && data.models.some(m => m.name === currentSelection)) {
                modelSelect.value = currentSelection;
            }
        } else {
            totalModels.textContent = '0';
            totalModelsBadge.textContent = '0';
            container.innerHTML = '<p class="empty">No models available</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load models</p>';
        console.error('Error loading models:', error);
    }
}

// Load hardware metrics
async function loadHardwareMetrics() {
    try {
        const response = await fetch(`${API_URL}/hardware`);
        const data = await response.json();
        
        // CPU Metrics
        document.getElementById('cpuModel').textContent = `${data.cpu.brand || 'Unknown'} (${data.cpu.physicalCores} cores @ ${data.cpu.speed} GHz)`;
        document.getElementById('cpuUsage').textContent = `${data.cpu.currentLoad.toFixed(1)}%`;
        document.getElementById('cpuProgress').style.width = `${data.cpu.currentLoad}%`;
        updateProgressColor('cpuProgress', data.cpu.currentLoad);
        
        // Memory Metrics
        document.getElementById('memTotal').textContent = formatBytes(data.memory.total);
        document.getElementById('memUsed').textContent = formatBytes(data.memory.used);
        document.getElementById('memUsage').textContent = `${data.memory.usedPercent}%`;
        document.getElementById('memProgress').style.width = `${data.memory.usedPercent}%`;
        updateProgressColor('memProgress', parseFloat(data.memory.usedPercent));
        
        // GPU Metrics
        const gpuMetrics = document.getElementById('gpuMetrics');
        if (data.gpu && data.gpu.length > 0) {
            gpuMetrics.innerHTML = data.gpu.map((gpu, index) => `
                <div class="hardware-details">
                    ${gpu.utilizationGpu !== null && gpu.utilizationGpu !== undefined ? `
                        <div class="hardware-info">
                            <span class="hw-label">Usage:</span>
                            <span class="hw-value">${gpu.utilizationGpu}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill gpu-progress-${index}" style="width: ${gpu.utilizationGpu}%"></div>
                        </div>
                    ` : ''}
                    <div class="hardware-info small-info">
                        <span class="hw-label">${gpu.model || 'Unknown'}${gpu.vram ? ` (${formatBytes(gpu.vram * 1024 * 1024)})` : ''}</span>
                    </div>
                </div>
            `).join('');
            
            // Update GPU progress colors
            data.gpu.forEach((gpu, index) => {
                if (gpu.utilizationGpu !== null && gpu.utilizationGpu !== undefined) {
                    updateProgressColor(`gpu-progress-${index}`, gpu.utilizationGpu);
                }
            });
        } else {
            gpuMetrics.innerHTML = '<p class="empty">No GPU</p>';
        }
        
        // Disk Metrics
        document.getElementById('diskTotal').textContent = formatBytes(data.disk.total);
        document.getElementById('diskUsed').textContent = formatBytes(data.disk.used);
        document.getElementById('diskUsage').textContent = `${data.disk.usedPercent}%`;
        document.getElementById('diskProgress').style.width = `${data.disk.usedPercent}%`;
        updateProgressColor('diskProgress', parseFloat(data.disk.usedPercent));
        
    } catch (error) {
        console.error('Error loading hardware metrics:', error);
        document.getElementById('cpuModel').textContent = 'Failed to load';
        document.getElementById('gpuMetrics').innerHTML = '<p class="error">Failed to load GPU metrics</p>';
    }
}

// Update progress bar color based on usage percentage
function updateProgressColor(elementId, percentage) {
    const element = document.querySelector(`.${elementId}`);
    if (!element) return;
    
    // Remove existing color classes
    element.classList.remove('progress-low', 'progress-medium', 'progress-high', 'progress-critical');
    
    // Add appropriate color class
    if (percentage < 50) {
        element.classList.add('progress-low');
    } else if (percentage < 75) {
        element.classList.add('progress-medium');
    } else if (percentage < 90) {
        element.classList.add('progress-high');
    } else {
        element.classList.add('progress-critical');
    }
}

// Setup event listeners
function setupEventListeners() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', handleGenerate);
}

// Handle test generation
async function handleGenerate() {
    const modelSelect = document.getElementById('modelSelect');
    const promptInput = document.getElementById('promptInput');
    const resultBox = document.getElementById('generationResult');
    const generateBtn = document.getElementById('generateBtn');
    
    const model = modelSelect.value;
    const prompt = promptInput.value.trim();
    
    if (!model) {
        resultBox.innerHTML = '<p class="error">Please select a model</p>';
        return;
    }
    
    if (!prompt) {
        resultBox.innerHTML = '<p class="error">Please enter a prompt</p>';
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    resultBox.innerHTML = '<p class="loading">Generating response...</p>';
    
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, prompt })
        });
        
        const data = await response.json();
        
        if (data.response) {
            resultBox.innerHTML = `
                <div class="success">
                    <strong>Response:</strong>
                    <p>${data.response}</p>
                    <div class="meta">
                        <small>
                            Total duration: ${(data.total_duration / 1e9).toFixed(2)}s |
                            Load duration: ${(data.load_duration / 1e9).toFixed(2)}s
                        </small>
                    </div>
                </div>
            `;
            
            // Refresh running models since generation may have loaded a model
            await loadRunningModels();
        } else {
            resultBox.innerHTML = '<p class="error">No response received</p>';
        }
    } catch (error) {
        resultBox.innerHTML = `<p class="error">Generation failed: ${error.message}</p>`;
        console.error('Generation error:', error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Response';
    }
}

// Start auto-refresh with error handling and exponential backoff
function startAutoRefresh() {
    const refresh = async () => {
        try {
            await checkHealth();
            await loadData();
            
            // Success - reset error state
            if (consecutiveErrors > 0) {
                consecutiveErrors = 0;
                currentBackoffDelay = BASE_REFRESH_INTERVAL;
                showToast('Connection restored', 'success');
            }
        } catch (error) {
            consecutiveErrors++;
            console.error(`Refresh failed (${consecutiveErrors} consecutive errors):`, error);
            
            // Calculate exponential backoff: 5s, 10s, 20s, 40s, 60s (max)
            currentBackoffDelay = Math.min(
                BASE_REFRESH_INTERVAL * Math.pow(2, consecutiveErrors - 1),
                MAX_BACKOFF_DELAY
            );
            
            // Show user-friendly error after 3 consecutive failures
            if (consecutiveErrors === 3) {
                showToast('Dashboard connection issues. Retrying...', 'error');
            }
            
            // Reschedule with backoff delay
            clearInterval(refreshInterval);
            refreshInterval = setInterval(refresh, currentBackoffDelay);
        }
    };
    
    refreshInterval = setInterval(refresh, BASE_REFRESH_INTERVAL);
}

// Display toast notification to user
function showToast(message, type = 'info') {
    // Remove existing toast if present
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    lastUpdated.textContent = new Date().toLocaleTimeString();
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Toggle collapse for collapsible sections
function toggleCollapse(sectionId) {
    const content = document.getElementById(`${sectionId}Content`);
    const icon = document.getElementById(`${sectionId}Icon`);
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        icon.textContent = '▶';
    }
}
