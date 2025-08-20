import { useState } from "react";
import { Modal } from "../modal";
import { ChatBot } from "../chatbot";

type ControlOverlayProps = {
  showPrevPageControl: boolean;
  showNextPageControl: boolean;
  bookId: string;
  offset: number;
  pageNumber: number;
  totalPages: number;
  prevPage: () => void;
  nextPage: () => void;
};

export const ControlOverlay = ({
  showPrevPageControl,
  showNextPageControl,
  bookId,
  offset,
  pageNumber,
  totalPages,
  prevPage,
  nextPage,
}: ControlOverlayProps) => {
  const [openBreathModal, setOpenBreathModal] = useState(false);

  return (
    <div className="book-control-overlay">
      <button
        className="breath-button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenBreathModal(true);
        }}
      >
        숨고르기
      </button>
      {openBreathModal && (
        <Modal
          open={openBreathModal}
          onClose={() => setOpenBreathModal(false)}
          closeOnClickBackground={true}
          className="breath-modal"
        >
          <div className="breath-modal-header">
            지금까지 읽었던 내용에 대해 질의해보세요!
          </div>
          <div className="breath-modal-content">
            <ChatBot
              bookId={bookId}
              offset={offset}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />
          </div>
        </Modal>
      )}
      {showPrevPageControl && (
        <button
          className="page-control-button left"
          onClick={(e) => {
            e.stopPropagation();
            prevPage();
          }}
        >
          {"<"}
        </button>
      )}
      {showNextPageControl && (
        <button
          className="page-control-button right"
          onClick={(e) => {
            e.stopPropagation();
            nextPage();
          }}
        >
          {">"}
        </button>
      )}
    </div>
  );
};
