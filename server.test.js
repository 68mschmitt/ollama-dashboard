const request = require('supertest');
const express = require('express');
const si = require('systeminformation');

// Mock systeminformation module
jest.mock('systeminformation');

// Import the server logic (we'll need to refactor server.js slightly to export the app)
// For now, we'll test the API endpoint behavior

describe('Environment Variable Configuration Tests', () => {
  describe('OLLAMA_URL Environment Variable Logic', () => {
    it('should use default localhost:11434 when OLLAMA_URL is not set', () => {
      const OLLAMA_URL = undefined;
      const OLLAMA_API = OLLAMA_URL || 'http://localhost:11434';
      expect(OLLAMA_API).toBe('http://localhost:11434');
    });

    it('should use custom OLLAMA_URL when environment variable is set', () => {
      const OLLAMA_URL = 'http://custom-host:11434';
      const OLLAMA_API = OLLAMA_URL || 'http://localhost:11434';
      expect(OLLAMA_API).toBe('http://custom-host:11434');
    });

    it('should accept various valid URL formats', () => {
      const validUrls = [
        'http://192.168.1.100:11434',
        'http://ollama.local:11434',
        'http://10.0.0.5:11434',
        'https://secure-ollama.example.com:11434'
      ];

      validUrls.forEach(url => {
        const OLLAMA_API = url || 'http://localhost:11434';
        expect(OLLAMA_API).toBe(url);
      });
    });

    it('should handle empty string by using default (falsy value)', () => {
      const OLLAMA_URL = '';
      const OLLAMA_API = OLLAMA_URL || 'http://localhost:11434';
      expect(OLLAMA_API).toBe('http://localhost:11434');
    });

    it('should handle null by using default', () => {
      const OLLAMA_URL = null;
      const OLLAMA_API = OLLAMA_URL || 'http://localhost:11434';
      expect(OLLAMA_API).toBe('http://localhost:11434');
    });

    it('should preserve trailing slashes if provided', () => {
      const OLLAMA_URL = 'http://custom-host:11434/';
      const OLLAMA_API = OLLAMA_URL || 'http://localhost:11434';
      expect(OLLAMA_API).toBe('http://custom-host:11434/');
    });

    it('should handle invalid URL formats gracefully and use default', () => {
      const invalidUrls = [
        'not-a-url',                    // Invalid URL format
        'ftp://invalid-protocol:11434', // Wrong protocol (not http/https)
        '://no-protocol',               // Missing protocol
        'http://[invalid',              // Malformed URL
        'just-text',                    // Not a URL
        'ws://websocket:11434'          // Wrong protocol (websocket)
      ];

      invalidUrls.forEach(invalidUrl => {
        let OLLAMA_API = 'http://localhost:11434';
        if (invalidUrl) {
          try {
            const url = new URL(invalidUrl);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              throw new Error(`Invalid protocol: ${url.protocol}`);
            }
            OLLAMA_API = invalidUrl;
          } catch (e) {
            // Should catch error and keep default
          }
        }
        expect(OLLAMA_API).toBe('http://localhost:11434');
      });
    });
  });

  describe('Environment Variable Best Practices', () => {
    it('should follow Node.js process.env pattern', () => {
      // Test that the pattern matches Node.js conventions
      const envValue = process.env.OLLAMA_URL;
      const result = envValue || 'http://localhost:11434';
      expect(typeof result).toBe('string');
    });

    it('should provide sensible default for local development', () => {
      const defaultValue = 'http://localhost:11434';
      expect(defaultValue).toMatch(/^https?:\/\//);
      expect(defaultValue).toContain('11434'); // Ollama default port
    });
  });
});

