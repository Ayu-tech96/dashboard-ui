import { useEffect, useRef } from 'react';

export default function useAutoFontSize(value, min = 10, max = 28) {
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const context = document.createElement('canvas').getContext('2d');
    let fontSize = max;

    while (fontSize >= min) {
      context.font = `${fontSize}px Arial`;
      const width = context.measureText(value).width;
      if (width <= input.offsetWidth - 10) break;
      fontSize -= 1;
    }

    input.style.fontSize = `${fontSize}px`;
  }, [value, min, max]);

  return inputRef;
}
