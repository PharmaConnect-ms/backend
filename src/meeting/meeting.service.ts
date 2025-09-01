import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { MeetingResponseDto } from './dto/meeting-response.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CreateQuickMeetingDto } from './dto/create-quick-meeting.dto';
import { CreateStandaloneMeetingDto } from './dto/create-standalone-meeting.dto';
import { StandaloneMeetingResponseDto } from './dto/standalone-meeting-response.dto';
import { ZoomService } from './zoom.service';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,

    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    private readonly zoomService: ZoomService,
  ) {}

  /**
   * Create a new meeting for an appointment
   */
  async createMeeting(createMeetingDto: CreateMeetingDto): Promise<MeetingResponseDto> {
    const { appointmentId, hostEmail, topic, startTime, duration = 60, agenda } = createMeetingDto;

    // Check if appointment exists
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    // Check if meeting already exists for this appointment
    const existingMeeting = await this.meetingRepo.findOne({
      where: { appointment: { id: appointmentId } }
    });
    if (existingMeeting) {
      throw new BadRequestException(`Meeting already exists for appointment ${appointmentId}`);
    }

    try {
      // Create Zoom meeting
      const zoomMeeting = await this.zoomService.createAppointmentMeeting(
        hostEmail,
        topic,
        startTime ? new Date(startTime) : undefined,
        duration,
        agenda
      );

      // Save meeting to database
      const meeting = this.meetingRepo.create({
        appointment,
        zoomMeetingId: zoomMeeting.id.toString(),
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        password: zoomMeeting.password,
        topic: zoomMeeting.topic,
        startTime: startTime ? new Date(startTime) : undefined,
        duration,
        agenda,
        hostEmail,
        status: 'scheduled',
      });

      const savedMeeting = await this.meetingRepo.save(meeting);

      return this.mapToResponseDto(savedMeeting);
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new BadRequestException('Failed to create meeting');
    }
  }

  /**
   * Create a quick/instant meeting for an appointment
   */
  async createQuickMeeting(createQuickMeetingDto: CreateQuickMeetingDto): Promise<MeetingResponseDto> {
    const { appointmentId, hostEmail, topic = 'Medical Consultation' } = createQuickMeetingDto;

    // Check if appointment exists
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    // Check if meeting already exists for this appointment
    const existingMeeting = await this.meetingRepo.findOne({
      where: { appointment: { id: appointmentId } }
    });
    if (existingMeeting) {
      // If meeting exists, return it instead of creating a new one
      return this.mapToResponseDto(existingMeeting);
    }

    try {
      // Create instant Zoom meeting
      const zoomMeeting = await this.zoomService.createAppointmentMeeting(
        hostEmail,
        topic,
        undefined, // No start time = instant meeting
        60, // Default 60 minutes
        `Medical appointment: ${topic}`
      );

      // Save meeting to database
      const meeting = this.meetingRepo.create({
        appointment,
        zoomMeetingId: zoomMeeting.id.toString(),
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        password: zoomMeeting.password,
        topic: zoomMeeting.topic,
        duration: 60,
        agenda: `Medical appointment: ${topic}`,
        hostEmail,
        status: 'active',
      });

      const savedMeeting = await this.meetingRepo.save(meeting);

      return this.mapToResponseDto(savedMeeting);
    } catch (error) {
      console.error('Error creating quick meeting:', error);
      throw new BadRequestException('Failed to create quick meeting');
    }
  }

  /**
   * Find meeting by appointment ID
   */
  async findByAppointmentId(appointmentId: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepo.findOne({
      where: { appointment: { id: appointmentId } },
      relations: ['appointment'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting not found for appointment ${appointmentId}`);
    }

    return this.mapToResponseDto(meeting);
  }

  /**
   * Get all meetings
   */
  async findAll(): Promise<MeetingResponseDto[]> {
    const meetings = await this.meetingRepo.find({
      relations: ['appointment'],
      order: { createdAt: 'DESC' },
    });

    if (!meetings || meetings.length === 0) {
      throw new NotFoundException('No meetings found');
    }

    return meetings.map(meeting => this.mapToResponseDto(meeting));
  }

  /**
   * Get meeting details by meeting ID
   */
  async findById(id: string): Promise<MeetingResponseDto> {
    const meeting = await this.meetingRepo.findOne({
      where: { id },
      relations: ['appointment'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return this.mapToResponseDto(meeting);
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(id: string): Promise<void> {
    const meeting = await this.meetingRepo.findOne({ where: { id } });
    
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    try {
      // Delete from Zoom first
      await this.zoomService.deleteMeeting(meeting.zoomMeetingId);
      
      // Then delete from database
      await this.meetingRepo.remove(meeting);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw new BadRequestException('Failed to delete meeting');
    }
  }

  /**
   * Create a standalone meeting (without appointment)
   */
  async createStandaloneMeeting(createStandaloneMeetingDto: CreateStandaloneMeetingDto): Promise<StandaloneMeetingResponseDto> {
    const { 
      hostEmail, 
      topic, 
      startTime, 
      duration = 60, 
      agenda,
      waitingRoom = true,
      muteOnEntry = true,
      autoRecord = false 
    } = createStandaloneMeetingDto;

    try {
      // Create Zoom meeting with custom settings
      const zoomMeeting = await this.zoomService.createStandaloneMeeting(
        hostEmail,
        topic,
        startTime ? new Date(startTime) : undefined,
        duration,
        agenda,
        {
          waitingRoom,
          muteOnEntry,
          autoRecord,
          hostVideo: true,
          participantVideo: true,
        }
      );

      // Save meeting to database (no appointment association)
      const meeting = this.meetingRepo.create({
        zoomMeetingId: zoomMeeting.id.toString(),
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        password: zoomMeeting.password,
        topic: zoomMeeting.topic,
        startTime: startTime ? new Date(startTime) : undefined,
        duration,
        agenda,
        hostEmail,
        status: startTime ? 'scheduled' : 'active',
        meetingType: 'standalone',
      });

      const savedMeeting = await this.meetingRepo.save(meeting);

      return this.mapToStandaloneResponseDto(savedMeeting);
    } catch (error) {
      console.error('Error creating standalone meeting:', error);
      throw new BadRequestException('Failed to create standalone meeting');
    }
  }

  /**
   * Get all standalone meetings
   */
  async findAllStandalone(): Promise<StandaloneMeetingResponseDto[]> {
    const meetings = await this.meetingRepo.find({
      where: { meetingType: 'standalone' },
      order: { createdAt: 'DESC' },
    });

    if (!meetings || meetings.length === 0) {
      return [];
    }

    return meetings.map(meeting => this.mapToStandaloneResponseDto(meeting));
  }

  /**
   * Find standalone meeting by ID
   */
  async findStandaloneById(id: string): Promise<StandaloneMeetingResponseDto> {
    const meeting = await this.meetingRepo.findOne({
      where: { id, meetingType: 'standalone' },
    });

    if (!meeting) {
      throw new NotFoundException(`Standalone meeting with ID ${id} not found`);
    }

    return this.mapToStandaloneResponseDto(meeting);
  }

  /**
   * Get Zoom link for standalone meeting
   */
  async getStandaloneZoomLink(id: string): Promise<{ joinUrl: string; password?: string }> {
    const meeting = await this.findStandaloneById(id);
    return {
      joinUrl: meeting.joinUrl,
      password: meeting.password,
    };
  }

  /**
   * Get Zoom meeting link for an appointment (convenience method)
   */
  async getZoomLink(appointmentId: string): Promise<{ joinUrl: string; password?: string }> {
    const meeting = await this.findByAppointmentId(appointmentId);
    return {
      joinUrl: meeting.joinUrl,
      password: meeting.password,
    };
  }

  /**
   * Map meeting entity to response DTO
   */
  private mapToResponseDto(meeting: Meeting): MeetingResponseDto {
    return {
      id: meeting.id,
      zoomMeetingId: meeting.zoomMeetingId,
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
      password: meeting.password,
      status: meeting.status,
      topic: meeting.topic,
      startTime: meeting.startTime,
      duration: meeting.duration,
      agenda: meeting.agenda,
      hostEmail: meeting.hostEmail,
      createdAt: meeting.createdAt,
      appointmentId: meeting.appointment?.id || '', // Handle optional appointment
    };
  }

  /**
   * Map meeting entity to standalone response DTO
   */
  private mapToStandaloneResponseDto(meeting: Meeting): StandaloneMeetingResponseDto {
    return {
      id: meeting.id,
      zoomMeetingId: meeting.zoomMeetingId,
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
      password: meeting.password,
      status: meeting.status,
      topic: meeting.topic || '',
      startTime: meeting.startTime,
      duration: meeting.duration,
      agenda: meeting.agenda,
      hostEmail: meeting.hostEmail,
      createdAt: meeting.createdAt,
      meetingType: meeting.meetingType,
    };
  }
}
