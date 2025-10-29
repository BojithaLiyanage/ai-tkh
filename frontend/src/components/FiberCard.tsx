import React from 'react';

interface FiberCardProps {
  name: string;
  fiber_class?: string;
  subtype?: string;
  description?: string;
  applications?: string[];
  trade_names?: string[];
  key_properties?: Record<string, string>;
}

const FiberCard: React.FC<FiberCardProps> = ({
  name,
  fiber_class,
  subtype,
  description,
  applications,
  trade_names,
  key_properties,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {fiber_class && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
            {fiber_class}
          </span>
        )}
      </div>

      {/* Content Grid */}
      <div className="space-y-3">
        {/* Applications */}
        {applications && applications.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Applications
            </h5>
            <div className="flex flex-wrap gap-2">
              {applications.slice(0, 4).map((app, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200"
                >
                  {app}
                </span>
              ))}
              {applications.length > 4 && (
                <span className="px-2 py-1 text-gray-500 text-xs">
                  +{applications.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Trade Names */}
        {trade_names && trade_names.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Trade Names
            </h5>
            <p className="text-sm text-gray-600">
              {trade_names.join(', ')}
            </p>
          </div>
        )}

        {/* Key Properties */}
        {key_properties && Object.keys(key_properties).length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Key Properties
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(key_properties).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white rounded px-2 py-1.5 border border-gray-200"
                >
                  <div className="text-xs text-gray-500">{key}</div>
                  <div className="text-sm font-medium text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiberCard;