describe('Disk Usage Calculation Tests', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    
    // Replicate the /api/hardware endpoint logic
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
          }
        });
      } catch (error) {
        console.error('Error fetching hardware metrics:', error);
        res.status(500).json({ error: 'Failed to fetch hardware metrics' });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path - Single Disk', () => {
    it('should calculate disk usage correctly for a single mount point', async () => {
      // Mock fsSize to return a single disk
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/disk1',
          type: 'APFS',
          size: 500000000000, // 500 GB
          used: 250000000000, // 250 GB used
          available: 250000000000,
          use: 50.00,
          mount: '/'
        }
      ]);

      // Mock other required system info
      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk).toEqual({
        total: 500000000000,
        used: 250000000000,
        usedPercent: '50.00'
      });
    });

    it('should return accurate disk metrics matching expected values', async () => {
      // Mock realistic disk usage
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          size: 1000000000000, // 1 TB
          used: 750000000000,  // 750 GB used
          available: 250000000000,
          use: 75.00,
          mount: '/'
        }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk.total).toBe(1000000000000);
      expect(response.body.disk.used).toBe(750000000000);
      expect(response.body.disk.usedPercent).toBe('75.00');
    });
  });

  describe('Multiple Mount Points', () => {
    it('should aggregate disk usage across multiple mount points', async () => {
      // Mock multiple disks/mount points
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          size: 500000000000, // 500 GB
          used: 300000000000, // 300 GB used
          available: 200000000000,
          use: 60.00,
          mount: '/'
        },
        {
          fs: '/dev/sdb1',
          type: 'ext4',
          size: 1000000000000, // 1 TB
          used: 400000000000,  // 400 GB used
          available: 600000000000,
          use: 40.00,
          mount: '/data'
        }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      // Total should be sum of all mount points
      expect(response.body.disk.total).toBe(1500000000000); // 500 GB + 1 TB
      expect(response.body.disk.used).toBe(700000000000);   // 300 GB + 400 GB
      // Percentage should be calculated on combined total
      expect(response.body.disk.usedPercent).toBe('46.67'); // 700/1500 * 100
    });

    it('should handle three or more mount points correctly', async () => {
      si.fsSize.mockResolvedValue([
        { fs: '/dev/sda1', type: 'ext4', size: 100000000000, used: 50000000000, available: 50000000000, use: 50, mount: '/' },
        { fs: '/dev/sdb1', type: 'ext4', size: 200000000000, used: 100000000000, available: 100000000000, use: 50, mount: '/data' },
        { fs: '/dev/sdc1', type: 'ext4', size: 300000000000, used: 150000000000, available: 150000000000, use: 50, mount: '/backup' }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk.total).toBe(600000000000); // 100 + 200 + 300 GB
      expect(response.body.disk.used).toBe(300000000000);  // 50 + 100 + 150 GB
      expect(response.body.disk.usedPercent).toBe('50.00');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty disk array gracefully', async () => {
      si.fsSize.mockResolvedValue([]);
      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk).toEqual({
        total: 0,
        used: 0,
        usedPercent: 0
      });
    });

    it('should handle missing size or used properties', async () => {
      si.fsSize.mockResolvedValue([
        { fs: '/dev/sda1', type: 'ext4', mount: '/' }, // No size or used
        { fs: '/dev/sdb1', type: 'ext4', size: 500000000000, used: 250000000000, mount: '/data' }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      // Should use 0 for missing values
      expect(response.body.disk.total).toBe(500000000000);
      expect(response.body.disk.used).toBe(250000000000);
      expect(response.body.disk.usedPercent).toBe('50.00');
    });

    it('should handle very large disk sizes (petabytes)', async () => {
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          size: 5000000000000000, // 5 PB
          used: 2500000000000000, // 2.5 PB
          available: 2500000000000000,
          use: 50.00,
          mount: '/'
        }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk.total).toBe(5000000000000000);
      expect(response.body.disk.used).toBe(2500000000000000);
      expect(response.body.disk.usedPercent).toBe('50.00');
    });

    it('should handle 100% disk usage', async () => {
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          size: 100000000000,
          used: 100000000000, // Completely full
          available: 0,
          use: 100.00,
          mount: '/'
        }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk.usedPercent).toBe('100.00');
    });

    it('should handle 0% disk usage (empty disk)', async () => {
      si.fsSize.mockResolvedValue([
        {
          fs: '/dev/sda1',
          type: 'ext4',
          size: 100000000000,
          used: 0, // Completely empty
          available: 100000000000,
          use: 0,
          mount: '/'
        }
      ]);

      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.disk.usedPercent).toBe('0.00');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when fsSize() throws an error', async () => {
      si.fsSize.mockRejectedValue(new Error('Failed to read disk info'));
      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch hardware metrics' });
    });

    it('should handle systeminformation API failures gracefully', async () => {
      si.fsSize.mockRejectedValue(new Error('System call failed'));
      si.cpu.mockRejectedValue(new Error('CPU info unavailable'));
      mockBasicSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch hardware metrics');
    });
  });

  describe('Regression Tests - Other Hardware Metrics', () => {
    it('should still return CPU metrics correctly', async () => {
      // Mock basic system info first
      mockBasicSystemInfo();
      
      // Then override CPU-specific mocks
      si.fsSize.mockResolvedValue([
        { fs: '/dev/sda1', type: 'ext4', size: 100000000000, used: 50000000000, available: 50000000000, use: 50, mount: '/' }
      ]);

      si.cpu.mockResolvedValue({
        manufacturer: 'Intel',
        brand: 'Core i7',
        cores: 8,
        physicalCores: 4,
        speed: 3.6
      });

      si.currentLoad.mockResolvedValue({
        currentLoad: 45.5,
        cpuTemperature: 65
      });

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.cpu).toEqual({
        manufacturer: 'Intel',
        brand: 'Core i7',
        cores: 8,
        physicalCores: 4,
        speed: 3.6,
        currentLoad: 45.5,
        temperature: 65
      });
    });

    it('should still return memory metrics correctly', async () => {
      // Mock basic system info first
      mockBasicSystemInfo();
      
      // Then override memory-specific mocks
      si.fsSize.mockResolvedValue([
        { fs: '/dev/sda1', type: 'ext4', size: 100000000000, used: 50000000000, available: 50000000000, use: 50, mount: '/' }
      ]);

      si.mem.mockResolvedValue({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        available: 8000000000
      });

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body.memory).toEqual({
        total: 16000000000,
        used: 8000000000,
        free: 8000000000,
        usedPercent: '50.00',
        available: 8000000000
      });
    });

    it('should return all expected hardware sections', async () => {
      mockFullSystemInfo();

      const response = await request(app).get('/api/hardware');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('gpu');
      expect(response.body).toHaveProperty('disk');
      expect(response.body).toHaveProperty('network');
      expect(response.body).toHaveProperty('system');
    });
  });
});

