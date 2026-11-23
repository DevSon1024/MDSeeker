export interface DocumentResponse {
  canonical_path: string;
  file_name: string;
  file_extension: string;
  file_size_bytes: number;
  last_modified_timestamp: number | null;
  raw_content: string;
}

export interface DocumentMetadata {
  canonical_path: string;
  file_name: string;
  file_extension: string;
  file_size_bytes: number;
  last_modified_timestamp: number | null;
  is_readonly: boolean;
}

export interface FileErrorResponse {
  code: string;
  message: string;
  path?: string;
  details?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  canonical_path?: string;
  file_name?: string;
  file_size_bytes?: number;
  error?: FileErrorResponse;
}

export interface LoadedDocument {
  canonicalPath: string;
  fileName: string;
  fileExtension: string;
  fileSizeBytes: number;
  lastModifiedTimestamp: number | null;
  rawContent: string;
}
