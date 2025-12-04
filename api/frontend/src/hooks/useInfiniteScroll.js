import { useState, useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(items, itemsPerPage = 20) {
  const [displayedItems, setDisplayedItems] = useState(items.slice(0, itemsPerPage));
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef(null);
  const [hasMore, setHasMore] = useState(items.length > itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar quando items mudar (busca nova ou filtro)
  useEffect(() => {
    setDisplayedItems(items.slice(0, itemsPerPage));
    setPage(1);
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Simular pequeno delay para carregamento
    setTimeout(() => {
      const nextPage = page + 1;
      const newItems = items.slice(0, nextPage * itemsPerPage);
      setDisplayedItems(newItems);
      setPage(nextPage);
      setHasMore(newItems.length < items.length);
      setIsLoading(false);
    }, 200);
  }, [page, items, itemsPerPage, hasMore, isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Disparar quando chegar a 80% do scroll
      if (scrollHeight - scrollTop - clientHeight < clientHeight * 0.2) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    scrollContainerRef,
    loadMore
  };
}
