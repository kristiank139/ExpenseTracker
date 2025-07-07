export function DragPreview({ styles, children }) {
  return (
    <li
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        top: 0,
        left: 0,
        ...styles,
        backgroundColor: '#F9FAFB',
        fontSize: "0.9rem"
      }}
    >
      {children}
    </li>
  );
}