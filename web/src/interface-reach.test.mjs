import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The one rule of ticket 03 that can be grepped: **an icon is not a name.**
 *
 * A control whose whole content is a glyph or an icon says nothing to a reader who cannot
 * see it. This interface has a dozen of them — a `×` that clears a selection, a `↗` that
 * opens the live page, a tick that closes a finding — and each one is a place where a name
 * can be dropped by an edit that never touched the label, because there is no label to
 * touch. That is exactly the kind of rule the ADR says rots without a test.
 *
 * It follows the shape of `interface-weight.test.mjs` and `interface-words.test.mjs`,
 * which is this repo's habit for a rule that can be swept: name every site at once, in
 * source, rather than pay for a standing screenshot suite.
 *
 * **A `title` does not count as the name**, and since ticket 129 it does not count as
 * anything: ADR 0019 refuses hover that reveals something a reader needs, a `title` reaches
 * neither a keyboard reader nor a touch one, and the third rule at the foot of this file is
 * what keeps one from coming back. A hint is `Hint.jsx`'s now.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DRAWN = ['.jsx', '.astro'];

/**
 * shadcn's own primitives are not call sites. They define the button, the checkbox and the
 * dialog rather than spending them, so their content is `{children}` and the name belongs
 * to whoever renders one — the same exemption `interface-weight.test.mjs` gives the badge.
 */
const PRIMITIVES = 'components/ui/';

/** @param {string} text */
const withoutComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');

/** @returns {Promise<[string, string][]>} */
async function drawnFiles(withPrimitives = false) {
  const entries = await readdir(ROOT, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && DRAWN.includes(extname(entry.name)))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => withPrimitives || !named(file).startsWith(PRIMITIVES));
  // The sweep has to actually sweep.
  expect(files.length).toBeGreaterThan(15);
  return Promise.all(
    files.map(async (file) => /** @type {[string, string]} */ ([
      file,
      withoutComments(await readFile(file, 'utf8')),
    ])),
  );
}

/** @param {string} file */
const named = (file) => relative(ROOT, file).split(sep).join('/');

/**
 * The controls a file draws, each as its whole source text.
 *
 * Three tag names and no more: a link, a native button and the one button component. None
 * of the three nests inside itself, which is what makes a non-greedy match honest here —
 * the first closing tag is this element's closing tag.
 */
const CONTROLS = /<(a|button|Button)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;

/**
 * Whether a control's content leaves a reader with nothing to hear.
 *
 * A tag is dropped, because an icon component and a `<span>` around a glyph are both
 * invisible to a screen reader once the name is gone. What is left has to hold a letter or
 * a digit somewhere.
 *
 * A `{…}` expression counts as content, because it is a value this sweep cannot read and a
 * guard that guessed would fail on every control that draws a variable — **except a braced
 * string literal**, which the sweep can read perfectly well. `{'×'}` is the shape an
 * icon-only control takes when the glyph would otherwise trip JSX, and without unwrapping
 * it the one brace would let exactly the regression this guard exists for through.
 *
 * @param {string} content
 */
