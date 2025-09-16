# Family Profile Management System

This module provides comprehensive family profile management functionality for PharmaConnect, allowing users to manage family members and their care profiles.

## Features

### Family Member Management
- **Add Family Members**: Create profiles for dependents (babies, elderly, etc.)
- **Relationship Types**: Define family relationships (child, parent, grandparent, spouse, sibling, other)
- **Care Levels**: Track dependency levels (independent, assisted, dependent, critical)
- **Medical Information**: Store allergies, medications, and medical notes
- **Profile Pictures**: Upload and manage profile images

### Care Profile Management
- **Care Tasks**: Define various care activities (medication, feeding, exercise, checkup, therapy, hygiene)
- **Scheduling**: Set frequency and timing for care activities
- **Instructions**: Add detailed care instructions
- **Tracking**: Monitor care activities and progress

### Integration Features
- **Appointment Integration**: Link appointments to specific family members
- **User Security**: Each user can only manage their own family members
- **Medical History**: Maintain comprehensive medical records

## API Endpoints

### Family Members

#### Create Family Member
```
POST /family-profile/members
```

**Request Body:**
```json
{
  "name": "John Doe Jr.",
  "age": 8,
  "dateOfBirth": "2016-05-15",
  "relationship": "child",
  "careLevel": "assisted",
  "profilePicture": "profile-pic-url",
  "medicalNotes": "Requires daily insulin",
  "allergies": ["peanuts", "shellfish"],
  "medications": ["insulin", "vitamins"]
}
```

#### Get All Family Members
```
GET /family-profile/members
```

#### Get Specific Family Member
```
GET /family-profile/members/:id
```

#### Update Family Member
```
PATCH /family-profile/members/:id
```

#### Delete Family Member (Soft Delete)
```
DELETE /family-profile/members/:id
```

### Care Profiles

#### Create Care Profile
```
POST /family-profile/care-profiles
```

**Request Body:**
```json
{
  "title": "Morning Medication",
  "description": "Administer insulin injection",
  "taskType": "medication",
  "frequency": "daily",
  "scheduledTime": "08:00",
  "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  "instructions": "Check blood sugar first, then administer insulin",
  "familyMemberId": "uuid-of-family-member"
}
```

#### Get Care Profiles for Family Member
```
GET /family-profile/members/:id/care-profiles
```

#### Update Care Profile
```
PATCH /family-profile/care-profiles/:id
```

#### Delete Care Profile
```
DELETE /family-profile/care-profiles/:id
```

## Data Models

### FamilyMember Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Family member's name |
| age | number | Current age (0-120) |
| dateOfBirth | Date | Date of birth (optional) |
| relationship | enum | Relationship type |
| careLevel | enum | Level of care needed |
| profilePicture | string | Profile image URL |
| medicalNotes | text | Medical information |
| allergies | array | List of allergies |
| medications | array | Current medications |
| isActive | boolean | Soft delete flag |
| caregiverId | UUID | Reference to User |

### CareProfile Entity

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | string | Care task title |
| description | text | Detailed description |
| taskType | enum | Type of care task |
| frequency | enum | How often to perform |
| scheduledTime | time | Time of day |
| daysOfWeek | array | Days to perform task |
| instructions | text | Detailed instructions |
| isActive | boolean | Active status |
| familyMemberId | UUID | Reference to FamilyMember |

## Enums

### RelationshipType
- `child` - Child or dependent
- `parent` - Parent
- `grandparent` - Grandparent
- `spouse` - Spouse or partner
- `sibling` - Brother or sister
- `other` - Other relationship

### CareLevel
- `independent` - Can care for themselves
- `assisted` - Needs some assistance
- `dependent` - Requires significant care
- `critical` - Needs constant supervision

### CareTaskType
- `medication` - Medicine administration
- `feeding` - Feeding assistance
- `exercise` - Physical activities
- `checkup` - Health monitoring
- `therapy` - Therapeutic activities
- `hygiene` - Personal care
- `other` - Other care activities

### CareFrequency
- `daily` - Every day
- `weekly` - Once per week
- `monthly` - Once per month
- `as_needed` - When required

## Security Features

1. **Authentication Required**: All endpoints require JWT authentication
2. **User Isolation**: Users can only access their own family members
3. **Ownership Verification**: All operations verify caregiver ownership
4. **Soft Deletes**: Family members are deactivated, not permanently removed

## Integration Points

### Appointment System
- Family members can be linked to appointments
- Caregivers can book appointments for their dependents
- Appointment history is maintained per family member

### User Management
- Each user has a `familyMembers` relationship
- Supports multiple family members per caregiver
- Maintains caregiver-dependent relationships

## Usage Examples

### Adding a Child
```typescript
const childData = {
  name: "Emma Johnson",
  age: 5,
  relationship: RelationshipType.CHILD,
  careLevel: CareLevel.ASSISTED,
  allergies: ["dairy"],
  medications: ["vitamins"]
};

const child = await familyProfileService.createFamilyMember(childData, userId);
```

### Creating a Care Schedule
```typescript
const careData = {
  title: "Bedtime Routine",
  description: "Evening medication and preparation",
  taskType: CareTaskType.MEDICATION,
  frequency: CareFrequency.DAILY,
  scheduledTime: "20:00",
  familyMemberId: child.id
};

const careProfile = await familyProfileService.createCareProfile(careData, userId);
```

## Database Migration

The system automatically creates the necessary database tables:
- `family_members` - Stores family member information
- `care_profiles` - Stores care task information

Foreign key relationships:
- `family_members.caregiver_id` → `users.id`
- `care_profiles.family_member_id` → `family_members.id`
- `appointments.family_member_id` → `family_members.id` (optional)

## Error Handling

The system includes comprehensive error handling:
- `NotFoundException` - When family member or care profile not found
- `ForbiddenException` - When user tries to access others' data
- Validation errors for invalid input data
- Type safety with DTOs and entities

## Future Enhancements

Potential future features:
1. **Photo Albums**: Store multiple photos per family member
2. **Growth Tracking**: Track height, weight, and development milestones
3. **Medication Reminders**: Automated notifications for care tasks
4. **Care Reports**: Generate care summaries and reports
5. **Emergency Contacts**: Store emergency contact information
6. **Medical Document Storage**: Upload and store medical documents
7. **Family Tree Visualization**: Display family relationships graphically
