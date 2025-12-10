const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const si = require('systeminformation');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Instance storage configuration
 * Instances are persisted to a JSON file for durability across server restarts
 */
const INSTANCES_FILE = path.join(__dirname, '.instances.json');

/**
 * In-memory instance store with file persistence
 * Structure: { [id]: { id, name, url, description, created_at, updated_at } }
 */
let instances = {};

/**
 * Load instances from persistent storage
 */
function loadInstances() {
  try {
    if (fs.existsSync(INSTANCES_FILE)) {
      const data = fs.readFileSync(INSTANCES_FILE, 'utf8');
      instances = JSON.parse(data);
      console.log(`Loaded ${Object.keys(instances).length} instances from storage`);
    }
  } catch (error) {
    console.error('Error loading instances:', error.message);
    instances = {};
  }
}

/**
 * Save instances to persistent storage
 */
function saveInstances() {
  try {
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(instances, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving instances:', error.message);
  }
}

/**
 * Generate unique instance ID
 */
function generateId() {
  return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate instance URL format
 */
function validateInstanceUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'Only http and https protocols are supported' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate instance data
 */
function validateInstanceData(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!data.url || typeof data.url !== 'string' || data.url.trim() === '') {
    errors.push('URL is required and must be a non-empty string');
  } else {
    const urlValidation = validateInstanceUrl(data.url);
    if (!urlValidation.valid) {
      errors.push(`URL validation failed: ${urlValidation.error}`);
    }
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Load instances on startup
loadInstances();

/**
 * Ollama API base URL configuration
 * 
 * Set via OLLAMA_URL environment variable to connect to a custom Ollama instance.
 * Format: http(s)://hostname:port (e.g., http://192.168.1.100:11434)
 * 
 * Falls back to http://localhost:11434 if:
 * - OLLAMA_URL is not set
 * - OLLAMA_URL is an invalid URL format
 * - OLLAMA_URL uses a protocol other than http or https
 * 
 * @type {string}
 */
let OLLAMA_API = 'http://localhost:11434';
if (process.env.OLLAMA_URL) {
  try {
    const url = new URL(process.env.OLLAMA_URL);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Invalid protocol: ${url.protocol}. Only http and https are supported.`);
    }
    OLLAMA_API = process.env.OLLAMA_URL;
  } catch (e) {
    console.error(`Invalid OLLAMA_URL: ${process.env.OLLAMA_URL}. Using default: ${OLLAMA_API}`);
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================================================
// Instance Management Endpoints
// ============================================================================

/**
 * POST /api/instances
 * Create a new Ollama instance connection
 * 
 * Request body:
 * {
 *   "name": "string (required)",
 *   "url": "string (required, valid http/https URL)",
 *   "description": "string (optional)"
 * }
 * 
 * Response: 201 Created
 * {
 *   "id": "inst_...",
 *   "name": "...",
 *   "url": "...",
 *   "description": "...",
 *   "created_at": "ISO8601",
 *   "updated_at": "ISO8601"
 * }
 */
app.post('/api/instances', (req, res) => {
  try {
    const { name, url, description } = req.body;
    
    // Validate input
    const validation = validateInstanceData({ name, url, description });
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    // Create new instance
    const id = generateId();
    const now = new Date().toISOString();
    const instance = {
      id,
      name: name.trim(),
      url: url.trim(),
      description: description ? description.trim() : '',
      created_at: now,
      updated_at: now
    };
    
    instances[id] = instance;
    saveInstances();
    
    res.status(201).json(instance);
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({
      error: 'Failed to create instance',
      message: error.message
    });
  }
});

/**
 * GET /api/instances
 * List all configured Ollama instances
 * 
 * Response: 200 OK
 * {
 *   "instances": [
 *     { "id": "...", "name": "...", "url": "...", ... },
 *     ...
 *   ],
 *   "count": number
 * }
 */
app.get('/api/instances', (req, res) => {
  try {
    const instanceList = Object.values(instances);
    res.json({
      instances: instanceList,
      count: instanceList.length
    });
  } catch (error) {
    console.error('Error listing instances:', error);
    res.status(500).json({
      error: 'Failed to list instances',
      message: error.message
    });
  }
});

/**
 * GET /api/instances/:id
 * Get details of a specific instance
 * 
 * Response: 200 OK
 * {
 *   "id": "inst_...",
 *   "name": "...",
 *   "url": "...",
 *   "description": "...",
 *   "created_at": "ISO8601",
 *   "updated_at": "ISO8601"
 * }
 */
app.get('/api/instances/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!instances[id]) {
      return res.status(404).json({
        error: 'Instance not found',
        message: `No instance with ID '${id}' found`
      });
    }
    
    res.json(instances[id]);
  } catch (error) {
    console.error('Error getting instance:', error);
    res.status(500).json({
      error: 'Failed to get instance',
      message: error.message
    });
  }
});

/**
 * PUT /api/instances/:id
 * Update an existing instance
 * 
 * Request body (all fields optional):
 * {
 *   "name": "string",
 *   "url": "string (valid http/https URL)",
 *   "description": "string"
 * }
 * 
 * Response: 200 OK
 * {
 *   "id": "inst_...",
 *   "name": "...",
 *   "url": "...",
 *   "description": "...",
 *   "created_at": "ISO8601",
 *   "updated_at": "ISO8601"
 * }
 */
app.put('/api/instances/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, description } = req.body;
    
    if (!instances[id]) {
      return res.status(404).json({
        error: 'Instance not found',
        message: `No instance with ID '${id}' found`
      });
    }
    
    // Validate provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;
    
    // If any fields provided, validate them
    if (Object.keys(updateData).length > 0) {
      const validation = validateInstanceData({
        name: updateData.name !== undefined ? updateData.name : instances[id].name,
        url: updateData.url !== undefined ? updateData.url : instances[id].url,
        description: updateData.description !== undefined ? updateData.description : instances[id].description
      });
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }
    }
    
    // Update instance
    const now = new Date().toISOString();
    if (name !== undefined) instances[id].name = name.trim();
    if (url !== undefined) instances[id].url = url.trim();
    if (description !== undefined) instances[id].description = description.trim();
    instances[id].updated_at = now;
    
    saveInstances();
    
    res.json(instances[id]);
  } catch (error) {
    console.error('Error updating instance:', error);
    res.status(500).json({
      error: 'Failed to update instance',
      message: error.message
    });
  }
});

/**
 * DELETE /api/instances/:id
 * Delete an instance
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "message": "Instance deleted successfully",
 *   "id": "inst_..."
 * }
 */
app.delete('/api/instances/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!instances[id]) {
      return res.status(404).json({
        error: 'Instance not found',
        message: `No instance with ID '${id}' found`
      });
    }
    
    const deletedInstance = instances[id];
    delete instances[id];
    saveInstances();
    
    res.json({
      status: 'success',
      message: 'Instance deleted successfully',
      id: deletedInstance.id
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    res.status(500).json({
      error: 'Failed to delete instance',
      message: error.message
    });
  }
});

// ============================================================================
// Model Management Endpoints
// ============================================================================

// Get list of running models
app.get('/api/models/running', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/api/ps`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch running models',
      message: error.message 
    });
  }
});

