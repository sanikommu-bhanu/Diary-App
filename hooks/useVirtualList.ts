/**
 * hooks/useVirtualList.ts — Lightweight virtual scrolling for large entry lists
 * No external dependency. Uses ResizeObserver + scroll events.
 */
import { useEffect, useRef, useState } from "react"

interface VirtualOptions {
  itemHeight:  number   // estimated or fixed item height in px
  overscan?:   number   // extra items to render above/below viewport
}

interface VirtualItem<T> {
  item:      T
  index:     number
  offsetTop: number
}

export interface VirtualListResult<T> {
  containerRef: React.RefObject<HTMLDivElement>
  visibleItems: VirtualItem<T>[]
  totalHeight:  number
}

export function useVirtualList<T>(
  items: T[],
  { itemHeight, overscan = 4 }: VirtualOptions,
): VirtualListResult<T> {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop]           = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight || 600)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex   = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  )

  const visibleItems: VirtualItem<T>[] = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({ item: items[i], index: i, offsetTop: i * itemHeight })
  }

  return {
    containerRef,
    visibleItems,
    totalHeight: items.length * itemHeight,
  }
}
