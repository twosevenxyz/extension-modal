<template>
  <div id="app">
    <div v-show="Object.keys(hiddenEntries).length > 0">
      <div class="columns">
        <div class="column">
          <div class="is-pulled-right">
            <button class="button is-primary" @click="hiddenEntries = {}">Show hidden media</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="Object.keys(filteredMedia).length > 0">
      <ul class="is-paddingless">
        <li class="entry-container" v-show="!hiddenEntries[entry.videoData.hash]" v-for="entry in media" :key="entry.videoData.hash">
          <video-entry :profile="twosevenProfile" :width="width" :entry="entry" :is-on-two-seven="isOnTwoSeven" @hide-entry="$set(hiddenEntries, entry.videoData.hash, true)"/>
        </li>
      </ul>
    </div>
    <div v-else class="has-text-centered">
      <h3 class="is-3">No supported media found!</h3>
    </div>
  </div>
</template>

<script>
import URI from 'urijs'
import VideoEntry from './components/video-entry'
import EventMixin from '@/components/event-mixin'

export default {
  name: 'app',
  mixins: [EventMixin],
  components: {
    VideoEntry
  },
  data () {
    return {
      media: {},
      dummy: '',
      hiddenEntries: {},
      isOnTwoSeven: false,
      width: undefined,
      twosevenProfile: undefined
    }
  },
  computed: {
    filteredMedia () {
      const self = this
      const ret = {}
      Object.entries(this.media).forEach(([key, value]) => {
        if (!self.hiddenEntries[key]) {
          ret[key] = value
        }
      })
      return ret
    }
  },
  methods: {
    onResize () {
      this.width = window.outerWidth
    }
  },
  beforeMount () {
    const browser = window.browser || window.chrome
    const port = browser.runtime.connect({ name: name })
    this.port = port
    const uri = new URI(window.location.href)
    const query = uri.query(true)
    this.isOnTwoSeven = query.isOnTwoSeven === 'true'
  },
  async mounted () {
    window.app = this
    if (window.top === window) {
      // Testing
      this.$el.classList.add('container')
    }
    window.addEventListener('message', (evt) => {
      if (!evt.data || !evt.data.__evt_name) {
        return
      }
      switch (evt.data.__evt_name) {
        case 'media-update':
          window.app.media = evt.data.media
          break
        case 'modal-hide':
          window.app.$children.forEach((child) => {
            if (child.plyr) {
              child.plyr.pause()
            }
          })
          break
        default:
          throw new Error(`Unimplemented event '${evt.data.__evt_name}'`)
      }
    })

    const { port } = this
    const profilePromise = await new Promise(resolve => {
      port.onMessage.addListener(function once (msg) {
        if (msg.action !== 'twoseven-profile') {
          return
        }
        port.onMessage.removeListener(once)
        resolve(msg.profile)
      })
      port.postMessage({
        to: 'auth-bg',
        action: 'twoseven-profile'
      })
    })
    this.twosevenProfile = await profilePromise

    console.log(`Initialized extension modal`)
    window.addEventListener('resize', this.onResize)
    this.onResize()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="scss">
@import './style/bulma-imports.scss';
@import url('https://fonts.googleapis.com/css?family=Roboto');

html {
  // overflow-y: hidden !important;
}

body {
  display: flex !important;
  flex-direction: column !important;
}

#app {
  font-family: 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: 8px;
}

#twoseven-ext-tab-media-app {
  overflow-y: auto;
}

/* The Close Button */
.close {
  z-index: 2;
  position: absolute;
  color: #aaaaaa !important;
  font-size: 20px;
  font-weight: bold;
  right: 4px;
  top: 0;
  &:hover, &:focus {
    color: #000 !important;
    text-decoration: none;
    cursor: pointer;
  }
}

li {
  list-style-type: none;
  &.entry-container {
    margin-bottom: 12px;
  }
}
</style>
