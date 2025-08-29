import { Body, Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { OpenAIService } from './openai.service';
import { FileInterceptor } from '@nestjs/platform-express';

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

     // ---------- NEW: summarize from an uploaded image ----------
  @Post('summarize-image')
  @ApiOperation({ summary: 'Summarize patient data from an uploaded image (e.g., handwritten prescription, lab report)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(png|jpeg|jpg|webp|heic|heif|gif|bmp|tiff)/i.test(
          file.mimetype,
        );
        cb(ok ? null : new BadRequestException('Unsupported image type'), ok);
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        // optional extra instructions if you want
        note: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Summary generated from the image',
    schema: { example: { summary: '- Diagnoses: ...' } },
  })
  async summarizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { note?: string },
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const summary = await this.svc.summarizePatientImage(file, body?.note);
    return { summary };
  }

  // ---------- NEW: ask a question about an uploaded image ----------
  @Post('ask-image')
  @ApiOperation({ summary: 'Ask a question about an uploaded image (e.g., "What meds are written here?")' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(png|jpeg|jpg|webp|heic|heif|gif|bmp|tiff)/i.test(
          file.mimetype,
        );
        cb(ok ? null : new BadRequestException('Unsupported image type'), ok);
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'question'],
      properties: {
        file: { type: 'string', format: 'binary' },
        question: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Answer generated about the image',
    schema: { example: { answer: '...' } },
  })
  async askImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { question: string },
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const answer = await this.svc.askAboutImage(file, body?.question || '');
    return { answer };
  }


}





