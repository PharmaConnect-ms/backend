# Meeting Module with Zoom Integration

This module has been restructured to use Zoom API instead of Jitsi Meet. It provides a clean API to create, manage, and access Zoom meetings for medical appointments.

## Features

- Create scheduled Zoom meetings
- Create instant/quick Zoom meetings
- Get Zoom meeting details by appointment ID
- Get direct Zoom links for embedding in frontend
- Delete meetings (both from database and Zoom)
- Automatic Zoom meeting management

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
ZOOM_API_KEY=your_zoom_api_key_here
ZOOM_API_SECRET=your_zoom_api_secret_here
```

### 2. Get Zoom API Credentials

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account
3. Click "Build App"
4. Choose "Server-to-Server OAuth" app type
5. Fill in the app information
6. In the "App Credentials" section, copy your API Key and API Secret

### 3. Database Migration

The Meeting entity has been updated with new fields. You may need to run a database migration:

```sql
-- Example migration (adjust based on your database)
ALTER TABLE meeting 
DROP COLUMN roomLink,
DROP COLUMN meetingId,
ADD COLUMN zoom_meeting_id VARCHAR(255) NOT NULL,
ADD COLUMN join_url TEXT NOT NULL,
ADD COLUMN start_url TEXT NOT NULL,
ADD COLUMN password VARCHAR(255),
ADD COLUMN topic VARCHAR(255),
ADD COLUMN start_time DATETIME,
ADD COLUMN duration INT DEFAULT 60,
ADD COLUMN agenda TEXT,
ADD COLUMN host_email VARCHAR(255) NOT NULL,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

## API Endpoints

### 1. Create Quick Meeting (Instant)
```http
POST /meetings/quick
Content-Type: application/json

{
  "appointmentId": "appointment-uuid",
  "hostEmail": "doctor@example.com",
  "topic": "Emergency Consultation" // optional
}
```

### 2. Create Scheduled Meeting
```http
POST /meetings
Content-Type: application/json

{
  "appointmentId": "appointment-uuid",
  "hostEmail": "doctor@example.com",
  "topic": "Follow-up Consultation",
  "startTime": "2024-09-15T10:00:00Z", // optional
  "duration": 60, // optional, default 60 minutes
  "agenda": "Patient follow-up consultation" // optional
}
```

### 3. Get Zoom Link for Frontend
```http
GET /meetings/zoom-link/{appointmentId}
```

Response:
```json
{
  "joinUrl": "https://zoom.us/j/123456789?pwd=abcd1234",
  "password": "abc123"
}
```

### 4. Get Meeting by Appointment ID
```http
GET /meetings/appointment/{appointmentId}
```

### 5. Get All Meetings
```http
GET /meetings
```

### 6. Delete Meeting
```http
DELETE /meetings/{meetingId}
```

## Frontend Integration

### Embedding Zoom in Your Frontend

You can use the Zoom link in several ways:

#### Option 1: Direct Link
```javascript
// Get the meeting link
const response = await fetch(`/api/meetings/zoom-link/${appointmentId}`);
const { joinUrl, password } = await response.json();

// Open in new tab/window
window.open(joinUrl, '_blank');
```

#### Option 2: Embed Zoom Web SDK
```javascript
import { ZoomMtg } from '@zoomus/websdk';

// Initialize Zoom SDK
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

// Join meeting
const meetingConfig = {
  meetingNumber: meetingId,
  password: password,
  userName: 'Patient Name',
  userEmail: 'patient@example.com',
  success: (success) => {
    console.log('Meeting started', success);
  },
  error: (error) => {
    console.log('Error starting meeting', error);
  }
};

ZoomMtg.join(meetingConfig);
```

#### Option 3: iFrame Embed
```html
<iframe 
  src="https://zoom.us/wc/join/123456789?pwd=abcd1234&uname=PatientName"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

## Usage Examples

### Create an instant meeting for urgent consultation:
```typescript
const quickMeeting = await meetingService.createQuickMeeting({
  appointmentId: 'urgent-appointment-id',
  hostEmail: 'doctor@hospital.com',
  topic: 'Urgent Medical Consultation'
});

// Use quickMeeting.joinUrl in your frontend
```

### Create a scheduled meeting:
```typescript
const scheduledMeeting = await meetingService.createMeeting({
  appointmentId: 'scheduled-appointment-id',
  hostEmail: 'doctor@hospital.com',
  topic: 'Follow-up Consultation',
  startTime: '2024-09-15T10:00:00Z',
  duration: 45,
  agenda: 'Review test results and discuss treatment plan'
});
```

### Get meeting link for frontend:
```typescript
const zoomLink = await meetingService.getZoomLink('appointment-id');
// Returns: { joinUrl: '...', password: '...' }
```

## Security Notes

- Store Zoom API credentials securely in environment variables
- Never expose API credentials in frontend code
- Use proper authentication for your meeting endpoints
- Consider implementing rate limiting for meeting creation endpoints
- Validate appointment ownership before creating meetings

## Migration from Jitsi

The old Jitsi-related files can be removed:
- `jaasJWTTokenGenerator.ts`
- `/certs/jists/` directory
- Any Jitsi-specific environment variables

The new Zoom integration provides better reliability, security, and features for medical consultations.
