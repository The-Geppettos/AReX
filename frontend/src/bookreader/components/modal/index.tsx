import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const Z_INDEX_BASE = 20;

const ModalContext = createContext({
  openModal: (() => 0) as (element: Element) => number,
  closeModal(_element: Element): void {},
});

export const ModalProvider = ({ children }: PropsWithChildren) => {
  const [modalElements, setModalElements] = useState<Element[]>([]);

  const modalFocusTrapInitialized = useRef(false);

  const openModal = useCallback((element: Element) => {
    setModalElements((modalElements) => {
      return [...modalElements, element];
    });
    modalFocusTrapInitialized.current = false;
    return modalElements.length;
  }, []);
  const closeModal = useCallback((element: Element) => {
    setModalElements((modalElements) => {
      if (modalElements[modalElements.length - 1] !== element) {
        console.warn(
          "Trying to close a modal that is not the last one opened.",
        );
        return modalElements;
      }
      return modalElements.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (modalElements.length === 0) return;

    const focusTrap = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const lastModalElement = modalElements[modalElements.length - 1];

        const FocusableElements = lastModalElement.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );

        if (FocusableElements.length === 0) {
          e.preventDefault();
        } else if (!modalFocusTrapInitialized.current) {
          e.preventDefault();
          modalFocusTrapInitialized.current = true;
          (FocusableElements[0] as HTMLElement).focus();
        } else if (!document.activeElement) {
          e.preventDefault();
          (FocusableElements[0] as HTMLElement).focus();
        } else if (
          document.activeElement === FocusableElements[0] &&
          e.shiftKey
        ) {
          e.preventDefault();
          (
            FocusableElements[FocusableElements.length - 1] as HTMLElement
          ).focus();
        } else if (
          document.activeElement ===
            FocusableElements[FocusableElements.length - 1] &&
          !e.shiftKey
        ) {
          e.preventDefault();
          (FocusableElements[0] as HTMLElement).focus();
        }
      }
    };

    const onFocus = () => {
      modalFocusTrapInitialized.current = true;
    };

    window.addEventListener("keydown", focusTrap);
    window.addEventListener("focus", onFocus, true);

    return () => {
      window.removeEventListener("keydown", focusTrap);
      window.removeEventListener("focus", onFocus, true);
    };
  }, [modalElements]);

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const Modal = ({
  open,
  onClose,
  closeOnClickBackground = true,
  showCloseButton = true,
  children,
  className,
}: PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  closeOnClickBackground?: boolean;
  showCloseButton?: boolean;
  className?: string;
}>) => {
  const { closeModal, openModal } = useContext(ModalContext);
  const modalRef = useRef<HTMLDivElement>(null);

  const [modalIndex, setModalIndex] = useState<number>(0);

  useEffect(() => {
    if (open) {
      if (!modalRef.current) {
        console.error("Modal element is not initialized.");
        return;
      }
      const modalElement = modalRef.current;
      const modalIdx = openModal(modalElement);
      setModalIndex(modalIdx);
      return () => closeModal(modalElement);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-background"
      ref={modalRef}
      style={{ zIndex: Z_INDEX_BASE + modalIndex }}
      onClick={() => {
        if (closeOnClickBackground) onClose();
      }}
    >
      <div
        className={`modal${className ? ` ${className}` : ""}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {showCloseButton && (
          <div className="modal-close-button-wrapper">
            <button
              className="modal-close-button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            ></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
