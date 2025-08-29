const ImageUrl = 'http://138.2.87.100:3999';
export const ImageUploadUrl = `${ImageUrl}/upload`;
export const getImageUrl = (filename: string) => `${ImageUrl}/files/${filename}`;