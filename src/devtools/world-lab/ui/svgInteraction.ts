const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Readonly<Record<string, string | number>> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

export function installSvgPanZoom(
  svg: SVGSVGElement,
  initial: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): void {
  let view = { ...initial };
  let drag: { x: number; y: number; viewX: number; viewY: number } | undefined;
  const apply = (): void => svg.setAttribute(
    'viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`,
  );
  apply();
  svg.addEventListener('wheel', event => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 1.12 : 0.88;
    const nextWidth = Math.max(initial.width * 0.35, Math.min(initial.width * 3, view.width * factor));
    const nextHeight = nextWidth * initial.height / initial.width;
    view = {
      x: view.x + (view.width - nextWidth) / 2,
      y: view.y + (view.height - nextHeight) / 2,
      width: nextWidth,
      height: nextHeight,
    };
    apply();
  }, { passive: false });
  svg.addEventListener('pointerdown', event => {
    if ((event.target as Element).closest('[data-selectable]')) return;
    drag = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y };
    svg.setPointerCapture?.(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    if (!drag) return;
    const bounds = svg.getBoundingClientRect();
    const scaleX = bounds.width > 0 ? view.width / bounds.width : 1;
    const scaleY = bounds.height > 0 ? view.height / bounds.height : 1;
    view = {
      ...view,
      x: drag.viewX - (event.clientX - drag.x) * scaleX,
      y: drag.viewY - (event.clientY - drag.y) * scaleY,
    };
    apply();
  });
  const end = (): void => { drag = undefined; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
}

