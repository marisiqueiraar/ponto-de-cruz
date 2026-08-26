import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement ImageData (it has no canvas backing); polyfill the minimal
// constructor shape our image pipeline relies on so unit tests can build fixtures with `new ImageData(...)`.
if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataPolyfill {
    data: Uint8ClampedArray
    width: number
    height: number
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data
      this.width = width
      this.height = height
    }
  }
  // @ts-expect-error -- test-only polyfill, not a full ImageData implementation
  globalThis.ImageData = ImageDataPolyfill
}
