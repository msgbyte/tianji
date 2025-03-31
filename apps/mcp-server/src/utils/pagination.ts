/**
 * Generic paginated data fetcher
 * Automatically fetches all pages of data using a cursor-based pagination approach
 */

export interface PaginationParams {
  cursor?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  [key: string]: any;
}

export async function fetchAllPaginatedData<T, P extends PaginationParams>(
  fetchFunction: (params: P) => Promise<PaginatedResponse<T>>,
  params: P
): Promise<{ total: number; items: T[] }> {
  const allResults: T[] = [];
  let currentCursor = params.cursor;
  let hasMore = true;

  while (hasMore) {
    // Create a new params object with the current cursor
    const currentParams = {
      ...params,
      cursor: currentCursor,
    } as P;

    const results = await fetchFunction(currentParams);

    // Add current page results to the total results array
    if (results.items && Array.isArray(results.items)) {
      allResults.push(...results.items);
    }

    // Check if there are more pages
    if (results.nextCursor) {
      currentCursor = results.nextCursor;
    } else {
      hasMore = false;
    }
  }

  return {
    total: allResults.length,
    items: allResults,
  };
}
