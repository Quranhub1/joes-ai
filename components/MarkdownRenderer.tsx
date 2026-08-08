'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden text-sm" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100" {...props}>
              {children}
            </td>
          ),
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm my-3" {...props}>
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" {...props}>
              {children}
            </a>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside my-2 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
              {children}
            </ol>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-lg font-bold mt-3 mb-2" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-base font-semibold mt-2 mb-1" {...props}>{children}</h3>
          ),
          p: ({ children, ...props }) => (
            <p className="my-2 leading-relaxed" {...props}>{children}</p>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600" {...props}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
