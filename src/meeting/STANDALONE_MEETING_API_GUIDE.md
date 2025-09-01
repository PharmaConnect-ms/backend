# Standalone Zoom Meeting API - Complete Guide

## 🎯 Overview
The standalone meeting API allows you to create Zoom meetings **without requiring an appointment ID**. This is perfect for:
- Ad-hoc consultations
- Emergency meetings
- General medical discussions
- Quick patient check-ins
- Training sessions

## 🚀 Quick Start

### Create a Standalone Meeting (Most Common Use Case)
```http
POST /meetings/standalone
Content-Type: application/json

{
  "hostEmail": "doctor@hospital.com",
  "topic": "Emergency Consultation"
}
```

**Response:**
```json
{
  "id": "standalone-meeting-uuid",
  "zoomMeetingId": "123456789",
  "joinUrl": "https://zoom.us/j/123456789?pwd=abc123",
  "startUrl": "https://zoom.us/s/123456789?zak=xyz789",
  "password": "abc123",
  "topic": "Emergency Consultation",
  "duration": 60,
  "status": "active",
  "hostEmail": "doctor@hospital.com",
  "createdAt": "2024-09-01T16:00:00Z",
  "meetingType": "standalone"
}
```

### Get Zoom Link for Frontend
```http
GET /meetings/standalone/{meeting-id}/zoom-link
```

**Response:**
```json
{
  "joinUrl": "https://zoom.us/j/123456789?pwd=abc123",
  "password": "abc123"
}
```

## 📋 Complete API Reference

### 1. Create Standalone Meeting
**Endpoint:** `POST /meetings/standalone`

**Request Body:**
```typescript
{
  hostEmail: string;           // Required - Doctor's email
  topic: string;              // Required - Meeting topic
  startTime?: string;         // Optional - ISO 8601 format for scheduled meetings
  duration?: number;          // Optional - Duration in minutes (default: 60)
  agenda?: string;           // Optional - Meeting agenda
  waitingRoom?: boolean;     // Optional - Enable waiting room (default: true)
  muteOnEntry?: boolean;     // Optional - Mute participants on entry (default: true)
  autoRecord?: boolean;      // Optional - Auto-record meeting (default: false)
}
```

**Examples:**

**Instant Meeting:**
```json
{
  "hostEmail": "dr.smith@hospital.com",
  "topic": "Emergency Patient Consultation"
}
```

**Scheduled Meeting:**
```json
{
  "hostEmail": "dr.jones@clinic.com",
  "topic": "Team Meeting",
  "startTime": "2024-09-15T14:30:00Z",
  "duration": 45,
  "agenda": "Discuss patient care protocols",
  "waitingRoom": true,
  "muteOnEntry": true,
  "autoRecord": false
}
```

**Custom Settings:**
```json
{
  "hostEmail": "dr.wilson@hospital.com",
  "topic": "Medical Training Session",
  "duration": 90,
  "waitingRoom": false,
  "muteOnEntry": false,
  "autoRecord": true
}
```

### 2. Get All Standalone Meetings
**Endpoint:** `GET /meetings/standalone`

**Response:** Array of `StandaloneMeetingResponseDto`

### 3. Get Standalone Meeting by ID
**Endpoint:** `GET /meetings/standalone/{id}`

**Response:** `StandaloneMeetingResponseDto`

### 4. Get Zoom Link for Frontend
**Endpoint:** `GET /meetings/standalone/{id}/zoom-link`

**Response:**
```json
{
  "joinUrl": "string",
  "password": "string | null"
}
```

## 💻 Frontend Integration Examples

