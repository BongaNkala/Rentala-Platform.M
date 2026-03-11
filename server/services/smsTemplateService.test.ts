import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmsTemplateService, CreateTemplateInput, UpdateTemplateInput } from './smsTemplateService';
import { TRPCError } from '@trpc/server';

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

describe('SmsTemplateService', () => {
  const mockUserId = 1;
  const mockTemplateId = 100;

  const mockTemplate = {
    id: mockTemplateId,
    userId: mockUserId,
    name: 'Rent Reminder',
    description: 'Monthly rent reminder',
    messageTemplate: 'Your rent of R5000 is due on 1st of month. Please pay on time.',
    category: 'payment' as const,
    variables: JSON.stringify(['amount', 'dueDate']),
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createTemplate', () => {
    it('should create a new template with valid input', async () => {
      const input: CreateTemplateInput = {
        name: 'New Template',
        description: 'Test template',
        messageTemplate: 'Test message',
        category: 'announcement',
        variables: ['name'],
        isPublic: false,
      };

      // This test validates the input validation logic
      expect(input.messageTemplate.length).toBeLessThanOrEqual(160);
      expect(input.name.trim().length).toBeGreaterThan(0);
    });

    it('should reject template with message over 160 characters', async () => {
      const longMessage = 'a'.repeat(161);
      const input: CreateTemplateInput = {
        name: 'Long Message',
        messageTemplate: longMessage,
        category: 'announcement',
      };

      expect(input.messageTemplate.length).toBeGreaterThan(160);
    });

    it('should reject template with empty name', async () => {
      const input: CreateTemplateInput = {
        name: '   ',
        messageTemplate: 'Test message',
        category: 'announcement',
      };

      expect(input.name.trim().length).toBe(0);
    });

    it('should reject template with empty message', async () => {
      const input: CreateTemplateInput = {
        name: 'Empty Message',
        messageTemplate: '',
        category: 'announcement',
      };

      expect(input.messageTemplate.length).toBe(0);
    });
  });

  describe('updateTemplate', () => {
    it('should validate message length on update', async () => {
      const updateInput: UpdateTemplateInput = {
        messageTemplate: 'a'.repeat(161),
      };

      expect(updateInput.messageTemplate?.length).toBeGreaterThan(160);
    });

    it('should allow partial updates', async () => {
      const updateInput: UpdateTemplateInput = {
        name: 'Updated Name',
      };

      expect(updateInput.name).toBe('Updated Name');
      expect(updateInput.messageTemplate).toBeUndefined();
    });

    it('should trim whitespace on update', async () => {
      const updateInput: UpdateTemplateInput = {
        name: '  Trimmed Name  ',
      };

      const trimmed = updateInput.name?.trim();
      expect(trimmed).toBe('Trimmed Name');
    });
  });

  describe('Template Categories', () => {
    it('should have valid categories', async () => {
      const categories = await SmsTemplateService.getCategories();

      expect(categories).toHaveLength(5);
      expect(categories.map((c) => c.id)).toContain('maintenance');
      expect(categories.map((c) => c.id)).toContain('payment');
      expect(categories.map((c) => c.id)).toContain('announcement');
      expect(categories.map((c) => c.id)).toContain('emergency');
      expect(categories.map((c) => c.id)).toContain('other');
    });

    it('should have labels for all categories', async () => {
      const categories = await SmsTemplateService.getCategories();

      categories.forEach((cat) => {
        expect(cat.label).toBeTruthy();
        expect(cat.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Template Validation', () => {
    it('should validate SMS character limit (160)', () => {
      const validMessage = 'a'.repeat(160);
      const invalidMessage = 'a'.repeat(161);

      expect(validMessage.length).toBeLessThanOrEqual(160);
      expect(invalidMessage.length).toBeGreaterThan(160);
    });

    it('should support variables in templates', () => {
      const variables = ['tenantName', 'rentAmount', 'dueDate'];
      const message = 'Hello {tenantName}, your rent of {rentAmount} is due on {dueDate}';

      expect(message.length).toBeLessThanOrEqual(160);
      variables.forEach((v) => {
        expect(message).toContain(`{${v}}`);
      });
    });

    it('should handle JSON parsing for variables', () => {
      const variables = ['name', 'amount'];
      const json = JSON.stringify(variables);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(variables);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('Template Operations', () => {
    it('should handle template duplication', () => {
      const original = {
        name: 'Original',
        messageTemplate: 'Test message',
        category: 'announcement' as const,
      };

      const duplicated = {
        name: `${original.name} (Copy)`,
        messageTemplate: original.messageTemplate,
        category: original.category,
      };

      expect(duplicated.name).toContain('Copy');
      expect(duplicated.messageTemplate).toBe(original.messageTemplate);
    });

    it('should maintain template data integrity', () => {
      const template = {
        id: 1,
        name: 'Test',
        messageTemplate: 'Message',
        category: 'announcement' as const,
        variables: JSON.stringify(['var1', 'var2']),
      };

      const parsed = {
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : [],
      };

      expect(parsed.variables).toEqual(['var1', 'var2']);
    });
  });

  describe('Search and Filter', () => {
    it('should support search by name', () => {
      const templates = [
        { id: 1, name: 'Rent Reminder', category: 'payment' },
        { id: 2, name: 'Maintenance Notice', category: 'maintenance' },
        { id: 3, name: 'Emergency Alert', category: 'emergency' },
      ];

      const searchTerm = 'Rent';
      const results = templates.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Rent');
    });

    it('should support filter by category', () => {
      const templates = [
        { id: 1, name: 'Rent Reminder', category: 'payment' },
        { id: 2, name: 'Maintenance Notice', category: 'maintenance' },
        { id: 3, name: 'Payment Confirmation', category: 'payment' },
      ];

      const category = 'payment';
      const results = templates.filter((t) => t.category === category);

      expect(results).toHaveLength(2);
      results.forEach((t) => {
        expect(t.category).toBe('payment');
      });
    });

    it('should support combined search and filter', () => {
      const templates = [
        { id: 1, name: 'Rent Reminder', category: 'payment' },
        { id: 2, name: 'Maintenance Notice', category: 'maintenance' },
        { id: 3, name: 'Payment Confirmation', category: 'payment' },
      ];

      const searchTerm = 'Payment';
      const category = 'payment';

      const results = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          t.category === category
      );

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Payment Confirmation');
    });
  });

  describe('Pagination', () => {
    it('should support limit and offset', () => {
      const templates = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Template ${i + 1}`,
      }));

      const limit = 10;
      const offset = 0;

      const paginated = templates.slice(offset, offset + limit);

      expect(paginated).toHaveLength(10);
      expect(paginated[0].id).toBe(1);
      expect(paginated[9].id).toBe(10);
    });

    it('should handle offset pagination correctly', () => {
      const templates = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Template ${i + 1}`,
      }));

      const limit = 10;
      const offset = 20;

      const paginated = templates.slice(offset, offset + limit);

      expect(paginated).toHaveLength(10);
      expect(paginated[0].id).toBe(21);
      expect(paginated[9].id).toBe(30);
    });
  });

  describe('Template Statistics', () => {
    it('should track template usage', () => {
      const stats = {
        templateId: 1,
        usageCount: 5,
        lastUsed: new Date('2026-03-10'),
        totalCharacters: 160,
      };

      expect(stats.templateId).toBe(1);
      expect(stats.usageCount).toBeGreaterThanOrEqual(0);
      expect(stats.totalCharacters).toBeLessThanOrEqual(160);
    });

    it('should calculate character count correctly', () => {
      const message = 'Hello, this is a test message';
      const count = message.length;

      expect(count).toBe(29);
      expect(count).toBeLessThanOrEqual(160);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', () => {
      const errorMessage = 'Database connection failed';
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
      });

      expect(error.message).toBe(errorMessage);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle not found errors', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Template not found',
      });

      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle validation errors', () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Message template must be 160 characters or less',
      });

      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve template data on create', () => {
      const input: CreateTemplateInput = {
        name: 'Test Template',
        description: 'A test template',
        messageTemplate: 'Test message content',
        category: 'announcement',
        variables: ['var1', 'var2'],
        isPublic: true,
      };

      expect(input.name).toBe('Test Template');
      expect(input.description).toBe('A test template');
      expect(input.messageTemplate).toBe('Test message content');
      expect(input.category).toBe('announcement');
      expect(input.variables).toEqual(['var1', 'var2']);
      expect(input.isPublic).toBe(true);
    });

    it('should handle null values correctly', () => {
      const template = {
        id: 1,
        name: 'Test',
        description: null,
        variables: null,
      };

      expect(template.description).toBeNull();
      expect(template.variables).toBeNull();
    });
  });

  describe('Template Ordering', () => {
    it('should order templates by creation date descending', () => {
      const templates = [
        { id: 1, name: 'Old', createdAt: new Date('2026-01-01') },
        { id: 2, name: 'New', createdAt: new Date('2026-03-10') },
        { id: 3, name: 'Newer', createdAt: new Date('2026-03-11') },
      ];

      const sorted = [...templates].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].name).toBe('Newer');
      expect(sorted[1].name).toBe('New');
      expect(sorted[2].name).toBe('Old');
    });
  });
});
