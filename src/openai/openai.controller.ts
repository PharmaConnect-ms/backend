import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OpenAIService } from './openai.service';

@ApiTags('AI')
@Controller('ai')
export class OpenAIController {
    constructor(private readonly svc: OpenAIService) {}

    @Post('summarize')
    @ApiOperation({ summary: 'Summarize patient text' })
    @ApiBody({ schema: { type: 'object', properties: { text: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Summary generated', schema: { example: { summary: '...' } } })
    async summarize(@Body() body: { text: string }) {
        const summary = await this.svc.summarizePatientText(body?.text || '');
        return { summary };
    }

    @Post('ask')
    @ApiOperation({ summary: 'Ask any question' })
    @ApiBody({ schema: { type: 'object', properties: { question: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Answer generated', schema: { example: { answer: '...' } } })
    async ask(@Body() body: { question: string }) {
        const answer = await this.svc.askanything(body?.question || '');
        return { answer };
    }
}
