export interface Participant {
  sno: number;
  rollNumber: string;
  name: string;
  department: string;
  year: string;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  venue: string | null;
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  filename: string;
  filepath: string;
  uploadedAt: Date;
  eventId: string;
}

export interface GeneratedPdf {
  id: string;
  filename: string;
  filepath: string;
  eventId: string;
  eventName: string;
  createdAt: Date;
  participantCount: number;
}


