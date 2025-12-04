import type { PromptContextTag, AttachmentFile } from '../types/sidebar';

/**
 * Convert context tags to natural language text for injection into query.
 * Filters out attachment tags since they are handled separately with full content.
 */
export function contextTagsToText(tags: PromptContextTag[]): string {
  if (tags.length === 0) return '';

  const nonAttachmentTags = tags.filter((tag) => !tag.id.startsWith('attachments-'));
  if (nonAttachmentTags.length === 0) return '';

  const labels = nonAttachmentTags.map((tag) => tag.label);
  return `Context: ${labels.join(', ')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function attachmentsToText(files: AttachmentFile[]): string {
  if (files.length === 0) return '';

  const sections = files.map((file) => {
    const sizeStr = formatFileSize(file.size);
    const lang = file.type === 'csv' ? 'csv' : 'txt';
    return `### ${file.name} (${sizeStr})\n\`\`\`${lang}\n${file.content}\n\`\`\``;
  });

  return `## Attached Files\n\n${sections.join('\n\n')}`;
}
