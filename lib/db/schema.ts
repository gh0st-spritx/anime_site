import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/** Shared column builders. Each call returns a fresh builder. */
const pk = () => integer('id').primaryKey({ autoIncrement: true });
const order = () => integer('sort_order').notNull().default(0);
const visible = () =>
  integer('visible', { mode: 'boolean' }).notNull().default(true);

export type SectionConfig = { key: string; visible: boolean }[];

export const adminUser = sqliteTable('admin_user', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const media = sqliteTable('media', {
  id: pk(),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes').notNull(),
  alt: text('alt').notNull().default(''),
  createdAt: integer('created_at').notNull(),
});

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull().default(''),
  birthdate: text('birthdate').notNull(),
  bio: text('bio').notNull().default(''),
  location: text('location').notNull().default(''),
  avatarMediaId: integer('avatar_media_id'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  accentColor: text('accent_color').notNull().default('#6ee7ff'),
  motionIntensity: text('motion_intensity').notNull().default('full'),
  audioDefaultOn: integer('audio_default_on', { mode: 'boolean' })
    .notNull()
    .default(false),
  sectionConfig: text('section_config', { mode: 'json' })
    .$type<SectionConfig>()
    .notNull(),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  seoImageMediaId: integer('seo_image_media_id'),
  analyticsSnippet: text('analytics_snippet').notNull().default(''),
  maintenanceMode: integer('maintenance_mode', { mode: 'boolean' })
    .notNull()
    .default(false),
});

export const storyActs = sqliteTable('story_acts', {
  id: pk(),
  key: text('key').notNull().unique(),
  kicker: text('kicker').notNull().default(''),
  title: text('title').notNull().default(''),
  body: text('body').notNull().default(''),
  plateSkyMediaId: integer('plate_sky_media_id'),
  plateMidMediaId: integer('plate_mid_media_id'),
  plateForeMediaId: integer('plate_fore_media_id'),
  loopMediaId: integer('loop_media_id'),
  /**
   * The clip that flies from THIS scene into the next one. The film is a chain
   * of dive/connector pairs, so a connector belongs to the act it leaves —
   * the last act has none.
   */
  connectorMediaId: integer('connector_media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const certifications = sqliteTable('certifications', {
  id: pk(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull().default(''),
  issuedOn: text('issued_on').notNull().default(''),
  credentialId: text('credential_id').notNull().default(''),
  credentialUrl: text('credential_url').notNull().default(''),
  mediaId: integer('media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const projects = sqliteTable('projects', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  body: text('body').notNull().default(''),
  tags: text('tags', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  repoUrl: text('repo_url').notNull().default(''),
  liveUrl: text('live_url').notNull().default(''),
  coverMediaId: integer('cover_media_id'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  startedOn: text('started_on').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const projectImages = sqliteTable('project_images', {
  id: pk(),
  projectId: integer('project_id').notNull(),
  mediaId: integer('media_id').notNull(),
  sortOrder: order(),
});

export const skills = sqliteTable('skills', {
  id: pk(),
  name: text('name').notNull(),
  category: text('category').notNull().default('General'),
  proficiency: integer('proficiency').notNull().default(50),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const education = sqliteTable('education', {
  id: pk(),
  institution: text('institution').notNull(),
  credential: text('credential').notNull().default(''),
  field: text('field').notNull().default(''),
  startYear: text('start_year').notNull().default(''),
  endYear: text('end_year').notNull().default(''),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const links = sqliteTable('links', {
  id: pk(),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull().default(''),
  icon: text('icon').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const games = sqliteTable('games', {
  id: pk(),
  title: text('title').notNull(),
  note: text('note').notNull().default(''),
  status: text('status').notNull().default('played'),
  coverMediaId: integer('cover_media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const learning = sqliteTable('learning', {
  id: pk(),
  title: text('title').notNull(),
  provider: text('provider').notNull().default(''),
  url: text('url').notNull().default(''),
  progress: integer('progress').notNull().default(0),
  status: text('status').notNull().default('active'),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});