// Get list of all available models
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/api/tags`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch models',
      message: error.message 
    });
  }
});

// Get model information
app.get('/api/models/:name', async (req, res) => {
  try {
    const response = await axios.post(`${OLLAMA_API}/api/show`, {
      name: req.params.name
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch model info',
      message: error.message 
    });
  }
});

// Unload a model (remove from memory)
app.delete('/api/models/:name', async (req, res) => {
  try {
    const modelName = req.params.name;
    
    if (!modelName || modelName.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Model name is required' 
      });
    }

    console.log(`Attempting to unload model: ${modelName}`);
    
    // Call Ollama's unload API by sending a generate request with keep_alive=0
    // This tells Ollama to unload the model from memory
    const response = await axios.post(`${OLLAMA_API}/api/generate`, {
      model: modelName,
      keep_alive: 0,
      stream: false
    });
    
    console.log(`Successfully unloaded model: ${modelName}`);
    
    res.json({ 
      status: 'success',
      message: `Model '${modelName}' unloaded successfully`,
      model: modelName
    });
  } catch (error) {
    console.error(`Error unloading model: ${error.message}`);
    
    // Handle specific error cases
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Model not found',
        message: `Model '${req.params.name}' not found or already unloaded` 
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid model name',
        message: error.response.data?.error || 'The model name provided is invalid' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to unload model',
      message: error.message 
    });
  }
});

// Health check for Ollama server
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/`);
    res.json({ 
      status: 'online',
      message: response.data 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'offline',
      error: error.message 
    });
  }
});

