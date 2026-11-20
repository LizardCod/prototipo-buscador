import React from 'react';
import { splitHighlightSegments } from '../utils/searchEngine';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  query,
  className = '',
}) => {
  if (!text) return <span className="text-slate-400">—</span>;
  const segments = splitHighlightSegments(text, query);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark
            key={i}
            className="bg-blue-100 text-blue-900 rounded-xs px-0.5 font-semibold"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </span>
  );
};
