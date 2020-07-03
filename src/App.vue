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
    <div v-if="hasFilteredMedia">
      <ul class="is-paddingless">
        <li class="entry-container" v-show="!hiddenEntries[entry.videoData.hash]" v-for="entry in media" :key="entry.videoData.hash">
          <video-entry :profile="twosevenProfile" :width="width" :entry="entry" :location="location" :is-on-two-seven="isOnTwoSeven" @hide-entry="$set(hiddenEntries, entry.videoData.hash, true)"/>
        </li>
      </ul>
    </div>
    <div v-else class="has-text-centered">
      <h3 class="subtitle is-5">No supported media found!</h3>
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
      location: {},
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
    },
    hasFilteredMedia () {
      const { filteredMedia } = this
      return Object.keys(filteredMedia).length > 0
    }
  },
  watch: {
    media (v) {
    }
  },
  methods: {
    onResize () {
      this.width = window.outerWidth
    },
    async updateProfile () {
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
    }
  },
  beforeMount () {
    const browser = window.browser || window.chrome
    const name = 'tab-media:modal'
    const port = browser.runtime.connect({ name })
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
    window.addEventListener('message', async (evt) => {
      if (!evt.data || !evt.data.__evt_name) {
        return
      }
      let media
      let location
      switch (evt.data.__evt_name) {
        case 'modal-open': {
          await this.updateProfile()
          break
        }
        case 'media-update':
          media = evt.data.media || {}
          location = evt.data.location || {}
          this.location = location
          this.media = media
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
    await this.updateProfile()

    // Handle media updates
    port.onMessage.addListener(function (msg) {
      const { action, data = {} } = msg
      if (action !== 'media-update') {
        return
      }
      const { media = {}, location = {} } = data
      this.location = location
      this.media = media
    }.bind(this))

    port.postMessage({
      action: 'media-update',
      to: 'tab-media-bg',
      from: name
    })

    window.addEventListener('resize', this.onResize)
    this.onResize()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="scss">
@import '~typeface-roboto/index.css';

html {
  overflow-y: auto;
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
