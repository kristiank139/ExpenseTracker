import { useDraggable } from '@dnd-kit/core';

export function Draggable({id, children}) {
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id,
  });

  const style = {
    transform: transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined,
    backgroundColor: '#F9FAFB',
    fontSize: "0.9rem",
    //opacity: isDragging ? 0 : 1,
  };
  
  return (
    <li className="draggable-item" data-id={id} ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </li>
  );
}
