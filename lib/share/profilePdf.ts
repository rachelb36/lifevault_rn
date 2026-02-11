import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export type ShareSection = {
  id: string;
  title: string;
  content: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const textToHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `<p class="muted">No information added yet.</p>`;
  }
  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return `<p>${escapeHtml(trimmed)}</p>`;
  }
  return `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
};

export const buildProfileHtml = (profileName: string, sections: ShareSection[]) => {
  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sectionHtml = sections
    .map(
      (section) => `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          ${textToHtml(section.content)}
        </section>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
          .brand { font-weight: 700; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: #2563eb; }
          .meta { font-size: 12px; color: #64748b; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          .subtitle { font-size: 14px; color: #64748b; margin-bottom: 20px; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
          .section h2 { margin: 0 0 10px; font-size: 16px; color: #0f172a; }
          p { margin: 0; font-size: 13px; line-height: 1.5; }
          ul { margin: 0; padding-left: 18px; }
          li { margin-bottom: 6px; font-size: 13px; line-height: 1.5; }
          .muted { color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">LifeVault</div>
          <div class="meta">Generated ${dateLabel}</div>
        </div>
        <h1>${escapeHtml(profileName)}</h1>
        <div class="subtitle">Shared profile summary</div>
        ${sectionHtml}
      </body>
    </html>
  `;
};

export const shareProfilePdf = async (profileName: string, sections: ShareSection[]) => {
  if (!sections.length) {
    Alert.alert("Select at least one category", "Choose one or more sections to include.");
    return;
  }
  const html = buildProfileHtml(profileName, sections);
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: `Share ${profileName}`,
  });
};
