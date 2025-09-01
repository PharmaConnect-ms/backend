import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface ZoomMeetingRequest {
  topic: string;
  type: number; // 1 = instant, 2 = scheduled, 3 = recurring with no fixed time, 8 = recurring with fixed time
  start_time?: string; // Format: YYYY-MM-DDTHH:MM:SSZ
  duration?: number; // Meeting duration in minutes
  timezone?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    cn_meeting?: boolean;
    in_meeting?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    approval_type?: number;
    auto_recording?: string;
    enforce_login?: boolean;
    enforce_login_domains?: string;
    alternative_hosts?: string;
    waiting_room?: boolean;
  };
}

export interface ZoomMeetingResponse {
  uuid: string;
  id: number;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  agenda: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: any;
}

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class ZoomService {
  private readonly zoomApiUrl = 'https://api.zoom.us/v2';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private handleError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const axiosError = error as AxiosError;
    const responseData = axiosError.response?.data;
    
    console.error(`${context}:`, responseData || errorMessage);
    throw new InternalServerErrorException(`${context}: ${errorMessage}`);
  }

  /**
   * Get access token using Server-to-Server OAuth
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const accountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');
    const clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');

    if (!accountId || !clientId || !clientSecret) {
      throw new BadRequestException(
        'Missing Zoom API credentials. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in your environment variables'
      );
    }

    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await firstValueFrom(
        this.httpService.post<ZoomTokenResponse>(
          'https://zoom.us/oauth/token',
          `grant_type=account_credentials&account_id=${accountId}`,
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data;
      const errorDescription = errorData && typeof errorData === 'object' && 'error_description' in errorData 
        ? String(errorData.error_description) 
        : axiosError.message;
      
      console.error('Error getting Zoom access token:', errorData || axiosError.message);
      throw new InternalServerErrorException(
        `Failed to get Zoom access token. Please verify your Zoom API credentials. Error: ${errorDescription}`
      );
    }
  }

  /**
   * Create a new Zoom meeting
   */
  async createMeeting(
    userEmail: string,
    meetingData: ZoomMeetingRequest,
  ): Promise<ZoomMeetingResponse> {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

  // Use the explicit user email so Server-to-Server OAuth tokens that are
  // scoped to operate on behalf of a specific user will work correctly.
  // `userEmail` is expected to be the host's email address.
  const url = `${this.zoomApiUrl}/users/${encodeURIComponent(userEmail)}/meetings`;
      
      const response = await firstValueFrom(
        this.httpService.post(url, meetingData, { headers })
      );

      return response.data as ZoomMeetingResponse;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData: unknown = axiosError.response?.data;
      let errorMessage = axiosError.message;
      if (errorData && typeof errorData === 'object') {
        const asObj = errorData as Record<string, unknown>;
        if ('message' in asObj && typeof asObj.message === 'string') {
          errorMessage = asObj.message;
        }
      }

      console.error('Error creating Zoom meeting:', errorData || axiosError.message);

      // Zoom returns specific error codes/messages when the token lacks required scopes.
      // Detect the common 'missing scopes' error and return a helpful message.
      let zoomCode: number | null = null;
      let zoomMsg = '';
      if (errorData && typeof errorData === 'object') {
        const asObj = errorData as Record<string, unknown>;
        if ('code' in asObj && typeof asObj.code === 'number') zoomCode = asObj.code;
        if ('message' in asObj && typeof asObj.message === 'string') zoomMsg = asObj.message.toLowerCase();
      }

      if (zoomCode === 4711 || zoomMsg.includes('does not contain scopes')) {
        // Give actionable guidance to the developer to fix app scopes/activation.
        throw new BadRequestException(
          'Zoom access token is missing required scopes (e.g. meeting:write).\n' +
          'Please open your Zoom Marketplace Server-to-Server OAuth app, add the appropriate meeting write scopes (e.g. meeting:write, meeting:write:admin or meeting:write:meeting), save, and activate the app for your account. Also ensure ZOOM_ACCOUNT_ID matches the Account ID for the app.'
        );
      }

      if (axiosError.response?.status === 401) {
        // Clear token and retry once
        this.accessToken = null;
        this.tokenExpiry = null;
        throw new InternalServerErrorException('Zoom authentication failed. Please check your credentials.');
      }

      throw new InternalServerErrorException(
        `Failed to create Zoom meeting: ${errorMessage}`
      );
    }
  }

  /**
   * Get meeting details by meeting ID
   */
  async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const url = `${this.zoomApiUrl}/meetings/${meetingId}`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, { headers })
      );

      return response.data as ZoomMeetingResponse;
    } catch (error) {
      this.handleError(error, 'Error fetching Zoom meeting');
    }
  }

  /**
   * Update an existing Zoom meeting
   */
  async updateMeeting(
    meetingId: string,
    meetingData: Partial<ZoomMeetingRequest>,
  ): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const url = `${this.zoomApiUrl}/meetings/${meetingId}`;
      
      await firstValueFrom(
        this.httpService.patch(url, meetingData, { headers })
      );
    } catch (error) {
      this.handleError(error, 'Error updating Zoom meeting');
    }
  }

  /**
   * Delete a Zoom meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const url = `${this.zoomApiUrl}/meetings/${meetingId}`;
      
      await firstValueFrom(
        this.httpService.delete(url, { headers })
      );
    } catch (error) {
      this.handleError(error, 'Error deleting Zoom meeting');
    }
  }

  /**
   * Create a quick meeting for appointments
   * This is a convenience method for creating meetings with default settings
   */
  async createAppointmentMeeting(
    hostEmail: string,
    topic: string,
    startTime?: Date,
    duration: number = 60,
    agenda?: string,
  ): Promise<ZoomMeetingResponse> {
    const meetingData: ZoomMeetingRequest = {
      topic,
      type: startTime ? 2 : 1, // 2 = scheduled, 1 = instant
      start_time: startTime ? startTime.toISOString() : undefined,
      duration,
      timezone: 'UTC',
      agenda: agenda || `Medical appointment: ${topic}`,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'none',
        approval_type: 2, // No registration required
      },
    };

    return this.createMeeting(hostEmail, meetingData);
  }

  /**
   * Create a standalone meeting with custom settings
   * Perfect for ad-hoc consultations without appointment requirements
   */
  async createStandaloneMeeting(
    hostEmail: string,
    topic: string,
    startTime?: Date,
    duration: number = 60,
    agenda?: string,
    options?: {
      waitingRoom?: boolean;
      muteOnEntry?: boolean;
      autoRecord?: boolean;
      hostVideo?: boolean;
      participantVideo?: boolean;
    }
  ): Promise<ZoomMeetingResponse> {
    const meetingData: ZoomMeetingRequest = {
      topic,
      type: startTime ? 2 : 1, // 2 = scheduled, 1 = instant
      start_time: startTime ? startTime.toISOString() : undefined,
      duration,
      timezone: 'UTC',
      agenda: agenda || `Standalone meeting: ${topic}`,
      settings: {
        host_video: options?.hostVideo ?? true,
        participant_video: options?.participantVideo ?? true,
        join_before_host: true,
        mute_upon_entry: options?.muteOnEntry ?? true,
        waiting_room: options?.waitingRoom ?? true,
        auto_recording: options?.autoRecord ? 'cloud' : 'none',
        approval_type: 2, // No registration required
      },
    };

    return this.createMeeting(hostEmail, meetingData);
  }
}
