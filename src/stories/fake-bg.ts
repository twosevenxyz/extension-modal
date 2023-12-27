import Emittery from 'emittery'

class FakeBG {
  emittery: Emittery
  onMessage: { addListener: any, removeListener: any }

  constructor () {
    const self = this
    this.emittery = new Emittery()
    this.onMessage = {
      addListener (fn: any) {
        self.emittery.on('message', fn)
      },
      removeListener (fn: any) {
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
