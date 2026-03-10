export type QRType = "url" | "text" | "wifi" | "vcard";

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
    type: "linear" | "radial";
  };
}

export interface QRCodeData {
  id: string;
  content: string;
  type: QRType;
  config: QRConfig;
  created_at: string;
  scan_count: number;
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
