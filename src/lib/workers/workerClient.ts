import * as Comlink from 'comlink'
import type { PatternWorkerApi } from './patternWorker'

export interface PatternWorkerClient {
  api: Comlink.Remote<PatternWorkerApi>
  terminate: () => void
}

export function createPatternWorkerClient(): PatternWorkerClient {
  const worker = new Worker(new URL('./patternWorker.ts', import.meta.url), { type: 'module' })
  return {
    api: Comlink.wrap<PatternWorkerApi>(worker),
    terminate: () => worker.terminate(),
  }
}
