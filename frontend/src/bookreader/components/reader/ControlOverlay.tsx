import { useState } from "react";
import { Modal } from "../modal";
import { ChatBot } from "../chatbot";
import type { BookPageDetail } from "@shared/book";

type ControlOverlayProps = {
  showPrevPageControl: boolean;
  showNextPageControl: boolean;
  bookId: string;
  offset: number;
  pageNumber: number;
  totalPages: number;
  pageInfo: BookPageDetail | null;
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
  pageInfo,
  prevPage,
  nextPage,
}: ControlOverlayProps) => {
  const breathModalState = useState(false);

  return (
    <div className="book-control-overlay">
      <button
        className="breath-button"
        onClick={(e) => {
          e.stopPropagation();
          breathModalState[1](true);
        }}
      >
        숨고르기
      </button>
      <Modal
        className="breath-modal"
        state={breathModalState}
        closeOnClickBackground={true}
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
            pageInfo={pageInfo}
          />
        </div>
      </Modal>
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
