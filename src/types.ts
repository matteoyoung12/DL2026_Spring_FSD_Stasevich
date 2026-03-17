export type QRType = "url" | "text" | "wifi" | "vcard" | "email" | "sms" | "event";

export interface QRConfig {
  fgColor: string;
  bgColor: string;
  level: "L" | "M" | "Q" | "H";
  margin: number;
  scale: number;
  borderRadius: number;
  logo?: string;
  gradient?: {
    enabled: boolean;
    color2: string;
    type: "linear" | "radial" | "diagonal";
  };
  pattern?: {
    enabled: boolean;
    type: "square" | "rounded" | "dots" | "diamond";
  };
  eyeStyle?: {
    type: "square" | "rounded" | "circle" | "frame";
    color: string;
  };
}

export interface QRCodeData {
  id: string;
  content: string;
  type: QRType;
  config: QRConfig;
  created_at: string;
  scan_count: number;
  favorite?: boolean;
  note?: string;
}

export interface WiFiData {
  ssid: string;
  password?: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization?: string;
  workPhone?: string;
  title?: string;
  url?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface SMSData {
  phone: string;
  message: string;
}

export interface EventData {
  title: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string;
}
