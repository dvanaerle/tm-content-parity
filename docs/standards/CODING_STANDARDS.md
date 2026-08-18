## Testing

### Core Principle

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't break unless behavior changed.

### Good Tests

Integration-style tests that exercise real code paths through public APIs. They describe _what_ the system does, not _how_.

```typescript
// GOOD: Tests observable behavior through the public interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

- Test behavior users/callers care about
- Use the public API only
- Survive internal refactors
- One logical assertion per test

### Bad Tests

```typescript
// BAD: Mocks internal collaborator, tests HOW not WHAT
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});

// BAD: Bypasses the interface to verify via database
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});
```

```typescript
// BAD: Test restates the implementation — the function IS the spec
test("pitchHref includes from param", () => {
  expect(pitchHref("abc")).toBe("/pitches/abc?from=deliverables");
});
```

Red flags:

- Mocking internal collaborators (your own classes/modules)
- Testing private methods
- Asserting on call counts/order of internal calls
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means (e.g. querying a DB) instead of through the interface
- Testing a trivial function (one-liner, simple mapping, string concatenation) where the test just mirrors the code — these tests add no confidence and break on any refactor
- Thin delegation tests for route handlers — when a route's only job is to parse input and call a service method, testing that it "delegates correctly" by mocking the service duplicates the route code in the test. The real behavior lives in the service; test that instead.

### Mocking

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Time/randomness
- File system or databases when a real instance isn't practical

**Never mock your own classes/modules or internal collaborators.** If something is hard to test without mocking internals, redesign the interface.

Prefer SDK-style interfaces over generic fetchers at boundaries — each function is independently mockable with a single return shape, no conditional logic in test setup.

### TDD Workflow: Vertical Slices

Do NOT write all tests first, then all implementation. That produces tests that verify _imagined_ behavior and are insensitive to real changes.

Correct approach — one test, one implementation, repeat:

```
RED→GREEN: test1→impl1
RED→GREEN: test2→impl2
RED→GREEN: test3→impl3
```

Each test responds to what you learned from the previous cycle. Never refactor while RED — get to GREEN first.

## Interface Design

### Deep Modules

Prefer deep modules: small interface, deep implementation. A few methods with simple params hiding complex logic behind them.

Avoid shallow modules: large interface with many methods that just pass through to thin implementation. When designing, ask: can I reduce the number of methods? Can I simplify the parameters? Can I hide more complexity inside?

### Design for Testability

1. **Accept dependencies, don't create them** — pass external dependencies in rather than constructing them internally.
2. **Return results, don't produce side effects** — a function that returns a value is easier to test than one that mutates state.


## Comments

### Core Principle

Code says *what* it does. A comment says *why*. Prefer making the code say it —
a sharper name, an extracted function, a named constant — and reach for a
comment only for what code genuinely cannot carry.

### The smell

Fowler lists *Comments* as a smell: a comment is often deodorant for code that
should have been made clearer instead. **It applies here.** When you feel the
urge to explain a block, extract and rename it first. The comment that still
looks necessary afterwards is the one worth writing.

### What earns its place

- **A reason.** Why this value, why this order, why the obvious alternative was
  rejected and should stay rejected.
- **JSDoc on exports.** Source is JavaScript, so `@param` / `@returns` /
  `@typedef` carry the types. That is a signature, not commentary.
- **A one-line module header**, where the file's job is not clear from its name.

### What goes

- A comment restating the line beneath it.
- An unfinished thought — it goes in an issue under `.scratch/<feature>/issues/`,
  where triage can see it. No `TODO`, `FIXME`, `XXX` or `HACK` in source.
- Superseded code — git keeps it.
- A section divider naming a region of a long file. It says the file has become
  two files. Until that split happens, one dialect only — `// ---- lowercase
  label` — and no rule padded out to the right, because padding decays on the
  next rename and no formatter repairs it.

### Density is not a violation

A file with more comment lines than code lines is not, on that count, breaking
this standard. JSDoc is a signature, so it never counts as commentary: a file
that is almost entirely `@typedef` is exactly as it should be. What a high ratio
*can* mean is that the code does not say what it does and the comments are
carrying it. The answer to that is Fowler's — extract and rename until the
explanation is unnecessary. It is never to delete the reason and leave the code
as it was.

### Existing code

Most of this repo predates this standard and comments far more heavily. Bring a
file down to this bar when you are already changing it. Beyond that, the test is
whether code moves:

- **Deletion only** — a commit that removes comments and changes no code may
  sweep as many files as it likes. It reads at a glance and cannot regress
  behaviour.
- **Code moves** — an extraction, a rename, a split. One file per commit,
  reviewed as the code change it is, and only where you were already working.

### The bar

Every comment answers a question the code cannot. If a reader could get the same
answer by reading the code, the comment goes.