// Test generation endpoint (to simulate load) - non-streaming
app.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt } = req.body;
    const response = await axios.post(`${OLLAMA_API}/api/generate`, {
      model,
      prompt,
      stream: false
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate',
      message: error.message 
    });
  }
});

// Streaming generation endpoint using Server-Sent Events (SSE)
app.post('/api/generate/stream', async (req, res) => {
  try {
    const { model, prompt } = req.body;
    
    // Validate required parameters
    if (!model || !prompt) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Both model and prompt are required' 
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Make streaming request to Ollama
    const response = await axios.post(`${OLLAMA_API}/api/generate`, {
      model,
      prompt,
      stream: true
    }, {
      responseType: 'stream'
    });

    // Forward each chunk from Ollama to the client as SSE
    response.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const data = JSON.parse(line);
          
          // Send as SSE event
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          // If this is the final chunk, close the connection
          if (data.done) {
            res.end();
          }
        }
      } catch (parseError) {
        console.error('Error parsing Ollama stream chunk:', parseError);
      }
    });

    // Handle stream errors
    response.data.on('error', (error) => {
      console.error('Ollama stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      response.data.destroy();
    });

  } catch (error) {
    console.error('Error in streaming generation:', error);
    
    // If headers not sent yet, send error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to start streaming generation',
        message: error.message 
      });
    }
    
    // If streaming already started, send error event and close
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Get hardware metrics
app.get('/api/hardware', async (req, res) => {
  try {
    const [cpu, mem, graphics, currentLoad, processes, osInfo, fsSize, networkStats] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.graphics(),
      si.currentLoad(),
      si.processes(),
      si.osInfo(),
      si.fsSize(),
      si.networkStats()
    ]);

    // Calculate total disk space from filesystem mount points
    const totalDiskSpace = fsSize.reduce((acc, disk) => acc + (disk.size || 0), 0);
    const totalDiskUsed = fsSize.reduce((acc, disk) => acc + (disk.used || 0), 0);

    res.json({
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
        currentLoad: currentLoad.currentLoad,
        temperature: currentLoad.cpuTemperature || null
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usedPercent: (mem.used / mem.total * 100).toFixed(2),
        available: mem.available
      },
      gpu: graphics.controllers.map(gpu => ({
        model: gpu.model,
        vendor: gpu.vendor,
        vram: gpu.vram,
        memoryUsed: gpu.memoryUsed || 0,
        memoryTotal: gpu.memoryTotal || gpu.vram,
        temperature: gpu.temperatureGpu || null,
        utilizationGpu: gpu.utilizationGpu || null,
        utilizationMemory: gpu.utilizationMemory || null
      })),
      disk: {
        total: totalDiskSpace,
        used: totalDiskUsed,
        usedPercent: totalDiskSpace > 0 ? ((totalDiskUsed / totalDiskSpace) * 100).toFixed(2) : 0
      },
      network: networkStats.map(iface => ({
        iface: iface.iface,
        rx_sec: iface.rx_sec,
        tx_sec: iface.tx_sec
      })),
      system: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        hostname: osInfo.hostname,
        uptime: osInfo.uptime
      },
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch hardware metrics',
      message: error.message 
    });
  }
});

// Export app for testing
module.exports = app;

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ollama Metrics Dashboard running on http://localhost:${PORT}`);
    console.log(`Monitoring Ollama at ${OLLAMA_API}`);
  });
}
