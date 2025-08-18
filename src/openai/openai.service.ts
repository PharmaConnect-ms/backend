import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async summarizePatientText(text: string) {
    const res = await this.client.responses.create(
      {
        model: 'gpt-4o-mini',              
        instructions:
          'You are a clinical note summarizer. Return concise bullet points: diagnoses, meds (name/strength/frequency), allergies, tests, follow-ups. If unknown, say "Not documented". Do not invent info.',
        input: text,
      },
      {
        timeout: Number(process.env.OPENAI_TIMEOUT_MS) || 20000,
      }
    );
    return res.output_text; 
  }

  async askanything(question: string) {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: question }],
    });
    return res.choices[0].message.content;
  }
}
