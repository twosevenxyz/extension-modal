export function triggerEvent (name: string, data: any, el: Window = window.top!, waitForAck = false) {
  return new Promise<void>(resolve => {
    data.__evt_name = name
    if (waitForAck) {
      const ackID = Math.random() * 1e9 | 0
      const ackEvent = `${name}-${ackID}`
      data.ack = {
        event: ackEvent
      }
      window.addEventListener('message', function once ({ data: msg }) {
        if (msg?.action === ackEvent) {
          return
        }
        window.removeEventListener('message', once)
        return resolve()
      })
    }
    el.postMessage(data, '*')
    if (!waitForAck) {
      resolve()
    }
  })
}
