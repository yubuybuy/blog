'use client'

import Image from 'next/image'

interface MarkdownImageProps {
  src: string
  alt: string
}

export default function MarkdownImage({ src, alt }: MarkdownImageProps) {
  return (
    <div className="my-6">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={400}
        className="rounded-lg w-full"
        style={{ height: 'auto' }}
        unoptimized
        onError={(e) => {
          console.error('Image failed to load:', src);
          // 隐藏失败的图片
          (e.target as HTMLElement).style.display = 'none';
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src);
        }}
      />
      {alt && (
        <p className="text-center text-sm text-gray-600 mt-2">{alt}</p>
      )}
    </div>
  );
}