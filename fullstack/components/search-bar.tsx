"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SearchBarProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  onSearch?: (query: string) => void
  onClose?: () => void
}

export default function SearchBar({
  className = "",
  placeholder = "Search products...",
  autoFocus = false,
  onSearch,
  onClose,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const router = useRouter()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }

    // Add event listener for Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchQuery("")
        setSearchSuggestions([])
        if (onClose) onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [autoFocus, onClose])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchSuggestions(data.suggestions)
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (searchQuery.trim()) {
      setIsOpen(false)

      if (onSearch) {
        onSearch(searchQuery.trim())
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleClear = () => {
    setSearchQuery("")
    setSearchSuggestions([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <Popover open={isOpen && searchSuggestions.length > 0} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                type="search"
                placeholder={placeholder}
                className="w-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
              />
              <div className="absolute right-0 top-0">
                {searchQuery ? (
                  <Button type="button" variant="ghost" size="icon" onClick={handleClear}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                ) : (
                  <Button type="submit" variant="ghost" size="icon">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            {searchSuggestions.length > 0 && (
              <div className="py-2">
                <h3 className="px-4 py-2 text-sm font-medium">Suggestions</h3>
                <ul>
                  {searchSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>
                      <Link
                        href={`/product/${suggestion.id}`}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="h-8 w-8 relative overflow-hidden rounded">
                          <Image
                            src={suggestion.images[0] || "/placeholder.svg"}
                            alt={suggestion.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm">{suggestion.name}</p>
                          <p className="text-xs text-muted-foreground">${suggestion.price.toFixed(2)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                  <li className="border-t mt-2 pt-2">
                    <Button variant="ghost" className="w-full justify-start text-sm px-4" onClick={handleSearch}>
                      View all results
                      <Search className="ml-2 h-3 w-3" />
                    </Button>
                  </li>
                </ul>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </form>
    </div>
  )
}
