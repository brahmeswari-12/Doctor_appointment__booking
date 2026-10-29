import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic data-fetching hook.
 *
 * @param {Function} fetcher - async function returning the data payload.
 * @param {Array} deps - dependency list; re-runs the fetch when changed.
 * @param {Object} options - { immediate: boolean } run on mount (default true).
 * @returns {{ data, loading, error, refetch }}
 */
export default function useFetch(fetcher, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Keep the latest fetcher without re-triggering the effect.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      run().catch(() => {
        /* error already captured in state */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}
