import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

import type { WindowProps } from 'shared/types'
import { ENVIRONMENT } from 'shared/constants'

export function createWindow({ id, ...settings }: WindowProps) {
  const window = new BrowserWindow(settings)

  if (ENVIRONMENT.IS_DEV) {
    window.loadURL(`http://localhost:4927/${id}`)
  } else {
    window.loadFile(join(app.getAppPath(), 'renderer', 'index.html'), {
      hash: `/${id}`,
    })
  }

  window.on('closed', window.destroy)

  return window
}
