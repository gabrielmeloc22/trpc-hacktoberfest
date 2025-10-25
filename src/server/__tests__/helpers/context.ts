import { createContextInner } from '../../context';
import type { Context } from '../../context';

export function createTestContext(
  userId: string | null = null,
): Promise<Context> {
  return createContextInner({ userId });
}
