'use client'

import Image from 'next/image'
import { useState } from 'react'

interface MarkdownImageProps {
  src: string
  alt: string
}

export default function MarkdownImage({ src, alt }: MarkdownImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="my-4 sm:my-6 relative">
      {hasError ? (
        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">图片加载失败</p>
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">加载中...</div>
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            width={800}
            height={400}
            className={`rounded-lg w-full h-auto transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
            quality={75}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
        </>
      )}
      {alt && (
        <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">{alt}</p>
      )}
    </div>
  )
}