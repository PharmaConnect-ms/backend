import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ReminderInterface } from './interface/reminder-interface';
import { ErrorSanitizer, SecretsValidator, INTEGRATION_SECRETS } from '../common/security';

// Vision model constant
const MODEL_VISION = 'gpt-4o-mini';

/**
 * AI SAFETY GUARD - POLICY: E. AI Safety Guard (OpenAI)
 * Implements safety controls for AI interactions to prevent:
 * - Sensitive data extraction from OpenAI
 * - Prompt injection attacks
 * - Misuse of AI products
 */
@Injectable()
export class OpenAIService {
  private client: OpenAI;
  private readonly logger = new Logger('OpenAIService');

  constructor() {
    // POLICY: B. Secrets Management - Validate and retrieve API key securely
    SecretsValidator.validateRequired(
      INTEGRATION_SECRETS.OPENAI.required,
      INTEGRATION_SECRETS.OPENAI.optional,
    );

    const apiKey = SecretsValidator.getRequired('OPENAI_API_KEY');

    // POLICY: A. Secure Configuration - Create client with secure credentials
    this.client = new OpenAI({
      apiKey, // Never log or expose this
    });

    this.logger.log('OpenAI integration initialized');
  }

  /**
   * SAFETY GUARD: Detect potential prompt injection patterns
   * Prevents malicious attempts to extract sensitive information
   */
  private validateInputSafety(input: string, fieldName: string = 'input'): void {
    const dangerousPatterns = [
      /ignore[\s\w]*previous/i,
      /system[\s\w]*prompt/i,
      /secret[\s\w]*key/i,
      /api[\s\w]*key/i,
      /password/i,
      /token/i,
      /credential/i,
      /phpinfo/i,
      /exec\(/i,
      /system\(/i,
      /shell[\s\w]*command/i,
      /extract[\s\w]*sensitive/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        this.logger.warn(
          `Potential prompt injection detected in ${fieldName}: ${input.substring(0, 100)}...`,
        );
        throw new BadRequestException(
          `Suspicious input detected. Please ensure your request is legitimate.`,
        );
      }
    }
  }

  /**
   * SAFETY GUARD: Sanitize AI responses to prevent unintended data leakage
   * Ensures no sensitive information is accidentally returned
   */
  private sanitizeResponse(response: string | null): string | null {
    if (!response) return response;

    // Remove any accidentally leaked sensitive patterns
    let sanitized = response
      .replace(/bearer\s+[a-z0-9\-._~+/]+=*/gi, '[REDACTED]')
      .replace(/api[_-]?key[=:]\s*[^\s,}]*/gi, '[REDACTED]')
      .replace(/secret[=:]\s*[^\s,}]*/gi, '[REDACTED]');

