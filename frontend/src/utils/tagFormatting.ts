import type { PromptContextTag } from '../types/sidebar';

/**
 * Convert context tags to natural language text for injection into query
 */
export function contextTagsToText(tags: PromptContextTag[]): string {
  if (tags.length === 0) return '';

  const labels = tags.map((tag) => tag.label);
  return `Context: ${labels.join(', ')}`;
}
