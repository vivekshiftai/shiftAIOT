# Device Onboarding System

A comprehensive IoT device onboarding system with AI-powered PDF processing, intelligent rule generation, and interactive chat interface.

## Features

### 1. Loading Screens
- **Three-Stage Process Visualization**: Distinct loading screens for each of the three sequential processes
- **Real-time Progress Tracking**: Visual progress indicators with detailed sub-stage information
- **Animated UI Elements**: Smooth animations and transitions for better user experience
- **Error Handling**: Graceful error handling with retry mechanisms

#### Process Stages:
1. **PDF Processing & Git Storage** (0-33%)
   - Uploading PDF
   - Extracting Content
   - Parsing Structure
   - Initializing Git Repository
   - Committing to Git
   - Creating Search Index

2. **Rules Querying & Generation** (33-66%)
   - Analyzing device specifications
   - Identifying monitoring parameters
   - Generating alert rules
   - Creating automation workflows
   - Validating rule logic
   - Optimizing performance

3. **Knowledge Base Creation** (66-100%)
   - Vectorizing document content
   - Creating semantic embeddings
   - Building search index
   - Training AI model
   - Setting up chat interface
   - Testing query system

### 2. Success Notification
- **Comprehensive Summary**: Detailed overview of completed processes
- **Processing Statistics**: Real-time processing metrics and performance data
- **Feature Highlights**: Visual representation of generated rules and capabilities
- **Action Buttons**: Direct access to chat interface and dashboard

### 3. Chat Interface
- **PDF-Integrated Queries**: Ask questions about uploaded device documentation
- **Device Information Display**: Shows device name and PDF filename prominently
- **AI-Powered Responses**: Context-aware answers based on document content
- **Metadata Display**: Shows source, page numbers, and confidence scores
- **Suggested Questions**: Quick access to common queries

## Technology Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PDF Processing**: External API integration
- **State Management**: React Hooks
- **API Communication**: Fetch API with axios

## Components

### Core Components

1. **DeviceOnboardingForm** (`src/components/Devices/DeviceOnboardingForm.tsx`)
   - Main onboarding form with three-step wizard
   - File upload and device configuration
   - Integration with PDF processing API
   - Progress tracking and state management

2. **DeviceOnboardingLoader** (`src/components/Loading/DeviceOnboardingLoader.tsx`)
   - Comprehensive loading screen with three-stage visualization
   - Real-time progress tracking
   - Sub-stage progress indicators
   - Error handling and retry mechanisms

3. **DeviceOnboardingSuccess** (`src/components/Devices/DeviceOnboardingSuccess.tsx`)
   - Success notification with detailed process summary
   - Processing statistics and metrics
   - Feature highlights and capabilities
   - Action buttons for next steps

4. **DeviceChatInterface** (`src/components/Devices/DeviceChatInterface.tsx`)
   - AI-powered chat interface
   - PDF content querying
   - Device information display
   - Message history and metadata

### Supporting Components

5. **DeviceOnboardingDemo** (`src/components/Devices/DeviceOnboardingDemo.tsx`)
   - Complete demo flow showcasing all features
   - Step-by-step progression visualization
   - Reset functionality for testing

## API Integration

### PDF Processing Service
- **Upload**: `pdfProcessingService.uploadPDF(file)`
- **Query**: `pdfProcessingService.queryPDF(request)`
- **Rules Generation**: `pdfProcessingService.generateRules(request)`
- **Status Check**: `pdfProcessingService.checkPDFStatus(filename)`

### Service Configuration
- **Base URL**: `http://20.75.50.202:8000`
- **Endpoints**:
  - `/upload-pdf/` - PDF upload and processing
  - `/query/` - PDF content querying
  - `/rules/` - IoT rules generation
  - `/pdfs/` - PDF management

## Usage

### Basic Implementation

```tsx
import { DeviceOnboardingForm } from './components/Devices/DeviceOnboardingForm';

function App() {
  const handleOnboardingComplete = async (deviceData, uploadedFile) => {
    // Handle completed onboarding
    console.log('Device onboarded:', deviceData);
  };

  return (
    <DeviceOnboardingForm
      onSubmit={handleOnboardingComplete}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

### Demo Mode

```tsx
import { DeviceOnboardingDemo } from './components/Devices/DeviceOnboardingDemo';

function App() {
  return (
    <DeviceOnboardingDemo
      onClose={() => console.log('Demo closed')}
    />
  );
}
```

## File Structure

```
src/
├── components/
│   ├── Devices/
│   │   ├── DeviceOnboardingForm.tsx      # Main onboarding form
│   │   ├── DeviceOnboardingSuccess.tsx   # Success notification
│   │   ├── DeviceChatInterface.tsx       # Chat interface
│   │   └── DeviceOnboardingDemo.tsx      # Demo component
│   └── Loading/
│       └── DeviceOnboardingLoader.tsx    # Loading screens
├── services/
│   ├── pdfProcessingService.ts           # PDF processing API
│   └── pdfApiService.ts                  # Alternative API service
└── types/
    └── device.ts                         # TypeScript interfaces
```

## Configuration

### Environment Variables
```env
REACT_APP_PDF_PROCESSING_API_URL=http://20.75.50.202:8000
```

### API Configuration
```typescript
// src/config/api.ts
export const getApiConfig = () => ({
  PDF_PROCESSING_API_URL: process.env.REACT_APP_PDF_PROCESSING_API_URL || 'http://20.75.50.202:8000'
});
```

## Error Handling

The system includes comprehensive error handling:

1. **Network Errors**: Graceful fallback with user-friendly messages
2. **API Failures**: Retry mechanisms with exponential backoff
3. **File Upload Errors**: Validation and error reporting
4. **Processing Failures**: Fallback to mock data when APIs are unavailable

## Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablet screens
- **Desktop Enhancement**: Enhanced features for larger screens
- **Touch-Friendly**: Optimized for touch interactions

## Performance Optimizations

1. **Lazy Loading**: Components loaded on demand
2. **Memoization**: React.memo for expensive components
3. **Debounced Input**: Optimized search and input handling
4. **Virtual Scrolling**: For large message lists
5. **Image Optimization**: Compressed and optimized images

## Testing

### Manual Testing Checklist

- [ ] PDF upload functionality
- [ ] Three-stage loading process
- [ ] Success notification display
- [ ] Chat interface functionality
- [ ] Error handling scenarios
- [ ] Responsive design on different screen sizes
- [ ] API integration testing

### Automated Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test DeviceOnboardingForm.test.tsx
```

## Future Enhancements

1. **Real-time Collaboration**: Multi-user device management
2. **Advanced Analytics**: Processing performance metrics
3. **Custom Rule Templates**: User-defined rule patterns
4. **Multi-language Support**: Internationalization
5. **Offline Mode**: Local processing capabilities
6. **Integration APIs**: Third-party service connections

## Troubleshooting

### Common Issues

1. **PDF Upload Fails**
   - Check file size limits
   - Verify file format (PDF only)
   - Ensure network connectivity

2. **Processing Stuck**
   - Check API service status
   - Verify API credentials
   - Review browser console for errors

3. **Chat Not Working**
   - Verify PDF processing completion
   - Check API endpoint availability
   - Review network connectivity

### Debug Mode

Enable debug logging by setting:
```typescript
localStorage.setItem('debug', 'true');
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

