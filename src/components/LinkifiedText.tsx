import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

interface LinkifiedTextProps {
  text: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('http://') || part.startsWith('https://')) {
          let url = part;
          let trailingPunct = '';
          const match = part.match(/^(https?:\/\/[^\s<]+?)([.,!?:;)]*)$/);
          if (match) {
            url = match[1];
            trailingPunct = match[2];
          }

          return (
            <React.Fragment key={index}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="underline transition-colors break-all hover:text-[#38bdf8] font-medium"
                style={{ color: '#00aaff', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                {url}
              </a>
              {trailingPunct}
            </React.Fragment>
          );
        }
        return part;
      })}
    </>
  );
};
