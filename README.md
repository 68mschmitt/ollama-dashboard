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
http://localhost:3000
```

## Configuration

### Ollama Server URL

By default, the dashboard connects to Ollama at `http://localhost:11434`. To change this, edit the `OLLAMA_API` constant in `server.js`:

```javascript
const OLLAMA_API = 'http://localhost:11434'; // Change this URL
```

### Server Port

By default, the dashboard runs on port 3000. To change this, set the `PORT` environment variable:

```bash
PORT=8080 npm start
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
curl -X POST http://localhost:3000/api/generate \
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
- Check for port conflicts: `lsof -i :3000` (macOS/Linux)
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
