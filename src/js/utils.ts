import { v4 as uuidv4 } from 'uuid'

export function triggerEvent (name: string, data: any = {}, isOnTwoSeven: boolean, el = window.top, waitForAck = false) {
  return new Promise<void>(resolve => {
    data.__evt_name = name
    if (waitForAck) {
      const ackID = uuidv4()
      const ackEvent = `${name}-${ackID}`
      data.ack = {
        event: ackEvent
      }
      window.addEventListener('message', function once ({ data: msg }: { data: any }) {
        if (msg?.action !== ackEvent) {
          return
        }
        window.removeEventListener('message', once)
        return resolve()
      })
    }
    data.isOnTwoSeven = isOnTwoSeven
    ;(el as typeof window).postMessage(data, '*')
    if (!waitForAck) {
      resolve()
    }
  })
}
