import * as Comlink from 'comlink'
import { buildPatternFromImage, type BuildPatternOptions } from '../pattern/buildPattern'
import type { Pattern } from '../../types/pattern'

const api = {
  buildPattern(imageData: ImageData, options: BuildPatternOptions): Pattern {
    return buildPatternFromImage(imageData, options)
  },
}

export type PatternWorkerApi = typeof api

Comlink.expose(api)
