const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock systeminformation module
jest.mock('systeminformation');

// Mock axios for Ollama API calls
jest.mock('axios');

// Test data
const INSTANCES_FILE = path.join(__dirname, '.instances.json');

// Helper to clear instances file and reload server
function clearInstancesFile() {
  if (fs.existsSync(INSTANCES_FILE)) {
    fs.unlinkSync(INSTANCES_FILE);
  }
}

// Helper to check if error details contain a message matching a pattern
function expectErrorDetail(details, pattern) {
  const found = details.some(detail => detail.includes(pattern));
  expect(found).toBe(true);
}

// Import the app from server.js
let app;

describe('Instance Connection API - Comprehensive Tests', () => {
  // Clean up before and after tests
  beforeEach(() => {
    clearInstancesFile();
    // Clear the require cache to reload server with fresh instances
    jest.resetModules();
    delete require.cache[require.resolve('./server')];
    app = require('./server');
  });

  afterEach(() => {
    clearInstancesFile();
    jest.resetModules();
  });

  // ============================================================================
  // POST /api/instances - Create Instance Tests
  // ============================================================================

  describe('POST /api/instances - Create Instance', () => {
    describe('Happy Path - Valid Inputs', () => {
      test('should create instance with valid data', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Local Ollama',
            url: 'http://localhost:11434',
            description: 'Local development instance'
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Local Ollama');
        expect(response.body.url).toBe('http://localhost:11434');
        expect(response.body.description).toBe('Local development instance');
        expect(response.body).toHaveProperty('created_at');
        expect(response.body).toHaveProperty('updated_at');
        expect(response.body.id).toMatch(/^inst_\d+_[a-z0-9]+$/);
      });

      test('should create instance without description', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Remote Ollama',
            url: 'http://192.168.1.100:11434'
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Remote Ollama');
        expect(response.body.url).toBe('http://192.168.1.100:11434');
        expect(response.body.description).toBe('');
      });

      test('should create instance with https URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Secure Ollama',
            url: 'https://secure-ollama.example.com:11434'
          });

        expect(response.status).toBe(201);
        expect(response.body.url).toBe('https://secure-ollama.example.com:11434');
      });

      test('should trim whitespace from fields', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: '  Ollama Instance  ',
            url: '  http://localhost:11434  ',
            description: '  Test instance  '
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Ollama Instance');
        expect(response.body.url).toBe('http://localhost:11434');
        expect(response.body.description).toBe('Test instance');
      });

      test('should generate unique IDs for multiple instances', async () => {
        const response1 = await request(app)
          .post('/api/instances')
          .send({
            name: 'Instance 1',
            url: 'http://localhost:11434'
          });

        const response2 = await request(app)
          .post('/api/instances')
          .send({
            name: 'Instance 2',
            url: 'http://localhost:11435'
          });

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
        expect(response1.body.id).not.toBe(response2.body.id);
      });

      test('should set timestamps in ISO8601 format', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(201);
        expect(response.body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(response.body.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(response.body.created_at).toBe(response.body.updated_at);
      });
    });

    describe('Validation - Missing Fields', () => {
      test('should reject request with missing name', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
        expectErrorDetail(response.body.details, 'Name is required');
      });

      test('should reject request with missing URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test Instance'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
        expectErrorDetail(response.body.details, 'URL is required');
      });

      test('should reject request with both name and URL missing', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            description: 'No name or URL'
          });

        expect(response.status).toBe(400);
        expect(response.body.details.length).toBeGreaterThanOrEqual(2);
      });

      test('should reject request with empty body', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('Validation - Empty Strings', () => {
      test('should reject empty name string', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: '',
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Name is required');
      });

      test('should reject whitespace-only name', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: '   ',
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Name is required');
      });

      test('should reject empty URL string', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: ''
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'URL is required');
      });

      test('should reject whitespace-only URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: '   '
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'URL is required');
      });
    });

    describe('Validation - Invalid URL Format', () => {
      test('should reject invalid URL format', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'not-a-valid-url'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Invalid URL format');
      });

      test('should reject FTP protocol', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'ftp://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Only http and https protocols are supported');
      });

      test('should reject file protocol', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'file:///path/to/file'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Only http and https protocols are supported');
      });

      test('should reject WebSocket protocol', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'ws://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Only http and https protocols are supported');
      });

      test('should reject URL with no protocol', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Only http and https protocols are supported');
      });
    });

    describe('Validation - Type Checking', () => {
      test('should reject non-string name', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 123,
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Name is required');
      });

      test('should reject non-string URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 12345
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'URL is required');
      });

      test('should reject non-string description', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434',
            description: 123
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Description must be a string');
      });

      test('should reject null name', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: null,
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'Name is required');
      });

      test('should reject null URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: null
          });

        expect(response.status).toBe(400);
        expectErrorDetail(response.body.details, 'URL is required');
      });
    });

    describe('Edge Cases - Special Characters', () => {
      test('should accept special characters in name', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Ollama-Instance_2024 (Test)',
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Ollama-Instance_2024 (Test)');
      });

      test('should accept special characters in description', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434',
            description: 'Test with special chars: !@#$%^&*()'
          });

        expect(response.status).toBe(201);
        expect(response.body.description).toBe('Test with special chars: !@#$%^&*()');
      });

      test('should accept special characters in URL path', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434/api/v1/ollama'
          });

        expect(response.status).toBe(201);
        expect(response.body.url).toBe('http://localhost:11434/api/v1/ollama');
      });

      test('should accept URL with query parameters', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434?key=value&foo=bar'
          });

        expect(response.status).toBe(201);
        expect(response.body.url).toContain('?key=value&foo=bar');
      });

      test('should accept URL with fragment', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434#section'
          });

        expect(response.status).toBe(201);
      });
    });

    describe('Edge Cases - Long Strings', () => {
      test('should accept very long name (1000+ characters)', async () => {
        const longName = 'A'.repeat(1000);
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: longName,
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe(longName);
      });

      test('should accept very long description', async () => {
        const longDescription = 'This is a test description. '.repeat(100);
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434',
            description: longDescription
          });

        expect(response.status).toBe(201);
        expect(response.body.description).toBe(longDescription.trim());
      });
    });

    describe('Edge Cases - URL Variations', () => {
      test('should accept localhost URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434'
          });

        expect(response.status).toBe(201);
      });

      test('should accept 127.0.0.1 URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://127.0.0.1:11434'
          });

        expect(response.status).toBe(201);
      });

      test('should accept IPv4 address URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://192.168.1.100:11434'
          });

        expect(response.status).toBe(201);
      });

      test('should accept domain name URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://ollama.example.com:11434'
          });

        expect(response.status).toBe(201);
      });

      test('should accept URL with trailing slash', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost:11434/'
          });

        expect(response.status).toBe(201);
      });

      test('should accept URL without port', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'http://localhost'
          });

        expect(response.status).toBe(201);
      });

      test('should accept HTTPS URL', async () => {
        const response = await request(app)
          .post('/api/instances')
          .send({
            name: 'Test',
            url: 'https://secure.example.com:11434'
          });

        expect(response.status).toBe(201);
      });
    });
  });

  // ============================================================================
  // GET /api/instances - List Instances Tests
  // ============================================================================

  describe('GET /api/instances - List Instances', () => {
    test('should return empty list when no instances exist', async () => {
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('instances');
      expect(response.body).toHaveProperty('count');
      expect(response.body.instances).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test('should return single instance', async () => {
      // Create instance first
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // List instances
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.instances).toHaveLength(1);
      expect(response.body.instances[0].id).toBe(instanceId);
      expect(response.body.instances[0].name).toBe('Test Instance');
    });

    test('should return multiple instances', async () => {
      // Create multiple instances
      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 3',
          url: 'http://localhost:11436'
        });

      // List instances
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.instances).toHaveLength(3);
    });

    test('should return correct count after deletions', async () => {
      // Create instances
      const create1 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      // Delete one
      await request(app).delete(`/api/instances/${create1.body.id}`);

      // List instances
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.instances).toHaveLength(1);
    });

    test('should include all required fields in response', async () => {
      // Create instance
      await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434',
          description: 'Test description'
        });

      // List instances
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      const instance = response.body.instances[0];
      expect(instance).toHaveProperty('id');
      expect(instance).toHaveProperty('name');
      expect(instance).toHaveProperty('url');
      expect(instance).toHaveProperty('description');
      expect(instance).toHaveProperty('created_at');
      expect(instance).toHaveProperty('updated_at');
    });
  });

  // ============================================================================
  // GET /api/instances/:id - Get Instance Tests
  // ============================================================================

  describe('GET /api/instances/:id - Get Instance', () => {
    test('should return instance by valid ID', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434',
          description: 'Test description'
        });

      const instanceId = createResponse.body.id;

      // Get instance
      const response = await request(app).get(`/api/instances/${instanceId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(instanceId);
      expect(response.body.name).toBe('Test Instance');
      expect(response.body.url).toBe('http://localhost:11434');
      expect(response.body.description).toBe('Test description');
    });

    test('should return 404 for non-existent instance', async () => {
      const response = await request(app).get('/api/instances/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Instance not found');
      expect(response.body.message).toContain('nonexistent-id');
    });

    test('should return 404 for invalid ID format', async () => {
      const response = await request(app).get('/api/instances/invalid-id-format');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Instance not found');
    });

    test('should return correct instance when multiple exist', async () => {
      // Create multiple instances
      const create1 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      const create2 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      // Get specific instance
      const response = await request(app).get(`/api/instances/${create2.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(create2.body.id);
      expect(response.body.name).toBe('Instance 2');
      expect(response.body.url).toBe('http://localhost:11435');
    });

    test('should include all required fields', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      // Get instance
      const response = await request(app).get(`/api/instances/${createResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });
  });

  // ============================================================================
  // PUT /api/instances/:id - Update Instance Tests
  // ============================================================================

  describe('PUT /api/instances/:id - Update Instance', () => {
    test('should update instance name', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Original Name',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Update instance
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.url).toBe('http://localhost:11434');
    });

    test('should update instance URL', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Update instance
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          url: 'http://localhost:11435'
        });

      expect(response.status).toBe(200);
      expect(response.body.url).toBe('http://localhost:11435');
      expect(response.body.name).toBe('Test');
    });

    test('should update instance description', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434',
          description: 'Original description'
        });

      const instanceId = createResponse.body.id;

      // Update instance
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated description');
    });

    test('should update multiple fields at once', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Original',
          url: 'http://localhost:11434',
          description: 'Original'
        });

      const instanceId = createResponse.body.id;

      // Update instance
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: 'Updated',
          url: 'http://localhost:11435',
          description: 'Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated');
      expect(response.body.url).toBe('http://localhost:11435');
      expect(response.body.description).toBe('Updated');
    });

    test('should update timestamp on modification', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;
      const originalUpdatedAt = createResponse.body.updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update instance
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: 'Updated'
        });

      expect(response.status).toBe(200);
      expect(response.body.updated_at).not.toBe(originalUpdatedAt);
      expect(response.body.created_at).toBe(createResponse.body.created_at);
    });

    test('should return 404 for non-existent instance', async () => {
      const response = await request(app)
        .put('/api/instances/nonexistent-id')
        .send({
          name: 'Updated'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Instance not found');
    });

    test('should reject update with invalid URL', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Try to update with invalid URL
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          url: 'ftp://localhost:11434'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should reject update with empty name', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Try to update with empty name
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    test('should allow empty update (no fields)', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Update with no fields
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test');
    });

    test('should trim whitespace on update', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Update with whitespace
      const response = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: '  Updated Name  '
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });
  });

  // ============================================================================
  // DELETE /api/instances/:id - Delete Instance Tests
  // ============================================================================

  describe('DELETE /api/instances/:id - Delete Instance', () => {
    test('should delete instance by valid ID', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Delete instance
      const response = await request(app).delete(`/api/instances/${instanceId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Instance deleted successfully');
      expect(response.body.id).toBe(instanceId);
    });

    test('should return 404 for non-existent instance', async () => {
      const response = await request(app).delete('/api/instances/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Instance not found');
    });

    test('should remove instance from list after deletion', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Delete instance
      await request(app).delete(`/api/instances/${instanceId}`);

      // Try to get deleted instance
      const getResponse = await request(app).get(`/api/instances/${instanceId}`);

      expect(getResponse.status).toBe(404);
    });

    test('should not affect other instances when deleting', async () => {
      // Create multiple instances
      const create1 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      const create2 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      // Delete first instance
      await request(app).delete(`/api/instances/${create1.body.id}`);

      // Verify second instance still exists
      const response = await request(app).get(`/api/instances/${create2.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(create2.body.id);
    });

    test('should update count after deletion', async () => {
      // Create instances
      const create1 = await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      // Delete one
      await request(app).delete(`/api/instances/${create1.body.id}`);

      // List instances
      const response = await request(app).get('/api/instances');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
    });
  });

  // ============================================================================
  // Integration Tests - CRUD Operations
  // ============================================================================

  describe('Integration Tests - CRUD Operations', () => {
    test('should complete full CRUD cycle', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434',
          description: 'Test'
        });

      expect(createResponse.status).toBe(201);
      const instanceId = createResponse.body.id;

      // Read
      const getResponse = await request(app).get(`/api/instances/${instanceId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe('Test Instance');

      // Update
      const updateResponse = await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: 'Updated Instance'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated Instance');

      // Delete
      const deleteResponse = await request(app).delete(`/api/instances/${instanceId}`);
      expect(deleteResponse.status).toBe(200);

      // Verify deleted
      const finalGetResponse = await request(app).get(`/api/instances/${instanceId}`);
      expect(finalGetResponse.status).toBe(404);
    });

    test('should handle multiple concurrent operations', async () => {
      // Create multiple instances concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/instances')
            .send({
              name: `Instance ${i}`,
              url: `http://localhost:${11434 + i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      // Verify all created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all in list
      const listResponse = await request(app).get('/api/instances');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.count).toBe(5);
    });

    test('should maintain data integrity across operations', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434',
          description: 'Original'
        });

      const instanceId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.created_at;

      // Update multiple times
      await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({ name: 'Updated 1' });

      await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({ description: 'Updated description' });

      // Verify data integrity
      const finalResponse = await request(app).get(`/api/instances/${instanceId}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.created_at).toBe(originalCreatedAt);
      expect(finalResponse.body.name).toBe('Updated 1');
      expect(finalResponse.body.description).toBe('Updated description');
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  describe('Persistence Tests', () => {
    test('should persist instances to file', async () => {
      // Create instance
      await request(app)
        .post('/api/instances')
        .send({
          name: 'Test Instance',
          url: 'http://localhost:11434'
        });

      // Verify file exists
      expect(fs.existsSync(INSTANCES_FILE)).toBe(true);

      // Verify file contains valid JSON
      const fileContent = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      expect(data).toBeDefined();
      expect(Object.keys(data).length).toBeGreaterThan(0);
    });

    test('should persist multiple instances', async () => {
      // Create multiple instances
      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 1',
          url: 'http://localhost:11434'
        });

      await request(app)
        .post('/api/instances')
        .send({
          name: 'Instance 2',
          url: 'http://localhost:11435'
        });

      // Verify file contains both
      const fileContent = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      expect(Object.keys(data).length).toBe(2);
    });

    test('should persist updates to file', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Original',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Update instance
      await request(app)
        .put(`/api/instances/${instanceId}`)
        .send({
          name: 'Updated'
        });

      // Verify file contains updated data
      const fileContent = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      expect(data[instanceId].name).toBe('Updated');
    });

    test('should persist deletions to file', async () => {
      // Create instance
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const instanceId = createResponse.body.id;

      // Delete instance
      await request(app).delete(`/api/instances/${instanceId}`);

      // Verify file no longer contains instance
      const fileContent = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const data = JSON.parse(fileContent);
      expect(data[instanceId]).toBeUndefined();
    });
  });

  // ============================================================================
  // Response Format Tests
  // ============================================================================

  describe('Response Format Tests', () => {
    test('POST should return 201 Created status', async () => {
      const response = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      expect(response.status).toBe(201);
    });

    test('GET list should return 200 OK status', async () => {
      const response = await request(app).get('/api/instances');
      expect(response.status).toBe(200);
    });

    test('GET single should return 200 OK status', async () => {
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const response = await request(app).get(`/api/instances/${createResponse.body.id}`);
      expect(response.status).toBe(200);
    });

    test('PUT should return 200 OK status', async () => {
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const response = await request(app)
        .put(`/api/instances/${createResponse.body.id}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
    });

    test('DELETE should return 200 OK status', async () => {
      const createResponse = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test',
          url: 'http://localhost:11434'
        });

      const response = await request(app).delete(`/api/instances/${createResponse.body.id}`);
      expect(response.status).toBe(200);
    });

    test('should return JSON content type', async () => {
      const response = await request(app).get('/api/instances');
      expect(response.type).toMatch(/json/);
    });

    test('error responses should include error field', async () => {
      const response = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test'
          // Missing URL
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('error responses should include details field for validation errors', async () => {
      const response = await request(app)
        .post('/api/instances')
        .send({
          name: 'Test'
          // Missing URL
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });
});
