export function DragPreview({ styles, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        top: 0,
        left: 0,
        ...styles,
      }}
    >
      {children}
    </div>
  );
}