<template>
  <div class="card is-vcentered">
    <span class="close" @click="$emit('hide-entry', entry)"><md-close title="Hide video"/></span>
    <div class="column is-two-thirds">
      <div class="card-image">
        <video ref="plyrEl" />
      </div>
    </div>
    <div class="column">
      <div class="card-content">
        <div class="is-pulled-right">
          <div class="watch-btn-container">
            <a class="watch" @click="triggerWatch">
              <div>
                <play-circle :size="37" title="Watch on TwoSeven"/>
                <span v-if="isOnTwoSeven"> Watch Together </span>
                <span v-else> Watch on TwoSeven </span>
              </div>
            </a>
          </div>
          <div class="video-info-container">
            <ul>
              <li>
                <span class="video-title"> {{ title }} </span>
              </li>
              <li>
                <span class="right video-duration"> Duration: {{ duration }} </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Hls from 'hls.js'
import Plyr from 'plyr'
import URI from 'urijs'
import moment from 'moment'
import is from 'is_js'
import XhrHelpLoader from '@/js/xhr-helper'

import MdClose from 'vue-material-design-icons/Close'
import PlayCircle from 'vue-material-design-icons/PlayCircle'

export default {
  name: 'video-entry',
  props: ['entry', 'isOnTwoSeven'],
  components: {
    MdClose,
    PlayCircle
  },
  computed: {
    twosevenExtHeader () {
      return this.getHeaderValue('x-twoseven-ext', this.entry.headers)
    },
    url () {
      if (this.entry.videoURL.indexOf('http') > 0) {
        return this.entry.videoURL.substr(4)
      }
      return this.entry.videoURL
    },
    filename () {
      try {
        const uri = new URI(this.url)
        const filename = uri.filename()
        return filename
      } catch (e) {
        return undefined
      }
    },
    title () {
      const videoData = this.entry.videoData
      if (videoData && videoData.title) {
        return videoData.title
      }
      const filename = this.filename
      if (filename) {
        return this.filename.replace(/\.[^/.]+$/, '')
      } else {
        return 'Untitled'
      }
    }
  },
  data: function () {
    return {
      plyr: undefined,
      duration: 0.0
    }
  },

  methods: {
    getHeaderEntry (name, headers) {
      var ret
      headers.forEach((entry) => {
        if (!!entry.name && entry.name.toLowerCase() === name.toLowerCase()) {
          ret = entry
        }
      })
      return ret
    },
    getHeaderValue (name, headers) {
      const entry = this.getHeaderEntry(name, headers)
      if (entry) {
        return entry.value
      }
    },
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
    },
    triggerWatch () {
      const self = this
      this.triggerEvent('trigger-watch', self.entry)
      this.triggerEvent('modal-hide', {}, window.parent)
    }
  },
  mounted () {
    const self = this
    const defaultControls = ['progress', 'play', 'volume', 'captions', 'settings']
    const { plyrProvider } = this.entry.videoData
    this.plyr = new Plyr(this.$refs.plyrEl, {
      urls: {
        youtube: {
          sdk: '/web_resources/js/youtube/iframe_api.js'
        },
        vimeo: {
          sdk: '/web_resources/js/vimeo/player.js'
        }
      },
      controls: plyrProvider ? defaultControls : [],
      captions: {
        active: true,
        update: true,
        language: 'en'
      }
    })

    this.plyr.source = {
      type: 'video',
      sources: [
        {
          src: this.url,
          type: 'video/mp4',
          provider: this.entry.videoData.plyrProvider
        }
      ],
      poster: this.entry.videoData.poster
    }

    this.plyr.on('loadedmetadata', () => {
      const duration = self.plyr.duration
      const durationStr = moment().startOf('day').seconds(duration).format('HH:mm:ss')
      self.duration = durationStr
    })

    if (this.entry.videoSelector === 'web') {
      const url = this.entry.videoURL
      const realUrl = this.url
      if (url.startsWith('hls:')) {
        // This is a HLS video
        const config = {
          loader: XhrHelpLoader,
          async xhrSetup (xhr, realUrl) {
            await self.triggerEvent('xhr-help', {
              url: realUrl,
              headers: self.entry.headers
            }, undefined, true)
          },
          enableWorker: !is.firefox()
        }
        const hls = new Hls(config)
        hls.loadSource(realUrl)
        hls.attachMedia(this.plyr.media)

        // Handle changing captions
        this.plyr.on('languagechange', () => {
          // Caption support is still flaky. See: https://github.com/sampotts/plyr/issues/994
          setTimeout(() => {
            hls.subtitleTrack = self.plyr.currentTrack
          }, 50)
        })
      }
    }
  }
}
</script>

<style lang="scss">
.card {
  display: flex;
  flex-direction: row;
  .column {
    padding: 0;
  }
}
.card-image {
  margin: 1%;
  width: 240px !important;
}
.watch {
  color: #009688;
  cursor: pointer;
  &:hover {
    color: #039be5;
    transition: 0.3s
  }
  span {
    vertical-align: bottom;
    font-size: 28px;
  }
}

.card-content {
  text-align: right;
  .watch-btn-container {
  }

  .watch-icon {
    font-size: 40px !important;
  }

  .video-info-container {
    ul {
      padding-left: 3em;
    }
    .video-title {
      font-size: 16px;
    }
    .video-duration {
      font-size: 14px;
    }
  }

  @-moz-document url-prefix() {
    .watch-icon {
      font-size: 38px !important;
    }
    .watch span {
      font-size: 20px;
    }
    .video-info-container {
      .video-title {
        font-size: 16px;
      }
      .video-duration {
        font-size: 12px;
      }
    }
  }
}

/* plyr scroll */
.plyr__menu__container [role="menu"] {
  max-height: 18em;
  overflow-y: auto;
}
</style>