### React/Next.js Component
```jsx
import { useState } from 'react';

function StandaloneMeetingCreator() {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);

  const createMeeting = async (hostEmail, topic) => {
    setLoading(true);
    try {
      const response = await fetch('/api/meetings/standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostEmail, topic })
      });
      
      const meetingData = await response.json();
      setMeeting(meetingData);
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = () => {
    if (meeting) {
      window.open(meeting.joinUrl, '_blank');
    }
  };

  return (
    <div className="meeting-creator">
      <h3>Create Instant Meeting</h3>
      
      <button 
        onClick={() => createMeeting('doctor@hospital.com', 'Emergency Consultation')}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Meeting'}
      </button>

      {meeting && (
        <div className="meeting-info">
          <h4>Meeting Created!</h4>
          <p><strong>Topic:</strong> {meeting.topic}</p>
          <p><strong>Meeting ID:</strong> {meeting.zoomMeetingId}</p>
          {meeting.password && <p><strong>Password:</strong> {meeting.password}</p>}
          
          <button onClick={joinMeeting} className="join-button">
            Join Meeting
          </button>
          
          <div className="meeting-links">
            <p><strong>Join URL:</strong> 
              <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">
                {meeting.joinUrl}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Vue.js Component
```vue
<template>
  <div class="standalone-meeting">
    <h3>Quick Meeting Creator</h3>
    
    <form @submit.prevent="createMeeting" v-if="!meeting">
      <div>
        <label>Host Email:</label>
        <input v-model="form.hostEmail" type="email" required />
      </div>
      
      <div>
        <label>Topic:</label>
        <input v-model="form.topic" type="text" required />
      </div>
      
      <div>
        <label>Duration (minutes):</label>
        <input v-model="form.duration" type="number" min="15" max="240" />
      </div>
      
      <div>
        <label>
          <input v-model="form.waitingRoom" type="checkbox" />
          Enable Waiting Room
        </label>
      </div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create Meeting' }}
      </button>
    </form>

    <div v-if="meeting" class="meeting-result">
      <h4>Meeting Ready!</h4>
      <div class="meeting-card">
        <p><strong>{{ meeting.topic }}</strong></p>
        <p>Meeting ID: {{ meeting.zoomMeetingId }}</p>
        <p v-if="meeting.password">Password: {{ meeting.password }}</p>
        
        <div class="actions">
          <a :href="meeting.joinUrl" target="_blank" class="join-btn">
            Join Meeting
          </a>
          <button @click="copyLink" class="copy-btn">
            Copy Link
          </button>
          <button @click="reset" class="reset-btn">
            Create Another
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      meeting: null,
      loading: false,
      form: {
        hostEmail: 'doctor@hospital.com',
        topic: 'Medical Consultation',
        duration: 60,
        waitingRoom: true
      }
    };
  },
  
  methods: {
    async createMeeting() {
      this.loading = true;
      
      try {
        const response = await fetch('/api/meetings/standalone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });
        
        if (!response.ok) throw new Error('Failed to create meeting');
        
        this.meeting = await response.json();
      } catch (error) {
        alert('Failed to create meeting: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.meeting.joinUrl);
        alert('Meeting link copied!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    },
    
    reset() {
      this.meeting = null;
    }
  }
};
</script>
```

### Angular Service + Component
```typescript
// meeting.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface StandaloneMeetingRequest {
  hostEmail: string;
  topic: string;
  duration?: number;
  waitingRoom?: boolean;
  muteOnEntry?: boolean;
  autoRecord?: boolean;
}

interface StandaloneMeetingResponse {
  id: string;
  zoomMeetingId: string;
  joinUrl: string;
  startUrl: string;
  password?: string;
  topic: string;
  duration: number;
  status: string;
  hostEmail: string;
  createdAt: string;
  meetingType: string;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private readonly apiUrl = '/api/meetings/standalone';

  constructor(private http: HttpClient) {}

  createStandaloneMeeting(request: StandaloneMeetingRequest): Observable<StandaloneMeetingResponse> {
    return this.http.post<StandaloneMeetingResponse>(this.apiUrl, request);
  }

  getMeetingLink(meetingId: string): Observable<{ joinUrl: string; password?: string }> {
    return this.http.get<{ joinUrl: string; password?: string }>(`${this.apiUrl}/${meetingId}/zoom-link`);
  }

  getAllStandaloneMeetings(): Observable<StandaloneMeetingResponse[]> {
    return this.http.get<StandaloneMeetingResponse[]>(this.apiUrl);
  }
}

// meeting-creator.component.ts
import { Component } from '@angular/core';
import { MeetingService } from './meeting.service';

@Component({
  selector: 'app-meeting-creator',
  template: `
    <div class="meeting-creator">
      <h3>Create Standalone Meeting</h3>
      
      <form (ngSubmit)="createMeeting()" *ngIf="!meeting">
        <div>
          <label>Host Email:</label>
          <input [(ngModel)]="form.hostEmail" type="email" name="hostEmail" required>
        </div>
        
        <div>
          <label>Topic:</label>
          <input [(ngModel)]="form.topic" type="text" name="topic" required>
        </div>
        
        <div>
          <label>Duration (minutes):</label>
          <input [(ngModel)]="form.duration" type="number" name="duration" min="15" max="240">
        </div>
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Creating...' : 'Create Meeting' }}
        </button>
      </form>

      <div *ngIf="meeting" class="meeting-result">
        <h4>Meeting Created!</h4>
        <div class="meeting-info">
          <p><strong>Topic:</strong> {{ meeting.topic }}</p>
          <p><strong>Meeting ID:</strong> {{ meeting.zoomMeetingId }}</p>
          <p *ngIf="meeting.password"><strong>Password:</strong> {{ meeting.password }}</p>
          
          <div class="actions">
            <a [href]="meeting.joinUrl" target="_blank" class="join-button">
              Join Meeting
            </a>
            <button (click)="resetForm()" class="reset-button">
              Create Another
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MeetingCreatorComponent {
  meeting: any = null;
  loading = false;
  
  form = {
    hostEmail: 'doctor@hospital.com',
    topic: 'Medical Consultation',
    duration: 60,
    waitingRoom: true
  };

  constructor(private meetingService: MeetingService) {}

  createMeeting() {
    this.loading = true;
    
    this.meetingService.createStandaloneMeeting(this.form).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to create meeting:', error);
        this.loading = false;
        alert('Failed to create meeting');
      }
    });
  }

  resetForm() {
    this.meeting = null;
  }
}
```

### JavaScript/HTML Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Standalone Meeting Creator</title>
</head>
<body>
    <div id="meeting-app">
        <h3>Create Instant Meeting</h3>
        
        <form id="meeting-form">
            <div>
                <label>Host Email:</label>
                <input type="email" id="hostEmail" value="doctor@hospital.com" required>
            </div>
            
            <div>
                <label>Meeting Topic:</label>
                <input type="text" id="topic" value="Emergency Consultation" required>
            </div>
            
            <div>
                <label>Duration (minutes):</label>
                <input type="number" id="duration" value="60" min="15" max="240">
            </div>
            
            <div>
                <label>
                    <input type="checkbox" id="waitingRoom" checked>
                    Enable Waiting Room
                </label>
            </div>
            
            <button type="submit">Create Meeting</button>
        </form>
        
        <div id="meeting-result" style="display: none;">
            <h4>Meeting Created!</h4>
            <div id="meeting-info"></div>
        </div>
    </div>

    <script>
        document.getElementById('meeting-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                hostEmail: document.getElementById('hostEmail').value,
                topic: document.getElementById('topic').value,
                duration: parseInt(document.getElementById('duration').value),
                waitingRoom: document.getElementById('waitingRoom').checked
            };
            
            try {
                const response = await fetch('/api/meetings/standalone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) throw new Error('Failed to create meeting');
                
                const meeting = await response.json();
                displayMeeting(meeting);
                
            } catch (error) {
                alert('Failed to create meeting: ' + error.message);
            }
        });
        
        function displayMeeting(meeting) {
            const resultDiv = document.getElementById('meeting-result');
            const infoDiv = document.getElementById('meeting-info');
            
            infoDiv.innerHTML = `
                <p><strong>Topic:</strong> ${meeting.topic}</p>
                <p><strong>Meeting ID:</strong> ${meeting.zoomMeetingId}</p>
                ${meeting.password ? `<p><strong>Password:</strong> ${meeting.password}</p>` : ''}
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                
                <div style="margin-top: 20px;">
                    <a href="${meeting.joinUrl}" target="_blank" 
                       style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Join Meeting
                    </a>
                    <button onclick="copyToClipboard('${meeting.joinUrl}')" 
                            style="margin-left: 10px; padding: 10px 15px;">
                        Copy Link
                    </button>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                    <strong>Share this link:</strong><br>
                    <input type="text" value="${meeting.joinUrl}" readonly 
                           style="width: 100%; padding: 5px; margin-top: 5px;">
                </div>
            `;
            
            document.getElementById('meeting-form').style.display = 'none';
            resultDiv.style.display = 'block';
        }
        
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Meeting link copied to clipboard!');
            });
        }
    </script>
</body>
</html>
```

## 📱 Mobile Integration

### React Native Example
```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, Alert } from 'react-native';

