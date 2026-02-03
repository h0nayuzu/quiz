import { contextBridge } from 'electron'

declare global {
  interface Window {
    App: typeof API
  }
}

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: 'User', // 暂时硬编码以排除 process.env 的干扰
}

contextBridge.exposeInMainWorld('App', API)
