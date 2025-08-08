# IoT Platform

A comprehensive IoT platform with AI-powered device management, PDF processing, and real-time monitoring.

## Quick Start

### Run All Services (Recommended)
```bash
npm run dev:all
```

This will start all three services:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080  
- **RAG System**: http://localhost:8000

### Run Individual Services

```bash
# Frontend only
npm run dev

# Frontend + Backend
npm run dev:full

# Backend only
npm run backend:dev

# RAG System only
npm run rag:dev
```

## Prerequisites

- **Node.js 16+** with npm
- **Java 11+** with Maven
- **Python 3.7+** with pip

## Features

- 🔐 **Authentication & Authorization**
- 📱 **Device Management** with AI-powered onboarding
- 📊 **Real-time Telemetry** monitoring
- 🤖 **AI-Powered PDF Processing** with RAG system
- 📋 **Rule Engine** for automated actions
- 🔔 **Notification System**
- 📈 **Analytics Dashboard**

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Spring Boot + Java
- **RAG System**: Python FastAPI + Vector Database
- **Database**: PostgreSQL
- **Real-time**: MQTT

## Development

```bash
# Install dependencies
npm install

# Build backend
npm run backend:build

# Run tests
npm run lint
```

## API Documentation

- **Backend API**: http://localhost:8080/api
- **RAG System API**: http://localhost:8000

## Troubleshooting

### Port Conflicts
If ports are already in use:
- **Frontend (5173)**: Check `vite.config.ts`
- **Backend (8080)**: Check `backend/src/main/resources/application.properties`
- **RAG System (8000)**: Check `pdf_rag_system/main.py`

### Service Dependencies
Services start in order: RAG → Backend → Frontend