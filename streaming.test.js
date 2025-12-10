const request = require('supertest');
const axios = require('axios');

// Mock axios for Ollama API calls
jest.mock('axios');

// Import the app from server.js
const app = require('./server');

describe('POST /api/generate/stream - SSE Streaming Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return 400 when model parameter is missing', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ prompt: 'test prompt' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request',
        message: 'Both model and prompt are required'
      });
    });

    it('should return 400 when prompt parameter is missing', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request',
        message: 'Both model and prompt are required'
      });
    });

    it('should return 400 when both parameters are missing', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request');
    });

    it('should return 400 for empty model string', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: '', prompt: 'test' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty prompt string', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: '' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for null model', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: null, prompt: 'test' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for null prompt', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: null });

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling - Ollama API Errors', () => {
    it('should return 500 when Ollama API is unreachable', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test' });

      expect(response.status).toBe(500);
      // Response might be text/html or empty, just verify status and that error was logged
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'test-model', stream: true }),
        expect.any(Object)
      );
    });

    it('should return 500 for network timeout', async () => {
      const error = new Error('ETIMEDOUT: Connection timed out');
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test' });

      expect(response.status).toBe(500);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ stream: true }),
        expect.any(Object)
      );
    });

    it('should handle 404 for non-existent model', async () => {
      const error = new Error('Model not found');
      error.response = { status: 404, data: { error: 'model not found' } };
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'nonexistent-model', prompt: 'test' });

      expect(response.status).toBe(500);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'nonexistent-model' }),
        expect.any(Object)
      );
    });

    it('should handle generic Ollama errors', async () => {
      const error = new Error('Internal Ollama error');
      error.response = { status: 500, data: { error: 'internal error' } };
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test' });

      expect(response.status).toBe(500);
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('Regression Tests - Non-Streaming Endpoint', () => {
    it('should not affect original /api/generate endpoint', async () => {
      axios.post.mockResolvedValue({
        data: { 
          model: 'test-model',
          response: 'Complete response',
          done: true
        }
      });

      const response = await request(app)
        .post('/api/generate')
        .send({ model: 'test-model', prompt: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body.done).toBe(true);
      
      // Verify it called with stream:false
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.objectContaining({ stream: false })
      );
    });

    it('should keep both endpoints at different paths', async () => {
      // Non-streaming endpoint
      axios.post.mockResolvedValueOnce({
        data: { response: 'non-streaming', done: true }
      });

      const nonStreamResponse = await request(app)
        .post('/api/generate')
        .send({ model: 'test', prompt: 'test' });

      expect(nonStreamResponse.status).toBe(200);
      expect(nonStreamResponse.body.done).toBe(true);

      // Streaming endpoint should have different path
      const error = new Error('Test error');
      axios.post.mockRejectedValueOnce(error);

      const streamResponse = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test', prompt: 'test' });

      // Should hit the streaming endpoint (returns 500 on error)
      expect(streamResponse.status).toBe(500);
      // Verify it called axios with stream:true (different from non-streaming)
      expect(axios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ stream: true }),
        expect.any(Object)
      );
    });
  });

  describe('HTTP Method Validation', () => {
    it('should only accept POST method for streaming endpoint', async () => {
      // GET should not work
      const getResponse = await request(app)
        .get('/api/generate/stream');
      expect(getResponse.status).toBe(404);

      // PUT should not work
      const putResponse = await request(app)
        .put('/api/generate/stream')
        .send({ model: 'test', prompt: 'test' });
      expect(putResponse.status).toBe(404);

      // DELETE should not work
      const deleteResponse = await request(app)
        .delete('/api/generate/stream');
      expect(deleteResponse.status).toBe(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle model names with special characters', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .send({ model: 'neural-chat:7b-v3.1', prompt: 'test' });

      // Verify the model name was passed correctly to axios
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'neural-chat:7b-v3.1' }),
        expect.any(Object)
      );
    });

    it('should handle prompts with special characters', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      const specialPrompt = 'Test with "quotes" and \\n newlines';

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: specialPrompt });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ prompt: specialPrompt }),
        expect.any(Object)
      );
    });

    it('should handle Unicode characters in prompts', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      const unicodePrompt = '你好 世界 🚀';

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: unicodePrompt });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ prompt: unicodePrompt }),
        expect.any(Object)
      );
    });

    it('should handle very long prompts', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      const longPrompt = 'a'.repeat(10000);

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: longPrompt });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ prompt: longPrompt }),
        expect.any(Object)
      );
    });
  });

  describe('Ollama API Integration', () => {
    it('should call Ollama with stream:true parameter', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test prompt' });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        {
          model: 'test-model',
          prompt: 'test prompt',
          stream: true
        },
        {
          responseType: 'stream'
        }
      );
    });

    it('should use responseType stream for axios request', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test' });

      const callArgs = axios.post.mock.calls[0];
      expect(callArgs[2].responseType).toBe('stream');
    });

    it('should use correct Ollama API endpoint', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      await request(app)
        .post('/api/generate/stream')
        .send({ model: 'test-model', prompt: 'test' });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/generate$/),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Request Body Validation', () => {
    it('should accept JSON content-type', async () => {
      const error = new Error('Test');
      axios.post.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/generate/stream')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ model: 'test-model', prompt: 'test' }));

      expect(axios.post).toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/generate/stream')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });
});

// Note: Full SSE streaming behavior (headers, data events, connection management)
// is tested manually with curl and in E2E tests. Unit tests focus on:
// - Input validation
// - Error handling
// - API integration
// - Regression prevention
//
// Manual test command:
// curl -X POST http://localhost:3001/api/generate/stream \
//   -H "Content-Type: application/json" \
//   -d '{"model":"starcoder2:latest","prompt":"Say hello"}' \
//   -N
