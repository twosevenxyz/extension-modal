<template>
  <div id="app">
    <div class="fade-hide" :class="{show: Object.keys(hiddenEntries).length > 0}">
      <div class="columns">
        <div class="column">
          <div class="is-pulled-right">
            <button class="button is-primary" style="margin-bottom: 0.4em;" @click="hiddenEntries = {}">Show hidden media</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="profile && hasFilteredMedia">
      <ul class="is-paddingless">
        <li class="entry-container" v-show="!hiddenEntries[entry.videoData.hash]" v-for="entry in validMedia" :key="entry.videoData.hash">
          <video-entry
              :get-url="getUrl"
              :on-message="onMessage"
              :send-message="sendMessage"
              :plyr-icon-url="plyrIconUrl"
              :profile="profile"
              :width="width"
              :entry="entry"
              :location="location"
              :is-on-two-seven="isOnTwoSeven"
              @hide-entry="$set(hiddenEntries, entry.videoData.hash, true)"/>
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
  props: {
    plyrIconUrl: {
      type: String
    },
    getUrl: {
      type: Function
    },
    onMessage: {
      type: Function
    },
    sendMessage: {
      type: Function
    }
  },
  components: {
    VideoEntry
  },
  data () {
    return {
      show: false,
      media: {},
      location: {},
      dummy: '',
      hiddenEntries: {},
      isOnTwoSeven: false,
      width: undefined,
      profile: undefined
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
    },
    validMedia () {
      const { media } = this
      const ret = {}
      for (const [key, entry] of Object.entries(media)) {
        if (!entry.videoURL) {
          continue
        }
        ret[key] = entry
      }
      return ret
    }
  },
  watch: {
    media (v) {
    },
    async show (v) {
      if (v) {
        await Promise.all([
          this.updateProfile(),
          this.updateMedia()
        ])
      }
    }
  },
  methods: {
    onResize () {
      this.width = window.outerWidth
    },
    async updateProfile () {
      const result = await this.sendMessage('credentials', {})
      if (result) {
        const { profile } = result
        this.profile = profile
      }
    },
    async updateMedia () {
      const { url: urlStr, tabMedia } = await this.sendMessage('tab-info', {})
      const url = new URL(urlStr)
      this.location = {
        href: urlStr,
        host: url.host,
        hostname: url.hostname,
        origin: url.origin,
        search: url.search
      }
      this.media = tabMedia || {}
    }
  },
  beforeMount () {
    const uri = new URI(window.location.href)
    const query = uri.query(true)
    this.isOnTwoSeven = query.isOnTwoSeven === 'true'
  },
  async mounted () {
    window.app = this

    await this.updateProfile()

    // Handle media updates
    await this.updateMedia()

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

.fade-hide {
  transition: opacity 0.3s;
  opacity: 0;
  visibility: hidden;
  &.show {
    opacity: 1;
    visibility: visible;
  }
}
</style>
