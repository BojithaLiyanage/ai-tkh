import React from 'react';
import FiberCard from './FiberCard';

interface FiberCardData {
  name: string;
  fiber_class?: string;
  subtype?: string;
  description?: string;
  applications?: string[];
  trade_names?: string[];
  key_properties?: Record<string, string>;
}

interface StructureImage {
  fiber_name: string;
  image_url: string;
  fiber_id: string;
  image_cms_id?: string;
}

interface VideoPreview {
  id: number;
  fiber_id: number;
  fiber_name: string;
  video_link: string;
  title?: string;
  description?: string;
}

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  fiberCards?: FiberCardData[];
  structureImages?: StructureImage[];
  relatedVideos?: VideoPreview[];
  userName?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  fiberCards,
  structureImages,
  relatedVideos,
  userName = 'U',
}) => {
  // Extract YouTube video ID from URL
  const getYouTubeThumbnail = (url: string): string | null => {
    try {
      // Match various YouTube URL formats
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[7].length === 11) ? match[7] : null;

      if (videoId) {
        // Use maxresdefault for best quality, fallback to hqdefault if not available
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
      return null;
    } catch {
      return null;
    }
  };

  if (role === 'ai') {
    return (
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
          AI
        </div>
        <div className="flex-1 max-w-3xl space-y-3">
          {/* AI Text Response */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>

          {/* Structure Images (if any) */}
          {structureImages && structureImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide px-2">
                  Structure Diagrams
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {structureImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 text-sm">{img.fiber_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Molecular Structure</p>
                    </div>
                    <div className="p-4 bg-white flex items-center justify-center min-h-[200px]">
                      <img
                        src={img.image_url}
                        alt={`${img.fiber_name} structure`}
                        className="max-w-full max-h-[250px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fiber Cards (if any) */}
          {fiberCards && fiberCards.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2">
                  Relevant Fibers
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {fiberCards.map((fiber, idx) => (
                  <FiberCard key={idx} {...fiber} />
                ))}
              </div>
            </div>
          )}

          {/* Related Videos (if any) */}
          {relatedVideos && relatedVideos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide px-2">
                  Related Materials
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedVideos.map((video) => {
                  const thumbnail = getYouTubeThumbnail(video.video_link);
                  return (
                    <a
                      key={video.id}
                      href={video.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-400 transition-all duration-200"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-gray-100">
                        {thumbnail ? (
                          <>
                            <img
                              src={thumbnail}
                              alt={video.title || `${video.fiber_name} video`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
                              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-lg">
                                <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                </svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
                            <svg className="w-16 h-16 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-purple-700 transition-colors">
                          {video.title || `Video about ${video.fiber_name}`}
                        </h4>
                        <p className="text-xs text-purple-600 font-medium mb-1">
                          Fiber: {video.fiber_name}
                        </p>
                        {video.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User message
  return (
    <div className="flex items-start space-x-3 justify-end">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-sm max-w-md">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
        {userName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

export default ChatMessage;
