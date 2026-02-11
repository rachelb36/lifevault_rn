import { Activity, AlertCircle, Shield, Phone, Plane, User, FileText, Heart, GraduationCap } from "lucide-react-native";
import { Module } from "@/lib/types/profile";

export const CORE_MODULES: Module[] = [
  { id: "medical", name: "Medical Information", icon: Activity },
  { id: "vaccinations", name: "Vaccinations", icon: AlertCircle },
  { id: "insurance", name: "Insurance", icon: Shield },
  { id: "emergency", name: "Emergency Contacts", icon: Phone },
  { id: "travel", name: "Travel", icon: Plane },
  { id: "education", name: "Education", icon: User },
];

export const ALL_MODULES: Module[] = [
  ...CORE_MODULES,
  { id: "documents", name: "Documents", icon: FileText },
  { id: "activities", name: "Activities & Interests", icon: Heart },
  { id: "academic", name: "Academic", icon: GraduationCap },
];
