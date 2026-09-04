import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as s from '../db/schema.ts';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'range'
  | 'url'
  | 'email'
  | 'tel'
  | 'date'
  | 'boolean'
  | 'media'
  | 'tags'
  | 'select';

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  required?: boolean;
  /** Used for a NEW row only, so the form matches the schema's own default. */
  defaultValue?: unknown;
};

export type ResourceDef = {
  key: string;
  label: string;
  singular: string;
  table: SQLiteTable;
  fields: FieldDef[];
  listColumns: string[];
  /** Rows can be dragged to reorder; writes `sortOrder`. */
  sortable: boolean;
  /** Rows are fixed — the ten acts are the film's structure, not a list. */
  fixedRows?: boolean;
  blurb?: string;
};

const visibleField: FieldDef = {
  name: 'visible',
  label: 'Show on site',
  type: 'boolean',
  // Matches the schema default. Without this a newly created row renders its
  // checkbox unchecked, and anything added would silently be invisible.
  defaultValue: true,
};

export const RESOURCES: Record<string, ResourceDef> = {
  projects: {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    table: s.projects,
    sortable: true,
    listColumns: ['title', 'startedOn', 'featured', 'visible'],
    blurb:
      'The workshop act is built for an empty shelf. Add one here and it materialises onto a pedestal.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'slug',
        label: 'Slug',
        type: 'text',
        required: true,
        help: 'URL-safe id, e.g. port-scanner. Must be unique.',
      },
      { name: 'summary', label: 'One-line summary', type: 'text' },
      { name: 'body', label: 'Description', type: 'textarea' },
      { name: 'tags', label: 'Tags', type: 'tags', help: 'Comma separated.' },
      { name: 'repoUrl', label: 'Repository URL', type: 'url' },
      { name: 'liveUrl', label: 'Live URL', type: 'url' },
      { name: 'coverMediaId', label: 'Cover image', type: 'media' },
      { name: 'startedOn', label: 'Started', type: 'date' },
      { name: 'featured', label: 'Feature this one', type: 'boolean' },
      visibleField,
    ],
  },

  certifications: {
    key: 'certifications',
    label: 'Certifications',
    singular: 'Certification',
    table: s.certifications,
    sortable: true,
    listColumns: ['name', 'issuer', 'issuedOn', 'visible'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'issuedOn', label: 'Issued', type: 'date' },
      { name: 'credentialId', label: 'Credential ID', type: 'text' },
      {
        name: 'credentialUrl',
        label: 'Verify URL',
        type: 'url',
        help: 'A public verification link, if the issuer provides one.',
      },
      { name: 'mediaId', label: 'Badge image', type: 'media' },
      visibleField,
    ],
  },

  skills: {
    key: 'skills',
    label: 'Skills',
    singular: 'Skill',
    table: s.skills,
    sortable: true,
    listColumns: ['name', 'category', 'proficiency', 'visible'],
    blurb: 'Keep these honest. An inflated bar is easy to spot in an interview.',
    fields: [
      { name: 'name', label: 'Skill', type: 'text', required: true },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        options: ['Languages', 'Systems', 'Engineering', 'Security', 'Communication', 'General'],
      },
      { name: 'proficiency', label: 'Proficiency', type: 'range' },
      { name: 'note', label: 'Note', type: 'text', help: 'e.g. "IELTS Band 7" or "In progress".' },
      visibleField,
    ],
  },

  education: {
    key: 'education',
    label: 'Education',
    singular: 'Entry',
    table: s.education,
    sortable: true,
    listColumns: ['institution', 'credential', 'startYear', 'endYear', 'visible'],
    fields: [
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'credential', label: 'Credential', type: 'text' },
      { name: 'field', label: 'Field', type: 'text' },
      { name: 'startYear', label: 'Start year', type: 'text' },
      { name: 'endYear', label: 'End year', type: 'text', help: 'Leave blank if ongoing.' },
      { name: 'note', label: 'Note', type: 'textarea' },
      visibleField,
    ],
  },

  links: {
    key: 'links',
    label: 'Links & contact',
    singular: 'Link',
    table: s.links,
    sortable: true,
    listColumns: ['label', 'kind', 'value', 'visible'],
    blurb:
      'Anything left blank or hidden simply does not render. Fill in a URL and switch it on.',
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true },
      {
        name: 'kind',
        label: 'Kind',
        type: 'select',
        options: [
          'email', 'phone', 'location', 'resume', 'github', 'linkedin',
          'discord', 'x', 'facebook', 'instagram', 'telegram', 'threads', 'other',
        ],
        help: 'Controls the icon and how the link is built (mailto:, tel:, https:).',
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        help: 'A full URL, an email address, or a phone number — matching the kind.',
      },
      visibleField,
    ],
  },

  games: {
    key: 'games',
    label: 'Gaming corner',
    singular: 'Game',
    table: s.games,
    sortable: true,
    listColumns: ['title', 'status', 'visible'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['played', 'current', 'awaiting'],
        help: '"awaiting" renders differently — that is the GTA VI slot.',
      },
      { name: 'note', label: 'Note', type: 'text' },
      { name: 'coverMediaId', label: 'Cover art', type: 'media' },
      visibleField,
    ],
  },

  learning: {
    key: 'learning',
    label: 'Currently learning',
    singular: 'Item',
    table: s.learning,
    sortable: true,
    listColumns: ['title', 'provider', 'progress', 'status', 'visible'],
    blurb: 'This is what keeps the site alive between projects. Worth updating monthly.',
    fields: [
      { name: 'title', label: 'What', type: 'text', required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'url', label: 'URL', type: 'url' },
      { name: 'progress', label: 'Progress', type: 'range' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['active', 'paused', 'done'],
      },
      { name: 'note', label: 'Note', type: 'text' },
      visibleField,
    ],
  },

  storyActs: {
    key: 'storyActs',
    label: 'Story acts',
    singular: 'Act',
    table: s.storyActs,
    sortable: true,
    fixedRows: true,
    listColumns: ['key', 'title', 'visible'],
    blurb:
      'The nine acts and one interlude that make up the film. Edit the words and the artwork; the choreography is in the code.',
    fields: [
      { name: 'key', label: 'Key', type: 'text', required: true, help: 'Used by the code to find this act. Changing it will break the scene.' },
      { name: 'kicker', label: 'Kicker', type: 'text', help: 'The small line above the heading.' },
      { name: 'title', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Body', type: 'textarea', help: 'Blank lines start a new paragraph.' },
      { name: 'plateSkyMediaId', label: 'Plate — sky (far)', type: 'media' },
      { name: 'plateMidMediaId', label: 'Plate — mid', type: 'media' },
      { name: 'plateForeMediaId', label: 'Plate — foreground', type: 'media' },
      { name: 'loopMediaId', label: 'Video loop', type: 'media' },
      visibleField,
    ],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);

export function getResource(key: string): ResourceDef | undefined {
  return RESOURCES[key];
}

/**
 * The parts of a resource that are safe to hand to a Client Component.
 *
 * `table` is a Drizzle table built from recursive column proxies. Passing a
 * whole ResourceDef across the server/client boundary makes React try to
 * serialize it and overflow the stack ("Maximum call stack size exceeded" in
 * SQLiteInteger.toString). Client components take this instead.
 */
export type ClientResource = Omit<ResourceDef, 'table'>;

export function toClientResource(resource: ResourceDef): ClientResource {
  const { table: _table, ...rest } = resource;
  return rest;
}
