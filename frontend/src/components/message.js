import React, { useEffect } from 'react';

function Message({ text, type, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Message disappears after 5 seconds
    return () => clearTimeout(timer);
  }, [text, type, onClose]);

  if (!text) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-md border ${bgColor} shadow-lg flex items-center justify-between min-w-[300px]`}>
      <span>{text}</span>
      <button onClick={onClose} className="ml-4 text-lg font-bold">
        &times;
      </button>
    </div>
  );
}

export default Message;