const saysNothing = (content) =>
  !/[A-Za-z0-9{]/.test(
    content.replace(/<[^>]*>/g, '').replace(/\{\s*(['"])([\s\S]*?)\1\s*\}/g, '$2'),
  );

/** @param {string} attributes */
const isNamed = (attributes) => /\baria-label[=\s]/.test(attributes);

/** @param {string} text */
function unnamedControls(text) {
  const caught = [];
  for (const [whole, , attributes = '', content] of text.matchAll(CONTROLS)) {
    // An `sr-only` child is a name too, and it is how shadcn's own dialog close names
    // itself. It is read off the whole element because the span is in the content.
    if (saysNothing(content) && !isNamed(attributes) && !/sr-only/.test(whole)) {
      caught.push(whole.replace(/\s+/g, ' ').slice(0, 80));
    }
  }
  return caught;
}

/**
 * A class list that deletes the browser's focus outline.
 *
 * The rule is *replaced, never deleted*: shadcn suppresses the native outline on nearly
 * every primitive so it can draw a ring of its own, which is fine, and it also ships one
 * panel that suppresses it and draws nothing — a keyboard reader lands somewhere with no
 * mark at all. So the deletion is allowed and a replacement is required beside it.
 *
 * The replacement may be a ring, a border or a ground: what matters is that something
 * changes under `focus-visible` or `focus`, not which property does it — and that it is
 * written on the **same line**, which is the whole of what makes this greppable. A
 * deletion whose replacement is three lines further down a `cn()` call is a pair a reader
 * has to hold in their head, and a later edit only has to move one of them.
 *
 * @param {string} line
 */
const deletesFocusWithNothingBack = (line) =>
  /\boutline-(none|hidden)\b/.test(line) && !/\bfocus(-visible)?:/.test(line);

describe('every control an editor can reach says what it is', () => {
  it('gives an icon-only control a name of its own', async () => {
    const unnamed = (await drawnFiles()).flatMap(([file, text]) =>
      unnamedControls(text).map((control) => `${named(file)} — ${control}`),
    );
    expect(unnamed).toEqual([]);
  }, 30_000);

  // The guard has to be able to fail, or the pattern could be broken and this file would
  // go on reporting success.
  it('catches the icon-only control a regression would write', () => {
    const nameless = [
      '<Button onClick={onClear}><XIcon /></Button>',
      '<a href={href} title="Open on production">↗</a>',
      '<button type="button" onClick={close}><span aria-hidden>✕</span></button>',
      // The brace is not a hiding place: a glyph JSX made the author quote is still a glyph.
      "<Button onClick={onClear}>{'×'}</Button>",
    ];
    for (const drawn of nameless) expect(unnamedControls(drawn), drawn).toHaveLength(1);
  });

  it('replaces a deleted focus outline and never only deletes it', async () => {
    const blind = (await drawnFiles(true)).flatMap(([file, text]) =>
      text
        .split('\n')
        .map((line, index) => [line, index])
        .filter(([line]) => deletesFocusWithNothingBack(line))
        .map(([line, index]) => `${named(file)}:${index + 1} — ${line.trim()}`),
    );
    expect(blind).toEqual([]);
  }, 30_000);

  it('catches the focus outline a regression would delete', () => {
    expect(deletesFocusWithNothingBack("cn('flex-1 text-sm outline-none', className)")).toBe(true);
    expect(deletesFocusWithNothingBack("'rounded-md p-2 outline-hidden select-none'")).toBe(true);
    expect(
      deletesFocusWithNothingBack("'outline-none focus-visible:ring-3 focus-visible:ring-ring/50'"),
    ).toBe(false);
    expect(deletesFocusWithNothingBack("'rounded-md outline-hidden focus:bg-accent'")).toBe(false);
  });

  it('leaves a control that says something alone', () => {
    const kept = [
      '<Button aria-label="Clear the selection"><XIcon /></Button>',
      '<Button onClick={onClear}>Clear filter</Button>',
      '<button type="button">{BUCKET_LABEL.closed}</button>',
      '<a href={href}><XIcon /><span className="sr-only">Close</span></a>',
    ];
    for (const drawn of kept) expect(unnamedControls(drawn), drawn).toHaveLength(0);
  });
});

/**
 * The second half of *reach*: a control an editor can find still has to be one they can
 * hit. ADR 0019's *target floor* carries the number and the success criterion it answers.
 *
 * What is greppable is the **size a call site names**, so the guard has two halves: no call
 * site asks for a size below the floor, and the primitive that decides what a size means
 * does not offer one back. Neither half sees a rendered pixel — the ADR says so, and says
 * what that leaves to a reader.
 */
const BELOW_THE_FLOOR = [/size="(icon-)?xs"/];

const BUTTON = 'components/ui/button.jsx';

/**
 * The keys of the `size` block, and only that block — `variant` is the same shape one
 * level up and its names would otherwise read as sizes.
 *
 * @param {string} text
 * @returns {string[]}
 */
const sizesDeclared = (text) => {
  const inside = text.split(/^ {6}size: \{$/m)[1]?.split(/^ {6}\},$/m)[0] ?? '';
  return [...inside.matchAll(/^ {8}'?([a-z-]+)'?:/gm)].map(([, name]) => name);
};

describe('every control an editor can reach is big enough to hit', () => {
  it('asks for no size below the target floor', async () => {
    const caught = (await drawnFiles(true)).flatMap(([file, text]) =>
      text
        .split('\n')
        .map((line, index) => /** @type {[string, number]} */ ([line, index]))
        .filter(([line]) => BELOW_THE_FLOOR.some((pattern) => pattern.test(line)))
        .map(([line, index]) => `${named(file)}:${index + 1} — ${line.trim()}`),
    );
    expect(caught).toEqual([]);
  }, 30_000);

  it('offers no size below the target floor', async () => {
    const button = await readFile(join(ROOT, ...BUTTON.split('/')), 'utf8');
    expect(sizesDeclared(button)).toEqual(['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg']);
  });

  // The guard has to be able to fail.
  it('catches the size a regression would name', () => {
    const asked = ['  <Button variant="outline" size="xs" onClick={close}>', '  size="icon-xs"'];
    for (const line of asked) {
      expect(
        BELOW_THE_FLOOR.some((pattern) => pattern.test(line)),
        line,
      ).toBe(true);
    }
  });

  it('leaves a size that clears the floor alone', () => {
    for (const line of [
      '  <Button size="sm">Dismiss</Button>',
      '  size="icon-sm"',
      '  size="lg"',
    ]) {
      expect(
        BELOW_THE_FLOOR.some((pattern) => pattern.test(line)),
        line,
      ).toBe(false);
    }
  });
});

/**
 * The third rule of *reach*: **a hint is not a `title`** (ticket 129).
 *
 * Every hint in this interface was a native `title` until that ticket. A `title` is invisible
 * on a touch screen, unreachable by keyboard, unstyleable and announced by screen readers when
 * they feel like it, so a sentence written for an editor reached the editors holding a mouse.
 * `Hint.jsx` is where a hint is attached now, and this is what keeps the attribute from coming
 * back — one `title` written in a hurry is a hint that has quietly left the keyboard again, and
 * nothing on the screen looks wrong.
 *
 * `ui/` is swept too, because a primitive that starts writing a `title` is exactly the day a
 * guard that trusted `ui/` cannot see.
 */

/**
 * The components that declare a `title` prop of their own.
 *
 * A prop is not an attribute: these three render the string as a heading an editor reads on
 * the screen, and a guard that could not tell the two apart would be switched off by the
 * first person it annoyed. They are **named** rather than inferred from the capital letter,
 * because `<Button title="…">` is a capital letter too and forwards the attribute straight to
 * the DOM. A fourth name added here is a decision, not a formality: prefer `hint`, which is
 * what the shared components' own prop is called since ticket 129.
 */
const TITLE_IS_A_PROP = ['Aside', 'Absent', 'Shell'];

/**
 * The element or component each `title=` in a file belongs to.
 *
 * An attribute belongs to the nearest `<` before it that opens a tag, which is what makes a
 * backwards scan honest here even where the value holds JSX of its own — `<Aside title={<>…
 * <span/>…</>}` names `Aside`, because the span comes after the attribute and not before it.
 *
 * @param {string} text
 * @returns {string[]}
 */
const titledTags = (text) =>
  // Not `\btitle` — a word boundary sits after the hyphen of `data-slot="alert-title"`, and
  // every shadcn primitive with a heading in it writes one of those.
  [...text.matchAll(/(?<![\w-])title\s*=/g)].map(
    ({ index }) => text.slice(text.lastIndexOf('<', index) + 1).match(/^[\w.-]*/)[0],
  );

describe('a hint an editor can reach is never a title attribute', () => {
  it('writes no title attribute in any drawn file', async () => {
    const caught = (await drawnFiles(true)).flatMap(([file, text]) =>
      titledTags(text)
        .filter((tag) => !TITLE_IS_A_PROP.includes(tag))
        .map((tag) => `${named(file)} — <${tag} title=`),
    );
    expect(caught).toEqual([]);
  }, 30_000);

  // The guard has to be able to fail.
  it('catches the title a regression would write', () => {
    expect(titledTags('<a href={href} title="Open on production">↗</a>')).toEqual(['a']);
    expect(titledTags('<Button title={hint} onClick={press}>Clear</Button>')).toEqual(['Button']);
    expect(titledTags('<span\n  className="x"\n  title={text}\n>')).toEqual(['span']);
  });

  it('leaves the components that draw a title on the screen alone', () => {
    expect(titledTags('<Aside title={<>Diagnostics (<span>{count}</span>)</>}>')).toEqual([
      'Aside',
    ]);
    expect(titledTags('<Shell title="Stores">')).toEqual(['Shell']);
  });
});
