import React, { useState } from 'react';
import { LinkifiedText } from './LinkifiedText';

interface ExpandableDescriptionProps {
  description: string;
  className?: string;
  defaultExpanded?: boolean;
}

export const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  description,
  className = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!description) return null;

  // Show "Read more" / "Read less" if description is longer than ~80 characters or has multiple lines
  const isLong = description.length > 80 || description.includes('\n');

  return (
    <div className={`text-xs text-gray-400 leading-relaxed ${className}`}>
      <div
        className={`break-words ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        <LinkifiedText text={description} />
      </div>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 mt-1 inline-flex items-center gap-0.5 transition-colors focus:outline-none cursor-pointer"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};
