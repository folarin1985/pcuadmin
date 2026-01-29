import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { IoWarningOutline } from 'react-icons/io5';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="Confirmation Required">
      <div className="flex flex-col items-center text-center p-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-pcu-red">
          <IoWarningOutline size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-8">{message}</p>

        <div className="flex gap-3 w-full">
          <Button 
            variant="secondary" 
            className="flex-1" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="flex-1" 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Confirm Action
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;