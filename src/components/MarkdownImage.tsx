'use client'

import Image from 'next/image'

interface MarkdownImageProps {
  src: string
  alt: string
}

export default function MarkdownImage({ src, alt }: MarkdownImageProps) {
  return (
    <div className="my-8 flex justify-center">
      <div className="max-w-md mx-auto">
        <Image
          src={src}
          alt={alt}
          width={400}
          height={600}
          className="rounded-lg shadow-lg"
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '500px'
          }}
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
          <p className="text-center text-sm text-gray-600 mt-3">{alt}</p>
        )}
      </div>
    </div>
  );
}