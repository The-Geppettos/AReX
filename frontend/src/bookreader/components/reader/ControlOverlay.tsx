import { useModal } from "../modal";
import { BreathModalContent } from "./breathModal";

type ControlOverlayProps = {
  showPrevPageControl: boolean;
  showNextPageControl: boolean;
  bookId: string;
  offset: number;
  prevPage: () => void;
  nextPage: () => void;
};

export const ControlOverlay = ({
  showPrevPageControl,
  showNextPageControl,
  bookId,
  offset,
  prevPage,
  nextPage,
}: ControlOverlayProps) => {
  const { openModal } = useModal();

  return (
    <>
      <button
        className="breath-button"
        onClick={(e) => {
          e.stopPropagation();
          openModal({
            className: "breath-modal",
            content: <BreathModalContent bookId={bookId} offset={offset} />,
            header: <span>지금까지 읽었던 내용에 대해 질의해보세요!</span>,
            closeOnClickBackground: true,
          });
        }}
      >
        숨고르기
      </button>
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
    </>
  );
};
