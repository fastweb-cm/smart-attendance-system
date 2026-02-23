import { useEffect } from 'react';

// const Loading = lazy(() => import("../shared/Loading"));
// const Button = lazy(() => import('./Button'));
import {Button} from '../ui/button';

const Modal = ({ isOpen = false, btnx= true, btn = true, onClose, title, children }) => {
  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-100 rounded-md shadow-md animate-fade-in-up w-[80%] lg:w-[50%]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary">
          <h4 className='text-sm md:text-xl'>{title}</h4>
          {btnx && (<Button
            onClick={onClose}
            className="text-error hover:bg-primary/80 cursor-pointer hover:text-red focus:outline-none"
            aria-label="Close modal"
            title='close modal'
          >
            ✕
          </Button>)}
        </div>
        <div className="px-4 py-2">{children}</div>
        {btn &&
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button>close</Button>
        </div>}
      </div>
    </div>
  );
};


export default Modal;
