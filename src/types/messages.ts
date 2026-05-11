export type MessagePriority = 'normal' | 'important' | 'urgent';
export type SenderType = 'agent' | 'customer' | 'admin';
export type AttachmentType = 'image' | 'pdf';

export interface ApplicationMessage {
  id: string;
  application_id: string;
  sender_id: string;
  sender_type: SenderType;
  sender_name: string | null;
  content: string;
  priority: MessagePriority;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: AttachmentType | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface SendMessageData {
  application_id: string;
  content: string;
  priority?: MessagePriority;
  attachment_path?: string;
  attachment_name?: string;
  attachment_type?: AttachmentType;
}
