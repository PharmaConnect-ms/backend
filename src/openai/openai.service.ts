import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

// Vision model constant
const MODEL_VISION = 'gpt-4o-mini';

@Injectable()
export class OpenAIService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async summarizePatientText(text: string) {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a clinical note summarizer. Return concise bullet points: diagnoses, meds (name/strength/frequency), allergies, tests, follow-ups. If unknown, say "Not documented". Do not invent info.'
        },
        {
          role: 'user',
          content: text
        }
      ],
    }, {
      timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
    });
    return res.choices[0].message.content;
  }

  async askanything(question: string) {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: question }],
    });
    return res.choices[0].message.content;
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
   */
  async summarizePatientImage(file: Express.Multer.File, note?: string) {
    const { data } = this.toBase64DataUri(file);

    const systemInstruction =
      'You are a clinical note summarizer. Return concise bullet points under these headings: ' +
      'Diagnoses, Medications (name/strength/frequency), Allergies, Tests/Results, Follow-ups/Advice. ' +
      'If unknown, write "-". Do not invent info. If handwriting is unclear, state "Illegible".';

    const userText = (note?.trim() ? `Context/Note: ${note.trim()}\n` : '') + 
      'Extract and summarize the clinical information from this image.';

    const res = await this.client.chat.completions.create({
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
    }, {
      timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
    });

    return res.choices[0].message.content;
  }

  /**
   * Ask a free-form question about an uploaded image.
   */
  async askAboutImage(file: Express.Multer.File, question: string) {
    const { data } = this.toBase64DataUri(file);

    // Chat Completions supports multimodal by sending content array with text + image_url
    const res = await this.client.chat.completions.create({
      model: MODEL_VISION,
      messages: [
        {
          role: 'system',
          content:
            'You are a careful medical assistant. If clinical claims are unclear, ask for clarification or say they are not legible. Avoid fabrication.',
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

    return res.choices[0].message.content;
  }


}
