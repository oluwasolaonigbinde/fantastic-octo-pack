/**
 * Human-readable type labels for KYC uploads, aligned with backend
 * KYC_ALLOWED_MIME_TYPES / allowed extensions. Prefer MIME, fall back to filename extension.
 */
const MIME_TO_LABEL: Record<string, string> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/webp": "WEBP",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

const EXT_TO_LABEL: Record<string, string> = {
  ".png": "PNG",
  ".jpg": "JPEG",
  ".jpeg": "JPEG",
  ".webp": "WEBP",
  ".pdf": "PDF",
  ".doc": "DOC",
  ".docx": "DOCX",
};

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) {
    return "";
  }
  return fileName.slice(idx).toLowerCase();
}

/**
 * @param mimeType - Value from upload (browser / Multer `mimetype`)
 * @param fileName - Original name; used when MIME is missing, generic, or unmapped
 */
export function getKycFileTypeLabel(mimeType: string, fileName: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized && MIME_TO_LABEL[normalized]) {
    return MIME_TO_LABEL[normalized];
  }
  if (normalized.includes("wordprocessingml")) {
    return "DOCX";
  }
  const ext = getExtension(fileName);
  const fromExt = ext ? EXT_TO_LABEL[ext] : undefined;
  if (fromExt) {
    return fromExt;
  }
  if (ext) {
    return ext.replace(/^\./, "").toUpperCase();
  }
  return "File";
}
