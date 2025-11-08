import { bench, describe } from 'vitest';
import typescript from 'typescript';
import { transform as esbuildTransform } from 'esbuild';
import { transform as swcTransform } from '@swc/core';

describe('transpile benchmark', () => {
  const sourceCode = `
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  metadata?: Record<string, any>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

type UserRole = 'admin' | 'user' | 'guest';

class UserService {
  private cache: Map<string, User> = new Map();

  async fetchUser(userId: string): Promise<User | null> {
    if (this.cache.has(userId)) {
      return this.cache.get(userId)!;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return null;
  }

  validateEmail(email: string): boolean {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }
}

async function fetch(payload: Record<string, any>, ctx: { type: string }): Promise<ApiResponse<User[]>> {
  try {
    const service = new UserService();
    const { userIds = [], filter = {} } = payload;

    // Type guard function
    const isValidUserId = (id: any): id is string => {
      return typeof id === 'string' && id.length > 0;
    };

    // Filter and process user IDs
    const validIds = (userIds as any[])
      .filter(isValidUserId)
      .map(id => id.trim())
      .filter((id, index, arr) => arr.indexOf(id) === index);

    // Fetch users in parallel
    const users = await Promise.all(
      validIds.map(async (id) => {
        const user = await service.fetchUser(id);
        return user;
      })
    );

    // Filter out null values and apply additional filters
    const validUsers = users.filter((user): user is User => {
      if (!user) return false;
      if (filter.minAge && (!user.age || user.age < filter.minAge)) return false;
      if (filter.email && !service.validateEmail(user.email)) return false;
      return true;
    });

    // Sort by name
    const sortedUsers = validUsers.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      success: true,
      data: sortedUsers,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}
`;

  bench('typescript', () => {
    typescript.transpile(sourceCode);
  });

  bench('esbuild', async () => {
    await esbuildTransform(sourceCode, {
      loader: 'ts',
      format: 'esm',
      target: 'esnext',
      minify: false,
    });
  });

  bench('swc', async () => {
    await swcTransform(sourceCode, {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
        target: 'esnext',
      },
      module: {
        type: 'es6',
      },
      minify: false,
    });
  });
});
