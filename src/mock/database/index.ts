// Barrel for the mock relational database. Re-exports every "table" module and
// aggregates them into a single `db` object, mirroring how a real ORM client
// (e.g. Prisma/TypeORM) groups repositories together.
export * from "./users";
export * from "./campuses";
export * from "./blocks";
export * from "./rooms";
export * from "./reservations";
export * from "./disciplines";
export * from "./teachers";
export * from "./students";
export * from "./classes";
export * from "./enrollments";
export * from "./calendarEvents";
export * from "./activities";
export * from "./submissions";
export * from "./grades";
export * from "./attendance";
export * from "./assetCategories";
export * from "./assetSectors";
export * from "./assets";
export * from "./assetMovements";
export * from "./tickets";
export * from "./deskCategories";
export * from "./products";
export * from "./services";
export * from "./charges";
export * from "./payments";
export * from "./boostCourses";
export * from "./certificates";
export * from "./notifications";
export * from "./lessonContents";
export * from "./academyDocs";

import { users } from "./users";
import { campuses } from "./campuses";
import { blocks } from "./blocks";
import { rooms } from "./rooms";
import { reservations } from "./reservations";
import { disciplines, courses, terms } from "./disciplines";
import { teachers } from "./teachers";
import { students } from "./students";
import { classes } from "./classes";
import { enrollments } from "./enrollments";
import { calendarEvents } from "./calendarEvents";
import { activities } from "./activities";
import { submissions } from "./submissions";
import { grades, gradeItems } from "./grades";
import { attendance } from "./attendance";
import { assetCategories } from "./assetCategories";
import { assetSectors } from "./assetSectors";
import { assets } from "./assets";
import { assetMovements } from "./assetMovements";
import { tickets, ticketCategories } from "./tickets";
import { deskCategories, deskSectors, deskAgents } from "./deskCategories";
import { products } from "./products";
import { services } from "./services";
import { charges, tuitions } from "./charges";
import { payments } from "./payments";
import { boostCourses } from "./boostCourses";
import { certificates } from "./certificates";
import { notifications } from "./notifications";
import { lessonContents } from "./lessonContents";
import { academyDocs } from "./academyDocs";

/** Single object exposing every mock "table", analogous to a DB client instance. */
export const db = {
  users,
  campuses,
  blocks,
  rooms,
  reservations,
  disciplines,
  courses,
  terms,
  teachers,
  students,
  classes,
  enrollments,
  calendarEvents,
  activities,
  submissions,
  grades,
  gradeItems,
  attendance,
  assetCategories,
  assetSectors,
  assets,
  assetMovements,
  tickets,
  ticketCategories,
  deskCategories,
  deskSectors,
  deskAgents,
  products,
  services,
  charges,
  tuitions,
  payments,
  boostCourses,
  certificates,
  notifications,
  lessonContents,
  academyDocs,
};

export type Database = typeof db;
