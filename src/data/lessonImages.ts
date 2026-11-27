/**
 * Lesson step pictures (P14): outline SVGs rendered by art/ and copied into
 * src/assets/lessons/ (`npm run art:ship`), named `<lessonId>-<step>-<view>.svg`
 * with 1-based steps. A step without a file shows the placeholder.
 */

import type { LessonView } from '../domain/types';

const FILES = import.meta.glob<string>('../assets/lessons/*.svg', { eager: true, query: '?url', import: 'default' });

/** File name (without .svg) → URL. */
export const LESSON_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.svg'.length), url]),
);

/** The picture of a lesson step (0-based `step`) from one angle, if drawn. */
export function stepImage(lessonId: string, step: number, view: LessonView): string | undefined {
  return LESSON_IMAGES[`${lessonId}-${step + 1}-${view}`];
}
