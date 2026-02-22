#!/usr/bin/env bash
# Run JobSpy FastAPI app (for PM2 or manual start).
# Requires: pip install -r requirements.txt (in venv or system).
# Usage: ./run_api.sh   or   bash run_api.sh
set -e
cd "$(dirname "$0")"
if [ -d "venv" ]; then
  source venv/bin/activate
fi
exec python3 -m uvicorn api:app --host 0.0.0.0 --port 8000
