import React, { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * https://github.com/atlassian/react-beautiful-dnd/issues/2350
 */
export const StrictModeDroppable: React.FC<DroppableProps> = React.memo(
  (props) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
      const animation = requestAnimationFrame(() => setEnabled(true));

      return () => {
        cancelAnimationFrame(animation);
        setEnabled(false);
      };
    }, []);

    if (!enabled) {
      return null;
    }

    return <Droppable {...props}>{props.children}</Droppable>;
  }
);
StrictModeDroppable.displayName = 'StrictModeDroppable';
