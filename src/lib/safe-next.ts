/** Where to go back after logging in. Internal paths only: no //site.com, /\site.com or whitespace the browser strips. */
export function safeNext(next: string): string {
  return /^\/(?![/\\])[^\s\\]*$/.test(next) ? next : "/"
}
