/**
 * Scrolls to the first invalid control in DOM order and focuses it without overriding smooth scroll.
 */
export function focusFirstInvalid(root?: ParentNode | null): void {
  setTimeout(() => {
    const scope: ParentNode = root ?? document;
    const target = scope.querySelector<HTMLElement>(
      [
        'input.is-invalid:not(.raw)',
        'textarea.is-invalid:not(.raw)',
        'select.is-invalid:not(.raw)',
        'button.custom-select-trigger.is-invalid',
        '.file-picker.is-invalid',
        '.upload-dropzone.is-invalid',
        'input.invalid',
        'textarea.invalid',
        '[aria-invalid="true"]:not(app-select)'
      ].join(', ')
    );
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusEl = target.matches('input, textarea, select, button')
      ? target
      : target.querySelector<HTMLElement>('button, input, textarea, select');
    focusEl?.focus({ preventScroll: true });
  }, 0);
}
