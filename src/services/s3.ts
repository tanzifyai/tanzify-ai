import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  region: import.meta.env.AWS_REGION,
});

const s3 = new AWS.S3();
const BUCKET_NAME = import.meta.env.AWS_S3_BUCKET;

export interface UploadedFile {
  key: string;
  url: string;
  bucket: string;
}

export const s3Service = {
  async uploadFile(file: File, userId: string): Promise<UploadedFile> {
    const fileExtension = file.name.split('.').pop();
    const key = `uploads/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type,
      ACL: 'private', // Files are private, accessed via signed URLs
    };

    const result = await s3.upload(params).promise();

    return {
      key: result.Key,
      url: result.Location,
      bucket: result.Bucket,
    };
  },

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn, // URL expires in 1 hour by default
    };

    return s3.getSignedUrlPromise('getObject', params);
  },

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  },

  async getFileMetadata(key: string) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const result = await s3.headObject(params).promise();
    return result;
  }
};