import { useCallback, useMemo, useRef, useState } from "react";

type PaginationScrollbarProps = {
  totalPages: number;
  page: number;
  onChange: (page: number) => void;
};

export const Scrollbar = ({
  totalPages,
  page,
  onChange,
}: PaginationScrollbarProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [hovering, setHovering] = useState<boolean>(false);
  const [hoverPx, setHoverPx] = useState<number>(0);

  // Clamp helper
  const clamp = (n: number, lo: number, hi: number): number =>
    Math.max(lo, Math.min(hi, n));

  // Convert page <-> px along the track
  const pageToPercent = (p: number): number =>
    totalPages <= 1 ? 0 : (p - 1) / (totalPages - 1);
  const percentToPage = useCallback(
    (t: number): number => 1 + Math.round(t * (totalPages - 1)),
    [totalPages],
  );

  const jumpToPageFromClientX = (clientX: number): void => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const t = rect.width === 0 ? 0 : x / rect.width;
    onChange(clamp(percentToPage(t), 1, totalPages));
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    jumpToPageFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    jumpToPageFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Hover preview
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    setHoverPx(clamp(e.clientX - rect.left, 0, rect.width));
  };

  const hoveredPage = useMemo(() => {
    const track = trackRef.current;
    if (!track) return page;
    const rect = track.getBoundingClientRect();
    const t = rect.width === 0 ? 0 : hoverPx / rect.width;
    return clamp(percentToPage(t), 1, totalPages);
  }, [hoverPx, totalPages, page, percentToPage]);

  return (
    <div className="scrollbar-wrapper">
      <div
        className="scrollbar-track"
        ref={trackRef}
        role="slider"
        aria-label="Book pagination"
        aria-valuemin={1}
        aria-valuemax={totalPages}
        aria-valuenow={page}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={onMouseMove}
      >
        {/* Filled track */}
        <div
          className="scrollbar-track-filled"
          style={{
            width: `${pageToPercent(page) * 100}%`,
          }}
        />

        {/* Page number bubble on hover */}
        {hovering && (
          <div className="scrollbar-hover-bubble" style={{ left: hoverPx }}>
            {hoveredPage}
          </div>
        )}
      </div>
    </div>
  );
};
