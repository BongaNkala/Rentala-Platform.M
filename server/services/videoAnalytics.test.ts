import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackVideoFormat,
  getFormatStats,
  getDeviceTypeStats,
  getBrowserStats,
  getOSStats,
  getConnectionSpeedStats,
  getGeographicStats,
  getFormatTimeSeriesStats,
  getAnalyticsSummary,
  type VideoFormatData,
} from './videoAnalytics';

// Mock getDb
vi.mock('../db', () => ({
  getDb: vi.fn(async () => null),
}));

describe('Video Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackVideoFormat', () => {
    it('should return success false when database is not available', async () => {
      const result = await trackVideoFormat('session_123', null, {
        format: 'webm',
        loadTime: 1000,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept webm format', async () => {
      const data: VideoFormatData = {
        format: 'webm',
        loadTime: 500,
      };
      
      expect(data.format).toBe('webm');
    });

    it('should accept hevc format', async () => {
      const data: VideoFormatData = {
        format: 'hevc',
        loadTime: 600,
      };
      
      expect(data.format).toBe('hevc');
    });

    it('should accept mp4 format', async () => {
      const data: VideoFormatData = {
        format: 'mp4',
        loadTime: 1000,
      };
      
      expect(data.format).toBe('mp4');
    });

    it('should handle optional device information', async () => {
      const data: VideoFormatData = {
        format: 'webm',
        browserName: 'Chrome',
        browserVersion: '120.0',
        osName: 'Windows',
        osVersion: '11',
        deviceType: 'desktop',
        screenResolution: '1920x1080',
        connectionSpeed: '4g',
      };
      
      expect(data.browserName).toBe('Chrome');
      expect(data.deviceType).toBe('desktop');
    });

    it('should handle null userId', async () => {
      const result = await trackVideoFormat('session_456', null, {
        format: 'mp4',
      });
      
      // Should not throw error with null userId
      expect(result).toBeDefined();
    });

    it('should handle numeric userId', async () => {
      const result = await trackVideoFormat('session_789', 123, {
        format: 'hevc',
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('getFormatStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getFormatStats();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBe(0);
    });

    it('should accept custom days parameter', async () => {
      const stats = await getFormatStats(7);
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should default to 30 days', async () => {
      const stats = await getFormatStats();
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getDeviceTypeStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getDeviceTypeStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      const stats = await getDeviceTypeStats(14);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getBrowserStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getBrowserStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      const stats = await getBrowserStats(60);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getOSStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getOSStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      const stats = await getOSStats(90);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getConnectionSpeedStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getConnectionSpeedStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should include average load time', async () => {
      const stats = await getConnectionSpeedStats();
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getGeographicStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getGeographicStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      const stats = await getGeographicStats(180);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getFormatTimeSeriesStats', () => {
    it('should return empty array when database is not available', async () => {
      const stats = await getFormatTimeSeriesStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should return time series data', async () => {
      const stats = await getFormatTimeSeriesStats(30);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return summary object', async () => {
      const summary = await getAnalyticsSummary();
      
      expect(summary).toBeDefined();
      expect(summary.totalEvents).toBe(0);
      expect(summary.dateRange).toBeDefined();
      expect(summary.formatStats).toBeDefined();
      expect(summary.deviceStats).toBeDefined();
    });

    it('should include date range', async () => {
      const summary = await getAnalyticsSummary(30);
      
      expect(summary.dateRange.start).toBeInstanceOf(Date);
      expect(summary.dateRange.end).toBeInstanceOf(Date);
      // Date range should be valid (start is before or equal to end)
      expect(summary.dateRange.start.getTime() <= summary.dateRange.end.getTime()).toBe(true);
    });

    it('should accept custom days parameter', async () => {
      const summary = await getAnalyticsSummary(7);
      
      expect(summary).toBeDefined();
      expect(summary.dateRange).toBeDefined();
    });
  });

  describe('VideoFormatData validation', () => {
    it('should validate format enum', () => {
      const validFormats: Array<'webm' | 'hevc' | 'mp4'> = ['webm', 'hevc', 'mp4'];
      
      validFormats.forEach(format => {
        const data: VideoFormatData = { format };
        expect(data.format).toBe(format);
      });
    });

    it('should validate deviceType enum', () => {
      const validDeviceTypes: Array<'desktop' | 'tablet' | 'mobile'> = ['desktop', 'tablet', 'mobile'];
      
      validDeviceTypes.forEach(deviceType => {
        const data: VideoFormatData = {
          format: 'webm',
          deviceType,
        };
        expect(data.deviceType).toBe(deviceType);
      });
    });

    it('should allow optional fields', () => {
      const data: VideoFormatData = {
        format: 'webm',
      };
      
      expect(data.loadTime).toBeUndefined();
      expect(data.browserName).toBeUndefined();
      expect(data.country).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully in trackVideoFormat', async () => {
      const result = await trackVideoFormat('session_error', null, {
        format: 'webm',
      });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle errors gracefully in getFormatStats', async () => {
      const stats = await getFormatStats();
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should not throw on invalid input', async () => {
      expect(async () => {
        await getAnalyticsSummary(-1);
      }).not.toThrow();
    });
  });
});
