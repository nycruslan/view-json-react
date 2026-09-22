import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import axe from 'axe-core';
import { JsonViewer } from './JsonViewer.js';
import { VirtualJsonViewer } from './VirtualJsonViewer.js';
import type { JsonViewerHandle } from './types/index.js';

const installClipboard = (writeText = vi.fn().mockResolvedValue(undefined)) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
};

describe('JsonViewer', () => {
  it('renders an accessible tree with correctly formatted values', () => {
    render(
      <JsonViewer
        data={{ '': 1, name: 'Ada', amount: 2n, active: true }}
        rootName="user"
      />,
    );

    expect(screen.getByRole('tree', { name: 'JSON data' })).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(5);
    expect(screen.getByText('""')).toBeInTheDocument();
    expect(screen.getByText('"Ada"')).toBeInTheDocument();
    expect(screen.getByText('2n')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('uses safe, collision-free row IDs for arbitrary keys', () => {
    render(<JsonViewer data={{ 'a b': 1, a_20b: 2, '\ud800': 3 }} />);
    const ids = screen.getAllByRole('treeitem').map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('renders empty and depth-limited collections as non-expandable', () => {
    const { rerender } = render(<JsonViewer data={{}} />);
    const emptyRoot = screen.getByRole('treeitem', { name: /root, object with 0 items/i });
    expect(emptyRoot).not.toHaveAttribute('aria-expanded');
    expect(emptyRoot).toHaveTextContent('{}');

    rerender(<JsonViewer data={{ child: 1 }} maxDepth={0} />);
    const limitedRoot = screen.getByRole('treeitem', { name: /root, object with 1 item/i });
    expect(limitedRoot).not.toHaveAttribute('aria-expanded');
    expect(screen.getByText('Maximum depth reached')).toBeInTheDocument();
  });

  it('honors a null custom value without rendering the fallback', () => {
    const { container } = render(
      <JsonViewer data={1} renderValue={() => null} />,
    );
    expect(container.querySelector('.vjr-value')).toBeEmptyDOMElement();
  });

  it('implements tree keyboard navigation and expansion', () => {
    render(<JsonViewer data={{ nested: { value: 1 }, other: 2 }} />);
    const tree = screen.getByRole('tree');

    tree.focus();
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    const nested = screen.getByRole('treeitem', { name: /nested, object/i });
    expect(tree).toHaveAttribute('aria-activedescendant', nested.id);

    fireEvent.keyDown(tree, { key: 'ArrowRight' });
    expect(nested).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: /value, number, 1/i })).toBeInTheDocument();

    fireEvent.keyDown(tree, { key: 'ArrowLeft' });
    expect(nested).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(tree, { key: 'End' });
    expect(tree).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('treeitem', { name: /other, number/i }).id,
    );
    fireEvent.keyDown(tree, { key: 'Home' });
    fireEvent.keyDown(tree, { key: 'o' });
    expect(tree).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('treeitem', { name: /other, number/i }).id,
    );

    fireEvent.keyDown(tree, { key: 'Home' });
    fireEvent.keyDown(tree, { key: 'Enter' });
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
  });

  it('reports clipboard success only after the write resolves', async () => {
    const writeText = installClipboard();
    const onCopy = vi.fn();
    render(<JsonViewer data={{ ok: true }} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy value of root' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));

    expect(writeText).toHaveBeenCalledWith('{\n  "ok": true\n}');
    expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({
      path: [],
      value: { ok: true },
      kind: 'value',
      success: true,
    }));
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard');
  });

  it('reports clipboard failures without claiming success', async () => {
    installClipboard(vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')));
    const onCopy = vi.fn();
    render(<JsonViewer data="secret" onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy value of root' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));

    expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.any(DOMException),
    }));
    expect(screen.getByRole('status')).toHaveTextContent('Could not copy');
  });

  it('keeps the latest copy status when writes resolve out of order', async () => {
    const resolvers = new Map<string, () => void>();
    installClipboard(vi.fn((text: string) => new Promise<void>(resolve => {
      resolvers.set(text, resolve);
    })));
    const onCopy = vi.fn();
    render(<JsonViewer data={{ first: 1, second: 2 }} onCopy={onCopy} />);

    const first = screen.getByRole('button', { name: 'Copy value of first' });
    const second = screen.getByRole('button', { name: 'Copy value of second' });
    fireEvent.click(first);
    fireEvent.click(second);

    act(() => resolvers.get('2')?.());
    await waitFor(() => expect(second).toHaveClass('vjr-action--copied'));

    act(() => resolvers.get('1')?.());
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));
    expect(second).toHaveClass('vjr-action--copied');
    expect(first).not.toHaveClass('vjr-action--copied');
  });

  it('copies typed paths without including the display-only root name', async () => {
    const writeText = installClipboard();
    const onCopy = vi.fn();
    render(
      <JsonViewer
        data={{ users: [{ name: 'Ada' }] }}
        rootName="response"
        defaultExpandDepth={4}
        copy={{ value: false, path: true }}
        onCopy={onCopy}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy path of name' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith('$.users[0].name');
    expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({
      path: ['users', 0, 'name'],
      kind: 'path',
      success: true,
    }));
  });

  it('supports controlled expansion', () => {
    const onExpandedPathsChange = vi.fn();
    render(
      <JsonViewer
        data={{ nested: { value: 1 } }}
        expandedPaths={new Set()}
        onExpandedPathsChange={onExpandedPathsChange}
      />,
    );

    fireEvent.click(screen.getByRole('treeitem', { name: /root, object/i }));
    expect(onExpandedPathsChange).toHaveBeenCalledWith(
      new Set(['']),
      expect.objectContaining({ path: [], expanded: true }),
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <JsonViewer
        data={{ nested: { value: 1 }, items: [true, null] }}
        copy={{ value: true, path: true }}
      />,
    );
    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it('searches collapsed descendants and navigates matches', () => {
    const ref = createRef<JsonViewerHandle>();
    const onSearchMatchCount = vi.fn();
    render(
      <JsonViewer
        ref={ref}
        data={{ hidden: { first: 'needle', second: 'needle' }, other: true }}
        defaultExpandDepth={0}
        searchQuery="needle"
        onSearchMatchCount={onSearchMatchCount}
      />,
    );

    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
    expect(screen.getAllByText('"needle"')).toHaveLength(2);
    expect(onSearchMatchCount).toHaveBeenLastCalledWith(2);
    act(() => expect(ref.current?.nextMatch()).toBe(true));
    expect(screen.getByRole('tree')).toHaveAttribute(
      'aria-activedescendant',
      screen.getAllByText('"needle"')[0].closest('[role="treeitem"]')?.id,
    );
  });

  it('collapses and expands long strings without changing the value', () => {
    const { rerender } = render(
      <JsonViewer data={{ message: 'abcdefghij' }} collapseStringsAfterLength={4} />,
    );
    const toggle = screen.getByRole('button', { name: /expand string value of message/i });
    expect(toggle).toHaveTextContent('"abcd"…');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /collapse string value of message/i }))
      .toHaveTextContent('"abcdefghij"');

    rerender(<JsonViewer data={{ emoji: '😀x' }} collapseStringsAfterLength={1} />);
    expect(screen.getByRole('button', { name: /expand string value of emoji/i }))
      .toHaveTextContent('"😀"…');

    rerender(<JsonViewer data="complete" collapseStringsAfterLength={0} />);
    expect(screen.queryByRole('button', { name: /expand string/i })).not.toBeInTheDocument();
    expect(screen.getByText('"complete"')).toBeInTheDocument();
  });

  it('windows large trees while preserving tree semantics', async () => {
    const { container } = render(
      <VirtualJsonViewer data={Array.from({ length: 1_000 }, (_, i) => i)} />,
    );
    const tree = screen.getByRole('tree');
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(50);

    fireEvent.scroll(tree, { target: { scrollTop: 2_815 } });
    expect(tree.scrollTop).toBe(2_815);
    expect(tree).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('treeitem', { name: /99, number, 99/i }).id,
    );

    fireEvent.keyDown(tree, { key: 'End' });
    const finalRow = screen.getByRole('treeitem', { name: /999, number, 999/i });
    expect(tree).toHaveAttribute('aria-activedescendant', finalRow.id);
    fireEvent.scroll(tree);
    expect(tree).toHaveAttribute('aria-activedescendant', finalRow.id);

    const result = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it('exposes focused expansion controls through its ref', () => {
    const ref = createRef<JsonViewerHandle>();
    render(<JsonViewer ref={ref} data={{ nested: { value: 1 } }} />);

    act(() => ref.current?.expand('/nested'));
    expect(screen.getByRole('treeitem', { name: /value, number/i })).toBeInTheDocument();
    act(() => expect(ref.current?.focusPath('/nested')).toBe(true));
    expect(screen.getByRole('tree')).toHaveFocus();

    act(() => ref.current?.collapseAll());
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
  });
});
