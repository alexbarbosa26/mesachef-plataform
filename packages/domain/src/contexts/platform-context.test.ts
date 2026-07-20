import { describe, expect, it } from 'vitest';
import { PlatformContext } from './platform-context.js';

describe('PlatformContext', () => {
  it('cria contexto com sucesso com userId', () => {
    const context = PlatformContext.create({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      correlationId: 'req-123',
    });
    
    expect(context.userId?.toString()).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(context.correlationId).toBe('req-123');
  });

  it('cria contexto com sucesso sem userId (ex: job background)', () => {
    const context = PlatformContext.create({
      correlationId: 'job-123',
    });
    
    expect(context.userId).toBeUndefined();
    expect(context.correlationId).toBe('job-123');
  });
});
