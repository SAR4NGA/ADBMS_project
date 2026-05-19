import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-6xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[95vw]'
  };

  const widthClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none p-4">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className={`relative w-full ${widthClass} mx-auto my-6 z-50 transition-all duration-300`}>
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-500 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <span className="bg-transparent text-gray-500 h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
            </button>
          </div>
          <div className={`relative ${size === 'xl' || size === 'full' ? 'p-0' : 'p-6'} flex-auto max-h-[85vh] overflow-y-auto`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
