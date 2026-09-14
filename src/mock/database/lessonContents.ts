// Table: lesson_contents — migrated from rooster/academy/mock-data.ts (CONTENTS). FK: classId.
import { CONTENTS as SRC } from "@/components/rooster/academy/mock-data";
import type { LessonContent as SrcLessonContent } from "@/components/rooster/academy/mock-data";

export type LessonContent = Omit<SrcLessonContent, "klassId"> & { classId: string };

export const lessonContents: LessonContent[] = SRC.map(({ klassId, ...rest }) => ({ ...rest, classId: klassId }));
export const lessonContentsByClass = (classId: string) => lessonContents.filter((c) => c.classId === classId);
