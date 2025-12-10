# 🦙 Ollama Metrics Dashboard

A real-time monitoring dashboard for local Ollama instances with comprehensive hardware metrics, model management, and test generation capabilities.

## Features

- **Real-Time Hardware Monitoring**
  - CPU usage and specifications
  - Memory utilization
  - GPU metrics (when available)
  - Disk space usage
  - Network statistics

- **Model Management**
  - Display all available models with metadata
  - Show currently running models with resource usage
  - View model sizes and modification dates

- **Test Generation**
  - Interactive interface to test models with custom prompts
  - Real-time response display with timing information
  - Load timing and total duration tracking

- **Server Health Status**
  - Live connection status to Ollama server
  - Auto-refresh every 5 seconds
  - Visual status indicators

- **Responsive Design**
  - Modern gradient UI with smooth animations
  - Collapsible sections for available models
  - Color-coded progress bars for resource usage
  - Mobile-friendly layout

## Prerequisites

- **Node.js** (v14 or higher)
- **Ollama** running locally on `http://localhost:11434`

## Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode (with auto-reload)

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Production Mode

```bash
npm start
```

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3001
```

## Configuration

### Ollama Server URL

The dashboard can connect to any Ollama instance using the `OLLAMA_URL` environment variable. If not set, it defaults to `http://localhost:11434`.

#### Environment Variable: OLLAMA_URL

**Format**: `http(s)://hostname:port`

**Examples**:

```bash
# Local development (default - no configuration needed)
npm start
# Connects to: http://localhost:11434

# Remote Ollama instance on local network
OLLAMA_URL=http://192.168.1.100:11434 npm start

# Remote Ollama with custom port
OLLAMA_URL=http://ollama.example.com:8080 npm start

# Secure connection (HTTPS)
OLLAMA_URL=https://ollama.example.com:11434 npm start
```

#### Docker Deployment

When running the dashboard in Docker, use environment variables to configure the Ollama connection:

```bash
# Docker run with environment variable
docker run -p 3001:3001 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  ollama-dashboard

# Docker Compose
services:
  dashboard:
    image: ollama-dashboard
    ports:
      - "3001:3001"
    environment:
      - OLLAMA_URL=http://ollama:11434
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
```

**Note**: When connecting from Docker to Ollama on the host machine, use `host.docker.internal` instead of `localhost`.

#### Validation and Error Handling

The dashboard validates the `OLLAMA_URL` format on startup:
- ✅ **Valid protocols**: `http://` and `https://`
- ❌ **Invalid protocols**: `ftp://`, `file://`, etc. will fall back to default
- ❌ **Malformed URLs**: Invalid formats will fall back to default with error logging

If an invalid URL is provided, the dashboard will:
1. Log an error message to the console
2. Fall back to `http://localhost:11434`
3. Continue running normally

#### Troubleshooting Connection Issues

**Dashboard shows "Offline" status:**
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check the OLLAMA_URL format matches `http(s)://hostname:port`
- Ensure no firewall is blocking the connection
- For remote instances, verify network connectivity: `ping hostname`

**"Invalid OLLAMA_URL" error in console:**
- Check for typos in the URL
- Ensure protocol is `http://` or `https://` (not `ftp://`, etc.)
- Verify the URL includes port number (e.g., `:11434`)
- Example valid format: `http://192.168.1.100:11434`

**Docker container cannot connect:**
- Use `host.docker.internal` instead of `localhost` when connecting to host
- Ensure Ollama is bound to `0.0.0.0` not just `127.0.0.1`
- Check Docker network configuration allows outbound connections
- Verify Ollama container is on the same Docker network (if using Docker Compose)

**Connection works locally but not remotely:**
- Ensure Ollama is configured to accept remote connections
- Check firewall rules on the Ollama host machine
- Verify the Ollama instance is bound to the correct network interface
- Test connection with: `curl http://remote-host:11434/api/tags`

### Server Port

By default, the dashboard runs on port 3001. To change this, set the `PORT` environment variable:

```bash
PORT=8080 npm start
```

You can combine both environment variables:

```bash
PORT=8080 OLLAMA_URL=http://192.168.1.100:11434 npm start
```

## API Endpoints

The dashboard backend provides the following REST API endpoints:

### Models
- `GET /api/models` - List all available models
- `GET /api/models/running` - List currently running models
- `GET /api/models/:name` - Get detailed information about a specific model

### Monitoring
- `GET /api/health` - Check Ollama server status
- `GET /api/hardware` - Get comprehensive hardware metrics
- `POST /api/generate` - Generate text using a model

**Example: Generate text**
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "prompt": "Hello, how are you?"
  }'
```

## Dashboard Sections

### Header
- Dashboard title with emoji
- Real-time Ollama server connection status

### Running Models (Top-Left)
- Compact view of currently loaded models
- Model names and resource usage
- Count badge

### Hardware Metrics (Top-Right)
- CPU usage with core count and speed
- Memory usage with total/used breakdown
- GPU information and utilization (if available)
- Disk usage with capacity information

### Available Models (Full Width)
- Expandable/collapsible list
- Model sizes and modification dates
- Family information when available

### System Statistics (Full Width)
- Total models count
- Running models count
- Last update timestamp

### Test Generation (Full Width)
- Model dropdown selector
- Prompt input textarea
- Generate button
- Response display with performance metrics

## Technologies Used

- **Backend**
  - Express.js - Web framework
  - axios - HTTP client for Ollama API
  - cors - Cross-origin resource sharing
  - systeminformation - System metrics gathering

- **Frontend**
  - HTML5
  - CSS3 (with gradients and animations)
  - Vanilla JavaScript (no frameworks)

## Performance Considerations

- Dashboard auto-refreshes every 5 seconds
- Hardware metrics are fetched on demand
- Collapsible sections help manage UI performance with many models
- Progress bars use CSS transitions for smooth animations

## Troubleshooting

### Dashboard Shows "Offline" Status
- Ensure Ollama is running on `http://localhost:11434`
- Check network connectivity
- Verify the `OLLAMA_API` URL in `server.js`

### Cannot Connect to Server
- Verify Node.js is running and the server is on the correct port
- Check for port conflicts: `lsof -i :3001` (macOS/Linux)
- Try a different port using the `PORT` environment variable

### No GPU Information Displayed
- Your system may not have a supported GPU
- Some GPUs require additional drivers for metrics collection
- This is normal and doesn't affect Ollama functionality

### Models List Not Updating
- Verify Ollama server is responsive
- Check browser console for error messages (F12)
- Try refreshing the page (Ctrl+R or Cmd+R)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
