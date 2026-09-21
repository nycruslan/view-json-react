import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JsonViewer } from './JsonViewer';

describe('JsonViewer', () => {
  it('renders JSON values and a named root', () => {
    const { container } = render(
      <JsonViewer data={{ name: 'Ada', active: true }} rootName="user" />,
    );

    expect(container).toHaveTextContent('"user":');
    expect(container).toHaveTextContent('"name":');
    expect(container).toHaveTextContent('"Ada"');
    expect(container).toHaveTextContent('true');
  });

  it('supports keyboard collapse and expansion', () => {
    render(<JsonViewer data={{ nested: { value: 1 } }} />);

    const rootToggle = screen.getAllByRole('button', { expanded: true })[0];
    fireEvent.keyDown(rootToggle, { key: 'Enter' });
    expect(rootToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(rootToggle, { key: ' ' });
    expect(rootToggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('notifies consumers when copy is requested', () => {
    const onCopy = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<JsonViewer data="value" onCopy={onCopy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy value' }));

    expect(onCopy).toHaveBeenCalledWith({ path: [], value: 'value' });
  });
});
