# Infra Diagnostics Agent

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

![Terminal Demo](demo.gif)

> **An autonomous Python agent that hooks into Kubernetes and Prometheus infrastructure to diagnose and fix complex operational issues.**

## Key Features
- **Automated root-cause analysis for microservices**
- **Integration with standard DevOps telemetry**
- **Self-healing incident response capabilities**

## Architecture

```mermaid
flowchart TD
    A[Alert Webhook] --> B(Agent Orchestrator)
    B --> C{Tool Selector}
    C -->|Fetch Logs| D[Log Aggregator]
    C -->|Check Metrics| E[Prometheus]
    C -->|Inspect State| F[Kubernetes API]
    D & E & F --> B
    B --> G[Slack Notification + Fix Root Cause]
```

## Live API Endpoint (Vercel)

This project is deployed serverless via Vercel Edge Functions. You can test the interaction directly from your terminal.

```bash
# Example Request
curl -X GET https://infra-diagnostics-agent-j2f4f552o-dev4aibots.vercel.app/api/health
```

## Developer Quickstart

### Prerequisites
- Python 3.11+
- Node.js (for Vercel CLI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dev4aibots/infra-diagnostics-agent.git
   cd infra-diagnostics-agent
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## Project Structure
```
.
├── api/                  # Vercel serverless endpoints
├── src/                  # Core Python modules & agent logic
├── tests/                # Unit and integration tests
├── public/               # Static assets
├── requirements.txt      # Python dependencies
└── vercel.json           # Vercel routing configuration
```

## License
This project is licensed under the MIT License.
