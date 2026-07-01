import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const patients = sqliteTable(
  'patients',
  {
    id: text('id').primaryKey(),
    phone: text('phone').notNull().unique(),
    name: text('name').notNull(),
    gender: text('gender').notNull(),
    birthDate: text('birth_date').notNull(),
    wechatId: text('wechat_id'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_patients_phone').on(table.phone)]
);

export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    patientId: text('patient_id').references(() => patients.id),
    patientName: text('patient_name').notNull(),
    patientPhone: text('patient_phone').notNull(),
    gender: text('gender').notNull(),
    birthDate: text('birth_date').notNull(),
    visitorCount: integer('visitor_count').notNull().default(1),
    doctorId: text('doctor_id').notNull(),
    treatmentId: text('treatment_id').notNull(),
    date: text('date').notNull(),
    timeSlot: text('time_slot').notNull(),
    symptoms: text('symptoms'),
    wechatNotify: integer('wechat_notify').notNull().default(0),
    wechatId: text('wechat_id'),
    status: text('status').notNull(),
    source: text('source'),
    queueCode: text('queue_code'),
    queueSeq: integer('queue_seq'),
    queueStatus: text('queue_status'),
    queuePriority: integer('queue_priority').notNull().default(0),
    checkedInAt: text('checked_in_at'),
    calledAt: text('called_at'),
    recallCount: integer('recall_count').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    cancelledAt: text('cancelled_at'),
  },
  (table) => [
    index('idx_bookings_date').on(table.date),
    index('idx_bookings_phone').on(table.patientPhone),
    index('idx_bookings_queue').on(table.date, table.queueStatus),
    uniqueIndex('idx_bookings_slot_unique')
      .on(table.date, table.timeSlot)
      .where(
        sql`${table.source} != 'walk_in' AND ${table.status} != 'cancelled' AND ${table.timeSlot} != 'walk-in'`
      ),
  ]
);

export const schemaMeta = sqliteTable('schema_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
