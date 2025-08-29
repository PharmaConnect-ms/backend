export interface ImageUploadResponseDto {
  message: string;
  file: {
    name: string;
    url: string;
  };
}
