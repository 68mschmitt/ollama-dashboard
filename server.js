const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const si = require('systeminformation');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Test generation endpoint (to simulate load)
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

app.listen(PORT, () => {
  console.log(`Ollama Metrics Dashboard running on http://localhost:${PORT}`);
  console.log(`Monitoring Ollama at ${OLLAMA_API}`);
});
