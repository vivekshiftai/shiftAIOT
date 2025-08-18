#!/bin/bash
cd /home/ialuser/KB1/project
source venv/bin/activate
exec uvicorn main:app --host 0.0.0.0 --port 8000
