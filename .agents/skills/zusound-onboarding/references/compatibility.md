# Compatibility and lifecycle

- Use Zustand `>=4.0.0 <6.0.0`. Named imports in the examples target `>=4.5` and 5.
- Modern recipes include `devtools(persist(zusound(initializer)))` and
  `subscribeWithSelector(zusound(initializer))`. Preserve existing state behavior
  and typecheck/test any change to a middleware stack.
- Exactly Zustand 4.0 requires Zusound outermost around selector, persist, or
  devtools middleware and may require legacy default `create` / `createStore`
  imports. Follow the [checked 4.0 fixture](../../../../examples/consumer/smoke-v4.cts).
- Keep the typed initializer and infer the enhanced intermediate before passing
  it to curried `create` / `createStore`. A plain output annotation erases cleanup
  metadata. Do not bypass declaration failures with casts or `skipLibCheck`.
- Production and unknown environments default off. Set `enabled: true` explicitly
  for a deliberate development reproduction.
- Import is SSR-safe. An SSR-created middleware store can use `{ enabled: false }`.
  For client activation, attach a fresh browser subscriber at a client lifecycle
  boundary. Existing middleware has no public enable/disable setter.
- Middleware owns `store.zusoundCleanup()`. Subscriber attachments own both
  `unsubscribe()` and `zs.cleanup()`. Instance cleanup does not detach middleware.
- A subscriber is terminal after cleanup. React StrictMode setup-cleanup-setup
  needs a new `createZusound()` instance inside each effect setup.
- Browsers can require a direct click or tap before audio resumes. Automatic
  state/lifecycle checks do not prove that a person heard audio.

For complete contracts and recipes, see the [API reference](../../../../docs/API.md).
