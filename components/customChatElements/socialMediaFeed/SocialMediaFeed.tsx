import React, { useState } from 'react'
import { Heart, MessageCircle, Share2, X } from 'lucide-react'
import { proxyImageUrl } from '../../../lib/utils/imageProxy';

interface SocialMediaPost {
  id: string
  avatar: string
  username: string
  timestamp: string
  content: string
  image?: string
  platform?: 'instagram' | 'twitter' | 'facebook'
}

interface SocialMediaFeedProps {
  posts: SocialMediaPost[]
  theme?: any
}

export function SocialMediaFeed({ posts, theme = {} }: SocialMediaFeedProps) {
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null)

  // Default theme values
  const appliedTheme = {
    background: theme.background || '#ffffff',
    text: theme.text || '#000000',
    radius: theme.radius || '8px',
    ...theme
  }

  return (
    <div className="@container social-media-feed w-full">
      {/* Expanded post above the grid */}
      {selectedPost && (
        <div className="w-full max-w-5xl mx-auto mb-6">
          <div className="bg-white/95 rounded-lg shadow-lg flex flex-col relative p-0" style={{ borderRadius: appliedTheme.radius, minHeight: 400 }}>
            <button
              className="absolute top-3 left-3 text-white hover:text-gray-200 z-10 drop-shadow-lg"
              onClick={() => setSelectedPost(null)}
              aria-label="Close"
            >
              <X size={28} />
            </button>
            {/* Media Full Size */}
            {selectedPost.image && (
              <img
                src={proxyImageUrl(selectedPost.image)}
                alt="Post visual"
                className="w-full max-h-[60vh] object-contain rounded-t-lg"
                style={{ borderTopLeftRadius: appliedTheme.radius, borderTopRightRadius: appliedTheme.radius }}
              />
            )}
            {/* Post Details */}
            <div className="p-6 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={proxyImageUrl(selectedPost.avatar)}
                  alt={selectedPost.username}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <div className="@lg:text-sm @md:text-xs @sm:text-xs text-xs font-medium" style={{ color: appliedTheme.text }}>{selectedPost.username}</div>
                  <div className="@lg:text-xs @md:text-xs @sm:text-xs text-xs text-gray-500">{selectedPost.timestamp}</div>
                </div>
                {selectedPost.platform && (
                  <span className="ml-auto @lg:text-xs @md:text-xs @sm:text-xs text-xs opacity-60 capitalize">
                    {selectedPost.platform}
                  </span>
                )}
              </div>
              {/* Content */}
              <div className="@lg:text-sm @md:text-xs @sm:text-xs text-xs" style={{ color: appliedTheme.text }}>{selectedPost.content}</div>
              {/* Actions */}
              <div className="flex gap-6 pt-2">
                <button className="flex items-center gap-1 text-gray-500 hover:text-pink-500 transition-colors @lg:text-xs @md:text-xs @sm:text-xs text-xs">
                  <Heart size={16} /> Like
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors @lg:text-xs @md:text-xs @sm:text-xs text-xs">
                  <MessageCircle size={16} /> Comment
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors @lg:text-xs @md:text-xs @sm:text-xs text-xs">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Instagram-style grid with at least 9 cells */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-3 gap-2">
        {posts.map((post) => (
          <button
            key={post.id}
            className="aspect-square w-full overflow-hidden bg-gray-100 focus:outline-none"
            onClick={() => post.image && setSelectedPost(post)}
            style={{ borderRadius: appliedTheme.radius }}
            aria-label="View post"
          >
            {post.image ? (
              <img
                src={proxyImageUrl(post.image)}
                alt={post.username}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                style={{ borderRadius: appliedTheme.radius }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 @lg:text-xs @md:text-xs @sm:text-xs text-xs">No Image</div>
            )}
          </button>
        ))}
        {/* Add empty placeholders if fewer than 9 posts */}
        {Array.from({ length: Math.max(0, 9 - posts.length) }).map((_, idx) => (
          <div
            key={`placeholder-${idx}`}
            className="aspect-square w-full bg-gray-100 rounded-lg border border-dashed border-gray-200"
            style={{ borderRadius: appliedTheme.radius }}
          />
        ))}
      </div>
    </div>
  )
} 