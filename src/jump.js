// Links jump straight to their section rather than gliding through everything in between; only the
// visitor's own scrolling is smoothed. The target is measured from the real scroll position, since
// Lenis's own copy can lag behind after a pinned section or a native touch scroll.
export function jumpTo(lenis, href) {
  const el = href === '#top' ? null : document.querySelector(href)
  const y = el ? el.getBoundingClientRect().top + window.scrollY : 0
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else window.scrollTo(0, y)
}
