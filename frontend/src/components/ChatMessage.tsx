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

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  fiberCards?: FiberCardData[];
  structureImages?: StructureImage[];
  userName?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  fiberCards,
  structureImages,
  userName = 'U',
}) => {
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
