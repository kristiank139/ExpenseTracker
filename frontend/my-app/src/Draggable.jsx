import { useDraggable } from '@dnd-kit/core';

export function Draggable({id, children}) {
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id,
  });

  const style = {
    transform: transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined,
    opacity: isDragging ? 0 : 1,
    transition: 'opacity 0.2s ease'
  };
  
  return (
    <button data-id={id}ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </button>
  );
}
