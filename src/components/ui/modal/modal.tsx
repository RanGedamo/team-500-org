
"use client";

import React from "react";
import Modal from "react-modal";

interface MyModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

export const MyModal: React.FC<MyModalProps> = ({
  isOpen,
  onRequestClose,
  children,
}) => {
  return (
    <Modal
    
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      overlayClassName="fixed p-10 inset-0 flex w-full max-w-screen items-center justify-center bg-black/95 z-40"
      className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-lg"
      // ariaHideApp={false} // או Modal.setAppElement באינישיאליזציה
    >
      <button
        onClick={onRequestClose}
        className="absolute top-1 right-3 text-xl text-gray-500 hover:text-black"
      >
        ×
      </button>
      {children}
    </Modal>
  );
};