    return sanitized;
  }

  async summarizePatientText(text: string) {
    try {
      // POLICY: E. AI Safety Guard - Validate input for injection attempts
      this.validateInputSafety(text, 'patient text');

      const res = await this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a clinical note summarizer. Return concise bullet points: diagnoses, meds (name/strength/frequency), allergies, tests, follow-ups. If unknown, say "Not documented". Do not invent info.',
            },
            {
              role: 'user',
              content: text,
            },
          ],
        },
        {
          timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
        },
      );

      // POLICY: E. AI Safety Guard - Sanitize response
      const response = res.choices[0].message.content;
      return this.sanitizeResponse(response);
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI text summarization', error, false);
    }
  }

  async askanything(question: string) {
    try {
      // POLICY: E. AI Safety Guard - Validate input for injection attempts
      this.validateInputSafety(question, 'user question');

      const res = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
      });

      // POLICY: E. AI Safety Guard - Sanitize response
      const response = res.choices[0].message.content;
      return this.sanitizeResponse(response);
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI question answering', error, false);
    }
  }

  // ---------- helpers for images ----------
  private toBase64DataUri(file: Express.Multer.File): { data: string; mime: string } {
    if (!file || !file.buffer || !file.buffer.length) {
      throw new BadRequestException('Empty or invalid image file');
    }
    const mime = file.mimetype || 'image/png';
    const data = `data:${mime};base64,${file.buffer.toString('base64')}`;
    return { data, mime };
  }

  /**
   * Summarize a patient document from an image (handwritten Rx, lab report, discharge summary, etc.)
   * POLICY: E. AI Safety Guard - Input validation and response sanitization
   */
  async summarizePatientImage(file: Express.Multer.File, note?: string) {
    try {
      const { data } = this.toBase64DataUri(file);

      // POLICY: E. AI Safety Guard - Validate note for injection attempts
      if (note) {
        this.validateInputSafety(note, 'patient note');
      }

      const systemInstruction = 'You are a clinical note summarizer. Return concise bullet points under these headings: ' + 'Diagnoses, Medications (name/strength/frequency), Allergies, Tests/Results, Follow-ups/Advice. ' + 'If unknown, write "-". Do not invent info. If handwriting is unclear, state "Illegible".';

      const userText = (note?.trim() ? `Context/Note: ${note.trim()}\n` : '') + 'Extract and summarize the clinical information from this image.';

      const res = await this.client.chat.completions.create(
        {
          model: MODEL_VISION,
          messages: [
            {
              role: 'system',
              content: systemInstruction,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: data } },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.2,
        },
        {
          timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
        },
      );

      // POLICY: E. AI Safety Guard - Sanitize response
      const response = res.choices[0].message.content;
      return this.sanitizeResponse(response);
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI image summarization', error, false);
    }
  }

  /**
   * Ask a free-form question about an uploaded image.
   * POLICY: E. AI Safety Guard - Input validation and response sanitization
   */
  async askAboutImage(file: Express.Multer.File, question: string) {
    try {
      const { data } = this.toBase64DataUri(file);

      // POLICY: E. AI Safety Guard - Validate question for injection attempts
      this.validateInputSafety(question, 'image question');

      // Chat Completions supports multimodal by sending content array with text + image_url
      const res = await this.client.chat.completions.create({
        model: MODEL_VISION,
        messages: [
          {
            role: 'system',
            content: 'You are a careful medical assistant. If clinical claims are unclear, ask for clarification or say they are not legible. Avoid fabrication.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: question || 'Summarize the key medical information.' },
              { type: 'image_url', image_url: { url: data } },
            ],
          },
        ],
        // Optional safety: keep answers short & focused
        max_tokens: 400,
        temperature: 0.2,
      });

      // POLICY: E. AI Safety Guard - Sanitize response
      const response = res.choices[0].message.content;
      return this.sanitizeResponse(response);
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI image question answering', error, false);
    }
  }

  async extractRemindersFromSummary(summary: string) {
    try {
      // POLICY: E. AI Safety Guard - Validate input
      this.validateInputSafety(summary, 'patient summary');

      const res = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a medical reminder extractor.
Return JSON array of reminders with fields:
- type: ("medication_reminder" | "appointment_reminder" | "follow_up_reminder" | "general_reminder")
- title: short label
- description: optional details
- reminderTime: ISO datetime (if frequency, give first next time)
If nothing relevant, return [].`,
          },
          { role: 'user', content: summary },
        ],
        response_format: { type: 'json_object' },
      });

      try {
        const content = res.choices[0].message.content;
        if (typeof content !== 'string') {
          return [];
        }
        const parsed = JSON.parse(content) as { reminders?: ReminderInterface[] };
        return Array.isArray(parsed.reminders) ? parsed.reminders : [];
      } catch {
        return [];
      }
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error extracting reminders from summary');
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI reminder extraction', error, false);
    }
  }

  /**
   * Update patient summary by intelligently merging previous summary with new prescription information
   * POLICY: E. AI Safety Guard - Input validation and response sanitization
   */
  async updatePatientSummaryWithNewPrescription(
    file: Express.Multer.File, 
    previousSummary?: string
  ): Promise<string> {
    try {
      // POLICY: E. AI Safety Guard - Validate previous summary for injection
      if (previousSummary) {
        this.validateInputSafety(previousSummary, 'previous patient summary');
      }

      const { data } = this.toBase64DataUri(file);

      const systemInstruction = `You are a clinical assistant responsible for maintaining comprehensive patient medical summaries. 
    
Your task is to update an existing patient summary with new prescription information while maintaining a consistent structure.

Structure your response with these headings:
- **Diagnoses**: Current and historical conditions
- **Current Medications**: Active prescriptions with name/strength/frequency  
- **Previous Medications**: Past medications (if relevant)
- **Allergies**: Known drug/substance allergies
- **Recent Tests/Results**: Lab results, imaging, etc.
- **Follow-ups/Advice**: Upcoming appointments, recommendations
- **Medical History**: Significant past conditions/treatments

Rules:
1. Merge information intelligently - don't duplicate entries
2. Keep the most recent medication information
3. Preserve important historical context
4. If information conflicts, favor the newer prescription
5. If handwriting is unclear, state "Illegible"
6. If information is missing, write "-"
7. Maintain chronological context where relevant`;

      const userText = previousSummary 
        ? `Previous patient summary:\n${previousSummary}\n\nPlease update this summary with the new prescription information from the image below. Merge the information intelligently, avoiding duplicates while preserving important medical history.`
        : 'Extract and summarize the clinical information from this prescription image to create a new patient summary.';

      const res = await this.client.chat.completions.create(
        {
          model: MODEL_VISION,
          messages: [
            {
              role: 'system',
              content: systemInstruction,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: data } },
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.1,
        },
        {
          timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
        },
      );

      // POLICY: E. AI Safety Guard - Sanitize response
      const response = res.choices[0].message.content || '';
      return this.sanitizeResponse(response) || '';
    } catch (error) {
      // POLICY: A. Secure Configuration - Sanitize error messages
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw ErrorSanitizer.createSafeThirdPartyError('OpenAI prescription summarization', error, false);
    }
  }
}