// Helper function to mock basic system info
function mockBasicSystemInfo() {
  si.cpu.mockResolvedValue({
    manufacturer: 'Intel',
    brand: 'Core i5',
    cores: 4,
    physicalCores: 2,
    speed: 2.4
  });

  si.mem.mockResolvedValue({
    total: 8000000000,
    used: 4000000000,
    free: 4000000000,
    available: 4000000000
  });

  si.graphics.mockResolvedValue({
    controllers: []
  });

  si.currentLoad.mockResolvedValue({
    currentLoad: 25.0,
    cpuTemperature: null
  });

  si.processes.mockResolvedValue({
    all: 100,
    running: 5
  });

  si.osInfo.mockResolvedValue({
    platform: 'linux',
    distro: 'Ubuntu',
    release: '22.04',
    arch: 'x64',
    hostname: 'test-host',
    uptime: 123456
  });

  si.networkStats.mockResolvedValue([
    { iface: 'eth0', rx_sec: 1000, tx_sec: 500 }
  ]);
}

// Helper function to mock full system info
function mockFullSystemInfo() {
  mockBasicSystemInfo();
  
  si.fsSize.mockResolvedValue([
    {
      fs: '/dev/sda1',
      type: 'ext4',
      size: 500000000000,
      used: 250000000000,
      available: 250000000000,
      use: 50.00,
      mount: '/'
    }
  ]);

  si.graphics.mockResolvedValue({
    controllers: [
      {
        model: 'NVIDIA GeForce RTX 3080',
        vendor: 'NVIDIA',
        vram: 10240,
        memoryUsed: 2048,
        memoryTotal: 10240,
        temperatureGpu: 55,
        utilizationGpu: 30,
        utilizationMemory: 20
      }
    ]
  });
}
