export type AttachmentSource = "camera" | "library" | "files";

export type Attachment = {
  id: string;
  uri: string;
  mimeType: string;
  fileName: string;
  title?: string;
  source?: AttachmentSource;
  createdAt: string;
  tags?: string[];
};
