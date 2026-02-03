import { normalize, dirname } from 'node:path'

export function getDevFolder(path: string) {
  return normalize(dirname(path))
}
