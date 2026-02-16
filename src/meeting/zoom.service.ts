import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  ErrorSanitizer,
  SecretsValidator,
  INTEGRATION_SECRETS,
  SafeURLValidator,
  PHARMACONNECT_TRUSTED_DOMAINS,
} from '../common/security';

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
  private readonly logger = new Logger('ZoomService');
  
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // POLICY: B. Secrets Management - Validate required secrets at startup
    SecretsValidator.validateRequired(
      INTEGRATION_SECRETS.ZOOM.required,
      INTEGRATION_SECRETS.ZOOM.optional,
    );

    // Log that Zoom integration is configured
    this.logger.log('Zoom integration initialized with required credentials');
  }

  private handleError(error: unknown, context: string): never {
    // POLICY: A. Secure Configuration - Sanitize error messages
    const isDevelopment = this.configService.get<string>('NODE_ENV') !== 'production';
    throw ErrorSanitizer.createSafeThirdPartyError(context, error, isDevelopment);
  }

  /**
   * Get access token using Server-to-Server OAuth
   * POLICY: A. Secure Configuration - Uses HTTPS, environment variables for credentials
   * POLICY: B. Secrets Management - Never logs or exposes credentials
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // POLICY: B. Secrets Management - Use secure accessor for secrets
      const accountId = SecretsValidator.getRequired('ZOOM_ACCOUNT_ID');
      const clientId = SecretsValidator.getRequired('ZOOM_CLIENT_ID');
      const clientSecret = SecretsValidator.getRequired('ZOOM_CLIENT_SECRET');

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      // POLICY: A. Secure Configuration - Always use HTTPS
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
      
      this.logger.debug('Zoom access token refreshed');
      return this.accessToken;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data;
      const errorDescription = errorData && typeof errorData === 'object' && 'error_description' in errorData 
        ? String(errorData.error_description) 
        : axiosError.message;
      
      // POLICY: A. Secure Configuration - Sanitize error message, never leak credentials
      const sanitized = ErrorSanitizer.sanitize(
        new Error('Failed to obtain Zoom access token'),
        'Zoom OAuth token request',
        this.configService.get<string>('NODE_ENV') !== 'production',
      );

      throw new InternalServerErrorException(sanitized);
    }
  }

  /**
   * Create a new Zoom meeting
   * POLICY: D. Safe Links/Redirects - Returns HTTPS links only
   * POLICY: A. Secure Configuration - Error handling via ErrorSanitizer
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

      // POLICY: A. Secure Configuration - Always use HTTPS
      const url = `${this.zoomApiUrl}/users/${encodeURIComponent(userEmail)}/meetings`;
      // POLICY: D. Safe Links/Redirects - Validate the API endpoint is HTTPS
      SafeURLValidator.validateTrustedDomain(url, PHARMACONNECT_TRUSTED_DOMAINS.ZOOM);
      
      const response = await firstValueFrom(
        this.httpService.post(url, meetingData, { headers })
      );

      // Validate response contains safe HTTPS links
      const zoomResponse = response.data as ZoomMeetingResponse;
      if (zoomResponse.join_url) {
        SafeURLValidator.validateTrustedDomain(zoomResponse.join_url, PHARMACONNECT_TRUSTED_DOMAINS.ZOOM);
        SafeURLValidator.validateNoSensitiveData(zoomResponse.join_url);
      }
      if (zoomResponse.start_url) {
        SafeURLValidator.validateTrustedDomain(zoomResponse.start_url, PHARMACONNECT_TRUSTED_DOMAINS.ZOOM);
        SafeURLValidator.validateNoSensitiveData(zoomResponse.start_url);
      }

      return zoomResponse;
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

      // Zoom returns specific error codes/messages when the token lacks required scopes.
      let zoomCode: number | null = null;
      let zoomMsg = '';
      if (errorData && typeof errorData === 'object') {
        const asObj = errorData as Record<string, unknown>;
        if ('code' in asObj && typeof asObj.code === 'number') zoomCode = asObj.code;
        if ('message' in asObj && typeof asObj.message === 'string') zoomMsg = asObj.message.toLowerCase();
      }

      if (zoomCode === 4711 || zoomMsg.includes('does not contain scopes')) {
        // Give actionable guidance to the developer without exposing credentials
        throw new BadRequestException(
          'Zoom access token is missing required scopes (e.g., meeting:write). ' +
          'Please ensure your Zoom app has the appropriate meeting write scopes enabled and activated.'
        );
      }

      if (axiosError.response?.status === 401) {
        // Clear token and retry once
        this.accessToken = null;
        this.tokenExpiry = null;
        throw new InternalServerErrorException('Zoom authentication failed. Credentials may have expired. Please retry the request.');
      }

      // Use ErrorSanitizer for other errors
      throw this.handleError(error, 'Creating Zoom meeting');
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
