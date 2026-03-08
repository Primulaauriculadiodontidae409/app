import { describe, it, expect } from 'bun:test';

// Test the JSON validation logic used by DocumentEditor
// (extracted here since DocumentEditor is a UI component)

function validateDocument(jsonText: string): { valid: boolean; error?: string; parsed?: Record<string, unknown> } {
  try {
    const parsed = JSON.parse(jsonText);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return { valid: false, error: 'Document must be a JSON object' };
    }
    return { valid: true, parsed };
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}

function formatJson(jsonText: string): { success: boolean; formatted?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonText);
    return { success: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    return { success: false, error: `Cannot format: ${(e as Error).message}` };
  }
}

describe('Document Validation', () => {
  describe('validateDocument', () => {
    it('should accept a valid JSON object', () => {
      const result = validateDocument('{"name": "Alice", "age": 30}');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ name: 'Alice', age: 30 });
    });

    it('should accept an empty object', () => {
      const result = validateDocument('{}');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({});
    });

    it('should accept nested objects', () => {
      const result = validateDocument('{"a": {"b": {"c": 1}}}');
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ a: { b: { c: 1 } } });
    });

    it('should accept objects with arrays', () => {
      const result = validateDocument('{"tags": ["a", "b", "c"]}');
      expect(result.valid).toBe(true);
    });

    it('should reject a JSON array', () => {
      const result = validateDocument('[1, 2, 3]');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Document must be a JSON object');
    });

    it('should reject a JSON string', () => {
      const result = validateDocument('"hello"');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Document must be a JSON object');
    });

    it('should reject a JSON number', () => {
      const result = validateDocument('42');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Document must be a JSON object');
    });

    it('should reject a JSON boolean', () => {
      const result = validateDocument('true');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Document must be a JSON object');
    });

    it('should reject JSON null', () => {
      const result = validateDocument('null');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Document must be a JSON object');
    });

    it('should reject invalid JSON', () => {
      const result = validateDocument('{invalid}');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject empty string', () => {
      const result = validateDocument('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject trailing comma', () => {
      const result = validateDocument('{"a": 1,}');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject single quotes', () => {
      const result = validateDocument("{'a': 1}");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject unquoted keys', () => {
      const result = validateDocument('{a: 1}');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });
  });

  describe('formatJson', () => {
    it('should format compact JSON', () => {
      const result = formatJson('{"name":"Alice","age":30}');
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{\n  "name": "Alice",\n  "age": 30\n}');
    });

    it('should normalize already-formatted JSON', () => {
      const input = '{\n    "name":    "Alice"\n}';
      const result = formatJson(input);
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{\n  "name": "Alice"\n}');
    });

    it('should handle nested structures', () => {
      const result = formatJson('{"a":{"b":[1,2,3]}}');
      expect(result.success).toBe(true);
      expect(result.formatted).toContain('"a"');
      expect(result.formatted).toContain('"b"');
    });

    it('should return error for invalid JSON', () => {
      const result = formatJson('{invalid}');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot format');
    });

    it('should handle empty object', () => {
      const result = formatJson('{}');
      expect(result.success).toBe(true);
      expect(result.formatted).toBe('{}');
    });
  });
});

describe('Connection URI Credential Masking', () => {
  // Test the regex used in ConnectionScreen to mask passwords in display
  // Uses lookahead to find the last @ before host:port
  function maskUri(uri: string): string {
    return uri.replace(/:\/\/.+@(?=[^@]+:\d)/, '://***:***@');
  }

  it('should mask simple credentials', () => {
    expect(maskUri('mongodb://user:pass@localhost:27017')).toBe('mongodb://***:***@localhost:27017');
  });

  it('should mask complex passwords', () => {
    expect(maskUri('mongodb://admin:p@ss%40word@db.example.com:27017')).toBe('mongodb://***:***@db.example.com:27017');
  });

  it('should not modify URIs without credentials', () => {
    expect(maskUri('mongodb://localhost:27017')).toBe('mongodb://localhost:27017');
  });
});

describe('Byte Formatting', () => {
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  it('should format bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10240)).toBe('10.0 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(5242880)).toBe('5.0 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
    expect(formatBytes(2147483648)).toBe('2.0 GB');
  });
});
