/**
 * The one thing React wants to be told before a test renders anything.
 *
 * Every browser test here drives a hook through `act()`, and React only treats `act()` as
 * a flush barrier when this flag is set — otherwise it prints *the current testing
 * environment is not configured to support act(...)* and the calls fall back to whatever
 * batching the event happened to have. That is a test suite passing for a reason it did
 * not choose, which is the same failure mode as a test that never went red.
 *
 * It is a setup file rather than a line in each test because it is a property of the
 * project, and the `node` project must not have it: nothing there renders.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
