// Supabase Storage replaces AWS S3. This file is retained as a stub to avoid
// import errors in older branches; do not use. Use `supabase.storage` instead.

export const s3Service = {
  async uploadFile(): Promise<never> {
    throw new Error('s3Service removed — use Supabase Storage (supabase.storage) instead');
  }
};