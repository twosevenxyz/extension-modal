import Emittery from 'emittery'

class FakeBG {
  emittery: Emittery
  onMessage: any

  constructor () {
    const self = this
    this.emittery = new Emittery()
    this.onMessage = {
      addListener (fn: () => void) {
        self.emittery.on('message', fn)
      },
      removeListener (fn: () => void) {
        self.emittery.off('message', fn)
      }
    }
  }

  postMessage (data: any) {
    const { action } = data
    switch (action) {
      case 'twoseven-profile':
        this.emittery.emit('message', {
          action,
          profile: {
            isPatron: true,
            earlyAccess: false
          }
        })
        break
    }
  }
}

const fakeBG = new FakeBG()

;(window as any).browser = {
  runtime: {
    connect () {
      return fakeBG
    }
  }
}