export default function StandaloneMeetingCreator() {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hostEmail: 'doctor@hospital.com',
    topic: 'Mobile Consultation'
  });

  const createMeeting = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('https://your-api.com/api/meetings/standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!response.ok) throw new Error('Failed to create meeting');
      
      const meetingData = await response.json();
      setMeeting(meetingData);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create meeting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = () => {
    if (meeting) {
      Linking.openURL(meeting.joinUrl);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Create Instant Meeting
      </Text>
      
      {!meeting ? (
        <>
          <TextInput
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            placeholder="Host Email"
            value={form.hostEmail}
            onChangeText={(text) => setForm({...form, hostEmail: text})}
            keyboardType="email-address"
          />
          
          <TextInput
            style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
            placeholder="Meeting Topic"
            value={form.topic}
            onChangeText={(text) => setForm({...form, topic: text})}
          />
          
          <TouchableOpacity
            style={{ 
              backgroundColor: '#0066cc', 
              padding: 15, 
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={createMeeting}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Meeting Ready!
          </Text>
          
          <Text style={{ marginBottom: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>Topic:</Text> {meeting.topic}
          </Text>
          
          <Text style={{ marginBottom: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>Meeting ID:</Text> {meeting.zoomMeetingId}
          </Text>
          
          {meeting.password && (
            <Text style={{ marginBottom: 15 }}>
              <Text style={{ fontWeight: 'bold' }}>Password:</Text> {meeting.password}
            </Text>
          )}
          
          <TouchableOpacity
            style={{ 
              backgroundColor: '#00aa00', 
              padding: 15, 
              borderRadius: 8,
              alignItems: 'center',
              width: '100%'
            }}
            onPress={joinMeeting}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              Join Meeting
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ 
              backgroundColor: '#666666', 
              padding: 10, 
              borderRadius: 8,
              alignItems: 'center',
              width: '100%',
              marginTop: 10
            }}
            onPress={() => setMeeting(null)}
          >
            <Text style={{ color: 'white' }}>
              Create Another Meeting
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

## 🔒 Security & Best Practices

1. **Validate Host Permissions**: Ensure only authorized users can create meetings
2. **Rate Limiting**: Implement rate limiting on meeting creation
3. **Meeting Expiry**: Consider implementing automatic meeting cleanup
4. **Audit Logging**: Log all meeting creation activities
5. **Environment Variables**: Keep Zoom credentials secure

## 🎯 Use Cases

### Emergency Consultations
```javascript
const emergencyMeeting = await createStandaloneMeeting({
  hostEmail: 'emergency@hospital.com',
  topic: 'Emergency Patient Consultation',
  waitingRoom: false, // Skip waiting room for emergencies
  muteOnEntry: true
});
```

### Training Sessions
```javascript
const trainingMeeting = await createStandaloneMeeting({
  hostEmail: 'trainer@hospital.com',
  topic: 'Medical Staff Training',
  duration: 120,
  autoRecord: true, // Record for later review
  waitingRoom: true
});
```

### Quick Check-ins
```javascript
const quickMeeting = await createStandaloneMeeting({
  hostEmail: 'doctor@clinic.com',
  topic: 'Patient Follow-up',
  duration: 15, // Short meeting
  muteOnEntry: true
});
```

This standalone meeting API gives you complete flexibility to create Zoom meetings on-demand without any appointment constraints! 🚀
