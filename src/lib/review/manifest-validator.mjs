import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, 'manifest-schema.json');

let _schema = null;
let _ajv = null;
let _validate = null;

export const CURRENT_SCHEMA_VERSION = 1;

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

function getSchema() {
  if (!_schema) {
    _schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  }
  return _schema;
}

function getValidator() {
  if (_validate) return _validate;
  _ajv = new Ajv({ allErrors: true, strict: false });
  _ajv.addFormat('date-time', ISO_DATE_TIME);
  _validate = _ajv.compile(getSchema());
  return _validate;
}

/**
 * Validate a manifest object against the schema.
 *
 * @param {object} manifest - parsed manifest JSON
 * @returns {{ok: boolean, errors: Array<{path: string, message: string}>}}
 */
export function validateManifest(manifest) {
  if (manifest == null || typeof manifest !== 'object') {
    return { ok: false, errors: [{ path: '', message: 'manifest must be an object' }] };
  }
  if (Number.isInteger(manifest.schema_version) && manifest.schema_version !== CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [{
        path: '/schema_version',
        message: `unsupported schema_version=${manifest.schema_version}; renderer supports ${CURRENT_SCHEMA_VERSION}. Upgrade dw-kit or regenerate manifest.`,
      }],
    };
  }
  const validate = getValidator();
  const valid = validate(manifest);
  if (valid) return { ok: true, errors: [] };
  const errors = (validate.errors || []).map((e) => ({
    path: e.instancePath || '/',
    message: `${e.message}${e.params && Object.keys(e.params).length ? ' (' + JSON.stringify(e.params) + ')' : ''}`,
  }));
  return { ok: false, errors };
}

/**
 * Parse + validate from JSON string.
 *
 * @param {string} jsonText
 * @returns {{ok: boolean, manifest?: object, errors: Array}}
 */
export function parseManifest(jsonText) {
  let manifest;
  try {
    manifest = JSON.parse(jsonText);
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `invalid JSON: ${e.message}` }] };
  }
  const result = validateManifest(manifest);
  if (!result.ok) return { ok: false, errors: result.errors };
  return { ok: true, manifest, errors: [] };
}

/**
 * Read + validate manifest file from disk.
 *
 * @param {string} manifestPath
 * @returns {{ok: boolean, manifest?: object, errors: Array}}
 */
export function readManifest(manifestPath) {
  let text;
  try {
    text = readFileSync(manifestPath, 'utf-8');
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `cannot read manifest: ${e.message}` }] };
  }
  return parseManifest(text);
}
