# Zoom Meeting API Documentation

## Overview
The restructured meeting module provides a clean REST API to create and manage Zoom meetings for medical appointments. This API abstracts all Zoom complexity and provides simple endpoints that can be easily integrated into your frontend application.

## Quick Start

### 1. Setup Environment Variables
```env
ZOOM_API_KEY=your_zoom_api_key_here
ZOOM_API_SECRET=your_zoom_api_secret_here
```

### 2. Create a Quick Meeting (Most Common Use Case)
```http
POST /meetings/quick
Content-Type: application/json

{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "hostEmail": "doctor@hospital.com",
  "topic": "Emergency Consultation"
}
```

**Response:**
```json
{
  "id": "meeting-uuid",
  "zoomMeetingId": "123456789",
  "joinUrl": "https://zoom.us/j/123456789?pwd=abc123",
  "startUrl": "https://zoom.us/s/123456789?zak=xyz789",
  "password": "abc123",
  "status": "active",
  "topic": "Emergency Consultation",
  "duration": 60,
  "hostEmail": "doctor@hospital.com",
  "createdAt": "2024-09-01T10:30:00Z",
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. Get Zoom Link for Frontend Integration
```http
GET /meetings/zoom-link/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "joinUrl": "https://zoom.us/j/123456789?pwd=abc123",
  "password": "abc123"
}
```

## Complete API Reference

### Create Instant Meeting
Create an immediate Zoom meeting that starts right away.

**Endpoint:** `POST /meetings/quick`

**Request Body:**
```json
{
  "appointmentId": "string (required)",
  "hostEmail": "string (required, valid email)",
  "topic": "string (optional)"
}
```

**Response:** `MeetingResponseDto`

---

### Create Scheduled Meeting
Create a Zoom meeting scheduled for a specific time.

**Endpoint:** `POST /meetings`

**Request Body:**
```json
{
  "appointmentId": "string (required)",
  "hostEmail": "string (required, valid email)",
  "topic": "string (required)",
  "startTime": "string (optional, ISO 8601 format)",
  "duration": "number (optional, minutes, default: 60)",
  "agenda": "string (optional)"
}
```

**Example:**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "hostEmail": "dr.smith@hospital.com",
  "topic": "Follow-up Consultation",
  "startTime": "2024-09-15T14:30:00Z",
  "duration": 45,
  "agenda": "Review test results and discuss treatment options"
}
```

---

### Get Meeting by Appointment ID
Retrieve meeting details for a specific appointment.

**Endpoint:** `GET /meetings/appointment/{appointmentId}`

**Response:** `MeetingResponseDto`

---

### Get Zoom Link Only
Get just the Zoom join URL and password - perfect for frontend embedding.

**Endpoint:** `GET /meetings/zoom-link/{appointmentId}`

**Response:**
```json
{
  "joinUrl": "string",
  "password": "string | null"
}
```

---

### Get All Meetings
Retrieve all meetings with pagination support.

**Endpoint:** `GET /meetings`

**Response:** `MeetingResponseDto[]`

---

### Delete Meeting
Delete a meeting from both the database and Zoom.

**Endpoint:** `DELETE /meetings/{meetingId}`

**Response:** `204 No Content`

## Frontend Integration Examples

### React/Next.js Example
```jsx
import { useState, useEffect } from 'react';

function ZoomMeeting({ appointmentId }) {
  const [meetingLink, setMeetingLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMeetingLink() {
      try {
        const response = await fetch(`/api/meetings/zoom-link/${appointmentId}`);
        if (!response.ok) throw new Error('Failed to fetch meeting link');
        
        const data = await response.json();
        setMeetingLink(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMeetingLink();
  }, [appointmentId]);

  if (loading) return <div>Loading meeting...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="meeting-container">
      <h3>Join Your Medical Consultation</h3>
      <a 
        href={meetingLink.joinUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="zoom-join-button"
      >
        Join Zoom Meeting
      </a>
      {meetingLink.password && (
        <p>Meeting Password: <strong>{meetingLink.password}</strong></p>
      )}
    </div>
  );
}
```

### Angular Example
```typescript
import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-zoom-meeting',
  template: `
    <div *ngIf="meetingLink" class="meeting-container">
      <h3>Join Your Medical Consultation</h3>
      <a [href]="meetingLink.joinUrl" 
         target="_blank" 
         class="zoom-join-button">
        Join Zoom Meeting
      </a>
      <p *ngIf="meetingLink.password">
        Meeting Password: <strong>{{meetingLink.password}}</strong>
      </p>
    </div>
    <div *ngIf="loading">Loading meeting...</div>
    <div *ngIf="error">Error: {{error}}</div>
  `
})
export class ZoomMeetingComponent implements OnInit {
  @Input() appointmentId: string;
  meetingLink: any = null;
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(`/api/meetings/zoom-link/${this.appointmentId}`)
      .subscribe({
        next: (data) => {
          this.meetingLink = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }
}
```

### Vue.js Example
```vue
<template>
  <div class="meeting-container">
    <div v-if="loading">Loading meeting...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="meetingLink">
      <h3>Join Your Medical Consultation</h3>
      <a 
        :href="meetingLink.joinUrl" 
        target="_blank" 
        class="zoom-join-button"
      >
        Join Zoom Meeting
      </a>
      <p v-if="meetingLink.password">
        Meeting Password: <strong>{{ meetingLink.password }}</strong>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['appointmentId'],
  data() {
    return {
      meetingLink: null,
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const response = await fetch(`/api/meetings/zoom-link/${this.appointmentId}`);
      if (!response.ok) throw new Error('Failed to fetch meeting link');
      
      this.meetingLink = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
```

## Creating Meetings from Your Frontend

### Quick Meeting Creation
```javascript
async function createQuickMeeting(appointmentId, hostEmail) {
  const response = await fetch('/api/meetings/quick', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appointmentId,
      hostEmail,
      topic: 'Medical Consultation'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create meeting');
  }

  return response.json();
}
```

### Scheduled Meeting Creation
```javascript
async function createScheduledMeeting(meetingData) {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meetingData)
  });

  if (!response.ok) {
    throw new Error('Failed to create scheduled meeting');
  }

  return response.json();
}

// Usage
const meeting = await createScheduledMeeting({
  appointmentId: 'appointment-uuid',
  hostEmail: 'doctor@hospital.com',
  topic: 'Follow-up Consultation',
  startTime: '2024-09-15T14:30:00Z',
  duration: 45,
  agenda: 'Discuss treatment progress'
});
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK` - Successful retrieval
- `201 Created` - Successful creation
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Meeting already exists for appointment appointment-id",
  "error": "Bad Request"
}
```

## Best Practices

1. **Cache meeting links** on the frontend to avoid unnecessary API calls
2. **Handle errors gracefully** - provide fallback options for users
3. **Validate appointment ownership** before creating meetings
4. **Use environment variables** for all sensitive configuration
5. **Implement rate limiting** on meeting creation endpoints
6. **Log meeting activities** for audit purposes

## Security Considerations

- Never expose Zoom API credentials in frontend code
- Implement proper authentication for meeting endpoints
- Validate user permissions before allowing meeting access
- Use HTTPS for all API communications
- Consider implementing meeting access tokens for additional security
