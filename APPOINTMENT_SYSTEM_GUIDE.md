# Restructured Appointment System - Setup Guide (Updated: Aug 29, 2025)

## Overview

The appointment system has been completely restructured to support:

1. **Admin-managed date-specific doctor schedules** with time slots
2. **Time slot-based booking** (like movie theater booking)  
3. **Automatic Jitsi meeting creation** for online appointments
4. **Status management** for appointments and time slots
5. **Date-specific scheduling** instead of recurring weekly patterns

## New Entities

### 1. DoctorSchedule (Updated)
- Manages when doctors are available for **specific dates**
- Defines time ranges and slot duration per date
- Unique constraint on doctor + date combination
- Created by admins for individual dates

### 2. TimeSlot  
- Individual bookable time slots generated from doctor schedules
- Has availability status (available, booked, completed, etc.)
- Links to appointments when booked
- Generated for specific dates only

### 3. Enhanced Appointment
- Now linked to specific time slots
- Supports both online and physical meetings
- Automatic Jitsi meeting creation for online appointments

## API Endpoints

### Doctor Schedule Management (Admin)

```bash
# Create date-specific doctor schedule
POST /doctor-schedules
{
  "doctorId": 1,
  "date": "2025-06-08",
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDurationMinutes": 30
}

# Get all schedules
GET /doctor-schedules

# Get schedules by date range
GET /doctor-schedules/date-range?startDate=2025-06-01&endDate=2025-06-30

# Get schedules for a specific doctor (with optional date filtering)
GET /doctor-schedules/doctor/1?startDate=2025-06-01&endDate=2025-06-30

# Update schedule
PUT /doctor-schedules/:id
{
  "date": "2025-06-09",
  "startTime": "10:00",
  "endTime": "16:00"
}
```

### Time Slot Management

```bash
# Generate time slots for a specific schedule (Admin) - Recommended
POST /time-slots/generate/:scheduleId

# Generate time slots with date range validation (Admin) - Legacy
POST /time-slots/generate
{
  "doctorScheduleId": "uuid-here", 
  "startDate": "2025-06-08",
  "endDate": "2025-06-08"
}

# Get available slots for a doctor (Patient)
GET /time-slots/available/1?startDate=2025-06-08&endDate=2025-06-15

# Get all slots for a doctor (Doctor)
GET /time-slots/doctor/1

# Update slot status (Doctor)
PUT /time-slots/:id/status
{
  "status": "completed",
  "notes": "Patient consultation completed"
}
```

### Appointment Booking (Patient)

```bash
# Book an appointment
POST /appointments
{
  "timeSlotId": "uuid-here",
  "patientId": 2,
  "type": "online",
  "notes": "Follow-up consultation"
}

# Get user's appointments
GET /appointments/user/2

# Update appointment status (Doctor)
PUT /appointments/:id/status
{
  "status": "completed",
  "notes": "Consultation completed successfully"
}
```

## Workflow (Updated for Date-Specific Scheduling)

### 1. Admin Setup (Per Date Basis)
1. Create doctor schedules for specific dates (e.g., June 8th, 2025)
2. Generate time slots for each schedule immediately or on-demand
3. Monitor and adjust doctor availability as needed

### 2. Patient Booking
1. Patient views available time slots for a doctor
2. Patient selects a slot and books appointment
3. For online appointments, Jitsi meeting link is auto-created
4. Time slot status changes to "booked"

### 3. Doctor Workflow
1. Doctor views their booked time slots for the day
2. For online appointments, uses the provided Jitsi link
3. After consultation, updates appointment status to "completed"
4. Time slot status automatically updates

## Key Features

- ✅ **Date-Specific Scheduling**: Create schedules for individual dates
- ✅ **Time Slot Management**: Like movie theater booking experience
- ✅ **Automatic Meeting Creation**: Jitsi links for online appointments
- ✅ **Status Tracking**: Complete appointment lifecycle management
- ✅ **Flexible Scheduling**: Different schedules for each date
- ✅ **Conflict Prevention**: No double-booking possible
- ✅ **Admin Control**: Centralized schedule management with date filtering

## Database Tables (Updated Schema)

- `doctor_schedule`: Date-specific schedules for doctors (updated with date field)
- `time_slot`: Individual bookable time slots (linked to specific dates)
- `appointment`: Booking records with enhanced features
- `meeting`: Jitsi meeting information (unchanged)

## Latest Updates (Aug 29, 2025)

✅ **Converted to Date-Specific Scheduling**
- Replaced day-of-week recurring patterns with specific date scheduling
- Added unique constraint on doctor + date combination  
- Enhanced API endpoints with date range filtering
- Updated time slot generation for individual schedules

✅ **Server Status**: Running successfully on http://localhost:5000
✅ **All Endpoints**: Properly mapped and accessible via Swagger

## Environment Setup

Make sure your database supports the new entities by running migrations:

```bash
npm run build
# Database migrations will run automatically on next startup
```

## Next Steps

1. Update frontend for date-specific scheduling UI
2. Create admin interface with date picker for schedule management
3. Update patient booking flow to show available dates and time slots
4. Update doctor dashboard to show daily schedules
5. Test comprehensive booking workflow with new date system
6. Migrate existing data from day-of-week to date-specific format

The new system provides much better control and user experience with granular date-based scheduling!
