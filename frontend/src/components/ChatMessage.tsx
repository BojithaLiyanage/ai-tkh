import React, { useState, useEffect } from 'react';
import { Tooltip, Button, message as antMessage, Typography, Space } from 'antd';
import {
  CopyOutlined,
  CheckOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons';
import FiberCard from './FiberCard';

const { Paragraph } = Typography;

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

interface MorphologyImage {
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
  morphologyImages?: MorphologyImage[];
  relatedVideos?: VideoPreview[];
  userName?: string;
  isLoading?: boolean;
  isNew?: boolean;
  onMediaLoad?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  fiberCards,
  structureImages,
  morphologyImages,
  relatedVideos,
  isLoading = false,
  isNew = false,
  onMediaLoad,
}) => {
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showMedia, setShowMedia] = useState(false);
  const [userWantsMedia, setUserWantsMedia] = useState<boolean | null>(null);

  // Typing animation effect - animate only for new AI messages
  useEffect(() => {
    if (role !== 'ai' || !isNew) {
      setDisplayedText(content);
      setIsTyping(false);
      setShowMedia(true);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    setShowMedia(false);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedText(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        // Show media after typing completes
        setTimeout(() => {
          setShowMedia(true);
          onMediaLoad?.();
        }, 500);
      }
    }, 15); // Type speed: 15ms per character

    return () => clearInterval(typingInterval);
  }, [content, role, isNew]);

  // Trigger scroll when user accepts media
  useEffect(() => {
    if (userWantsMedia === true) {
      onMediaLoad?.();
    }
  }, [userWantsMedia]);

  // Trigger scroll as text is being typed
  useEffect(() => {
    if (isTyping && isNew && role === 'ai') {
      onMediaLoad?.();
    }
  }, [displayedText, isTyping, isNew, role]);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      antMessage.success('Message copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      antMessage.error('Failed to copy message');
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (role === 'ai') {
    return (
      <div className="flex items-start space-x-3 group">
        {/* AI Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <RobotOutlined className="text-lg" />
        </div>

        <div className="flex-1 max-w-3xl space-y-3">
          {/* AI Text Response */}
          <div className="relative">
            <div className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-200">
              <Paragraph
                className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-0"
                style={{ fontSize: '15px', minHeight: '24px' }}
              >
                {displayedText}
                {isTyping && <span className="animate-pulse">▌</span>}
              </Paragraph>
            </div>

            {/* Message Actions */}
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-gray-400">{getCurrentTime()}</span>
              <Space size="small">
                <Tooltip title={copied ? 'Copied!' : 'Copy message'}>
                  <Button
                    type="text"
                    size="small"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      copied ? 'text-green-600' : 'text-gray-500 hover:text-blue-600'
                    }`}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>

          {/* Media Prompt - Ask user if they need diagrams/images */}
          {showMedia && userWantsMedia === null && (structureImages?.length || morphologyImages?.length || relatedVideos?.length) ? (
            <div className="flex mt-3 ">
              <p className="text-sm text-blue-700 mr-5">
               <span className="font-medium">Do you need to see {[
                  structureImages?.length && 'structure diagrams',
                  morphologyImages?.length && 'morphology images',
                  relatedVideos?.length && 'related materials'
                ].filter(Boolean).join(', ')}?</span>
              </p>
              <Space size="small">
                <Button
                  type="default"
                  size="small"
                  onClick={() => setUserWantsMedia(true)}
                  // className="bg-blue-600 hover:bg-blue-700"
                >
                  Yes
                </Button>
                <Button
                  type="default"
                  size="small"
                  onClick={() => setUserWantsMedia(false)}
                >
                  No
                </Button>
              </Space>
            </div>
          ) : null}

          {/* Structure Images (if any) */}
          {showMedia && userWantsMedia && structureImages && structureImages.length > 0 && (
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

          {/* Morphology Images (if any) */}
          {showMedia && userWantsMedia && morphologyImages && morphologyImages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide px-2">
                  Morphology Images
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {morphologyImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 text-sm">{img.fiber_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Microscopic Appearance</p>
                    </div>
                    <div className="p-4 bg-white flex items-center justify-center min-h-[200px]">
                      <img
                        src={img.image_url}
                        alt={`${img.fiber_name} morphology`}
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
          {showMedia && userWantsMedia && fiberCards && fiberCards.length > 0 && (
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
          {showMedia && userWantsMedia && relatedVideos && relatedVideos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide px-2">
                  Related Materials
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="flex items-start space-x-3 justify-end group">
      <div className="flex flex-col items-end max-w-md">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <Paragraph
            className="text-white whitespace-pre-wrap mb-0"
            style={{ fontSize: '15px' }}
          >
            {content}
          </Paragraph>
        </div>
        <span className="text-xs text-gray-400 mt-2 px-1">{getCurrentTime()}</span>
      </div>
      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
        <UserOutlined className="text-lg" />
      </div>
    </div>
  );
};

export default ChatMessage;
