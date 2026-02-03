import { BrowserWindow } from 'electron'
import { join } from 'node:path'

import type { WindowProps } from 'shared/types'
import { ENVIRONMENT } from 'shared/constants'

export function createWindow({ id, ...settings }: WindowProps) {
  const window = new BrowserWindow(settings)

  if (ENVIRONMENT.IS_DEV) {
    window.loadURL(`http://localhost:4927/#/`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  window.on('closed', window.destroy)

  return window
}
