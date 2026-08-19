'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchIcon, X, BookOpen, ShoppingBag, FileText, ArrowRight } from 'lucide-react'

interface SearchResultItem {
  id?: string
  title: string
  href: string
  description?: string
  category: string
  priceInUSD?: number
}

interface SearchResults {
  products: SearchResultItem[]
  docs: SearchResultItem[]
  research: SearchResultItem[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function SearchModal({ isOpen, onClose, initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults>({ products: [], docs: [], research: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialQuery])

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], docs: [], research: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data: SearchResults) => {
          setResults(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }, 150)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (href: string) => {
    onClose()
    router.push(href)
  }

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onClose()
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const hasResults =
    results.products.length > 0 || results.docs.length > 0 || results.research.length > 0

  return (
    <div className="fixed inset-0 z-[400] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 z-10 animate-in fade-in-0 zoom-in-95">
        {/* Search Input Bar */}
        <form onSubmit={handleFullSearch} className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <SearchIcon className="h-5 w-5 text-neutral-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, docs, research… (Press Esc to close)"
            className="w-full bg-transparent text-base outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-500 font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded flex-shrink-0">
            ESC
          </span>
        </form>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Searching system…
            </div>
          )}

          {!loading && query.trim() && !hasResults && (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No results found for &quot;<span className="font-semibold">{query}</span>&quot;
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-6 text-center text-xs text-neutral-400">
              Type a word to search across products, documentation, and research.
            </div>
          )}

          {!loading && hasResults && (
            <>
              {/* Products */}
              {results.products.length > 0 && (
                <div>
                  <div className="flex items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-2">
                    <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Products ({results.products.length})
                  </div>
                  <div className="space-y-1">
                    {results.products.map((item) => (
                      <button
                        key={item.id || item.href}
                        onClick={() => handleSelect(item.href)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group"
                      >
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white">
                          {item.title}
                        </span>
                        {typeof item.priceInUSD === 'number' && (
                          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            ${item.priceInUSD.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Docs */}
              {results.docs.length > 0 && (
                <div>
                  <div className="flex items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-2">
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Documentation ({results.docs.length})
                  </div>
                  <div className="space-y-1">
                    {results.docs.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelect(item.href)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group"
                      >
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Research */}
              {results.research.length > 0 && (
                <div>
                  <div className="flex items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-2">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Research ({results.research.length})
                  </div>
                  <div className="space-y-1">
                    {results.research.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelect(item.href)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors group"
                      >
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {query.trim() && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              Press Enter for shop results
            </span>
            <button
              onClick={handleFullSearch}
              className="flex items-center text-neutral-700 dark:text-neutral-300 font-medium hover:underline"
            >
              Search shop for &quot;{query}&quot; <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
