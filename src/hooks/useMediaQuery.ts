/**
 * 响应式断点监听：屏幕旋转 / 窗口缩放跨断点时实时更新。
 * 用法：const isDesktop = useMediaQuery('(min-width: 1024px)');
 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** 对应 Tailwind lg 断点（App.tsx 左右分栏的临界点） */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
