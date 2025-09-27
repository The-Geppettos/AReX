import {
  type PropsWithChildren,
  createContext,
  useContext,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";

const Portal = ({
  targetRef,
  children,
}: PropsWithChildren<{ targetRef: React.RefObject<HTMLElement> }>) => {
  if (!targetRef.current) return null;
  return createPortal(children, targetRef.current);
};

const ModalContext = createContext({
  wrapperRef: {} as React.RefObject<HTMLElement>,
});

export const ModalProvider = ({ children }: PropsWithChildren) => {
  const wrapperRef = useRef({} as HTMLDivElement);

  useEffect(() => {
    const focusTrap = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const lastModalElement = wrapperRef.current.lastChild as HTMLElement;

        if (!lastModalElement) return;

        const FocusableElements = lastModalElement.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ) as NodeListOf<HTMLElement>;

        if (FocusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        if (!document.activeElement) {
          e.preventDefault();
          FocusableElements[0].focus();
          return;
        }

        let idx = -1;

        for (let i = 0; i < FocusableElements.length; i++) {
          if (FocusableElements[i] === document.activeElement) {
            idx = i;
            break;
          }
        }

        if (idx === -1) {
          e.preventDefault();
          FocusableElements[0].focus();
          return;
        }

        if (e.shiftKey) {
          if (idx === 0) {
            e.preventDefault();
            FocusableElements[FocusableElements.length - 1].focus();
          }
        } else {
          if (idx === FocusableElements.length - 1) {
            e.preventDefault();
            FocusableElements[0].focus();
          }
        }
      }
    };

    window.addEventListener("keydown", focusTrap);

    return () => {
      window.removeEventListener("keydown", focusTrap);
    };
  }, []);

  return (
    <ModalContext.Provider value={{ wrapperRef }}>
      {children}
      <div ref={wrapperRef}></div>
    </ModalContext.Provider>
  );
};

type ModalProps = PropsWithChildren<{
  state: [boolean, (n: boolean) => void];
  closeOnClickBackground?: boolean;
  showCloseButton?: boolean;
  className?: string;
}>;

export const Modal = ({
  children,
  closeOnClickBackground = true,
  showCloseButton = true,
  state: [open, setOpen],
  className,
}: ModalProps) => {
  const { wrapperRef } = useContext(ModalContext);

  if (!open) return null;

  return (
    <Portal targetRef={wrapperRef}>
      <div
        className="modal-background"
        onClick={() => {
          if (closeOnClickBackground) setOpen(false);
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
                  setOpen(false);
                }}
              ></button>
            </div>
          )}
          {children}
        </div>
      </div>
    </Portal>
  );
};
