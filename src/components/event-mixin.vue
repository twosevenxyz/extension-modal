<script>
export default {
  methods: {
    triggerEvent (name, data = {}, el = window.top, waitForAck = false) {
      return new Promise(resolve => {
        data.__evt_name = name
        if (waitForAck) {
          const ackID = Math.random() * 1e9 | 0
          const ackEvent = `${name}-${ackID}`
          data.ack = {
            event: ackEvent
          }
          window.addEventListener('message', function once ({ data: msg }) {
            if (!msg || !msg.action === ackEvent) {
              return
            }
            window.removeEventListener('message', once)
            return resolve()
          })
        }
        data.isOnTwoSeven = this.isOnTwoSeven
        el.postMessage(data, '*')
        if (!waitForAck) {
          resolve()
        }
      })
    }
  }
}
</script>
