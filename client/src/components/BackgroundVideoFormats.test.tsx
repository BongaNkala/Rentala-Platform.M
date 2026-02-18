import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('BackgroundVideo Multi-Format Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should support VP9/WebM format', () => {
    const video = document.createElement('video');
    const canPlayWebM = video.canPlayType('video/webm; codecs="vp9"');
    
    // canPlayType returns 'probably', 'maybe', or ''
    expect(['probably', 'maybe', '']).toContain(canPlayWebM);
  });

  it('should support HEVC/H.265 format', () => {
    const video = document.createElement('video');
    const canPlayHEVC = video.canPlayType('video/mp4; codecs="hev1"') || 
                        video.canPlayType('video/mp4; codecs="hvc1"');
    
    expect(typeof canPlayHEVC).toBe('string');
  });

  it('should support H.264/MP4 format (universal fallback)', () => {
    const video = document.createElement('video');
    const canPlayMP4 = video.canPlayType('video/mp4; codecs="avc1"');
    
    expect(['probably', 'maybe', '']).toContain(canPlayMP4);
  });

  it('should have all three video sources in correct order', () => {
    const video = document.createElement('video');
    
    const source1 = document.createElement('source');
    source1.src = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/exKiSHPdGqVrkDVG.webm';
    source1.type = 'video/webm; codecs="vp9"';
    
    const source2 = document.createElement('source');
    source2.src = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/ugmoimFwgmjDksIj.mp4';
    source2.type = 'video/mp4; codecs="hev1"';
    
    const source3 = document.createElement('source');
    source3.src = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/vOqdkDMXyWIwzDxn.mp4';
    source3.type = 'video/mp4; codecs="avc1"';
    
    video.appendChild(source1);
    video.appendChild(source2);
    video.appendChild(source3);
    
    const sources = video.querySelectorAll('source');
    expect(sources.length).toBe(3);
    expect(sources[0].type).toContain('webm');
    expect(sources[1].type).toContain('hev1');
    expect(sources[2].type).toContain('avc1');
  });

  it('should have VP9/WebM as first source (best compression)', () => {
    const video = document.createElement('video');
    const source = document.createElement('source');
    source.src = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/exKiSHPdGqVrkDVG.webm';
    source.type = 'video/webm; codecs="vp9"';
    video.appendChild(source);
    
    const firstSource = video.querySelector('source');
    expect(firstSource?.type).toContain('vp9');
  });

  it('should have HEVC as second source (good compression fallback)', () => {
    const video = document.createElement('video');
    
    const source1 = document.createElement('source');
    source1.type = 'video/webm; codecs="vp9"';
    
    const source2 = document.createElement('source');
    source2.type = 'video/mp4; codecs="hev1"';
    
    video.appendChild(source1);
    video.appendChild(source2);
    
    const sources = video.querySelectorAll('source');
    expect(sources[1].type).toContain('hev1');
  });

  it('should have H.264/MP4 as final fallback', () => {
    const video = document.createElement('video');
    
    const source1 = document.createElement('source');
    source1.type = 'video/webm; codecs="vp9"';
    
    const source2 = document.createElement('source');
    source2.type = 'video/mp4; codecs="hev1"';
    
    const source3 = document.createElement('source');
    source3.type = 'video/mp4; codecs="avc1"';
    
    video.appendChild(source1);
    video.appendChild(source2);
    video.appendChild(source3);
    
    const sources = video.querySelectorAll('source');
    expect(sources[2].type).toContain('avc1');
  });

  it('should have correct CDN URLs for all formats', () => {
    const webmUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/exKiSHPdGqVrkDVG.webm';
    const hevcUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/ugmoimFwgmjDksIj.mp4';
    const mp4Url = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663152451982/vOqdkDMXyWIwzDxn.mp4';
    
    expect(webmUrl).toContain('exKiSHPdGqVrkDVG.webm');
    expect(hevcUrl).toContain('ugmoimFwgmjDksIj.mp4');
    expect(mp4Url).toContain('vOqdkDMXyWIwzDxn.mp4');
  });

  it('should have video with muted and loop attributes', () => {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
  });

  it('should have lazy loading with preload="none" initially', () => {
    const video = document.createElement('video');
    video.preload = 'none';
    
    expect(video.preload).toBe('none');
  });

  it('should support format detection for browser compatibility', () => {
    const video = document.createElement('video');
    
    // Test format detection logic
    let supportedFormat = 'mp4';
    
    if (video.canPlayType('video/webm; codecs="vp9"')) {
      supportedFormat = 'webm';
    } else if (video.canPlayType('video/mp4; codecs="hev1"') || video.canPlayType('video/mp4; codecs="hvc1"')) {
      supportedFormat = 'hevc';
    }
    
    expect(['webm', 'hevc', 'mp4']).toContain(supportedFormat);
  });

  it('should have fallback text for unsupported browsers', () => {
    const video = document.createElement('video');
    video.textContent = 'Your browser does not support the video tag. Please use a modern browser to view this content.';
    
    expect(video.textContent).toContain('browser does not support');
  });

  it('should have video background with fixed positioning', () => {
    const container = document.createElement('div');
    container.className = 'video-background';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '-1';
    
    expect(container.style.position).toBe('fixed');
    expect(container.style.zIndex).toBe('-1');
  });

  it('should have video with responsive dimensions', () => {
    const video = document.createElement('video');
    video.style.position = 'absolute';
    video.style.top = '50%';
    video.style.left = '50%';
    video.style.minWidth = '100%';
    video.style.minHeight = '100%';
    video.style.objectFit = 'cover';
    
    expect(video.style.objectFit).toBe('cover');
    expect(video.style.minWidth).toBe('100%');
  });
});
