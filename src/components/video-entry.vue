<template>
  <div class="card is-vcentered" :class="widthClass">
    <span class="close" @click="$emit('hide-entry', entry)"><md-close title="Hide video"/></span>
    <div class="column is-one-quarter-tablet">
      <div class="card-image">
        <video ref="plyrEl" />
      </div>
    </div>
    <div class="column">
      <div class="card-content">
        <div class="is-pulled-right">
          <div class="watch-btn-container">
            <a class="watch" @click="triggerWatch">
              <play-circle :size="iconSize" title="Watch on TwoSeven"/>
              <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Watch on TwoSeven' }}</span>
            </a>
          </div>
          <div class="video-info-container">
            <ul>
              <li>
                <span class="video-title tooltip is-tooltip-top is-tooltip-multiline" :data-tooltip="fullTitle"> {{ title }} </span>
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
import XhrHelpLoader from '@/js/xhr-helper'

import MdClose from 'vue-material-design-icons/Close'
import PlayCircle from 'vue-material-design-icons/PlayCircle'

import BulmaMixin from '@/components/bulma-mixin'

export default {
  name: 'video-entry',
  mixins: [BulmaMixin],
  props: ['entry', 'isOnTwoSeven', 'width'],
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
    fullTitle () {
      let title
      const videoData = this.entry.videoData
      if (videoData && videoData.title) {
        title = videoData.title
      }
      if (!title) {
        let { filename } = this
        if (filename) {
          title = filename.replace(/\.[^/.]+$/, '')
        } else {
          title = 'Untitled'
        }
      }
      return title
    },
    title () {
      const { fullTitle: title } = this
      if (this.isTouch && title.length > 25) {
        return `${title.substring(0, 22)}...`
      }
      return title
    },
    iconSize () {
      if (!this.isDesktop) {
        return 28
      }
      return 36
    },
    widthClass () {
      return this.isTouch ? 'small' : 'med-and-up'
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
    const defaultControls = ['play', 'progress', 'volume', 'captions', 'settings']
    const { plyrProvider } = this.entry.videoData
    this.plyr = new Plyr(this.$refs.plyrEl, {
      iconUrl: '/node_modules/plyr/dist/plyr.svg',
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
      const { entry: { headers } } = self
      headers.push({
        name: 'x-from-tab-modal',
        value: 1
      })
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
          enableWorker: false
        }
        const hls = new Hls(config)
        hls.loadSource(realUrl)
        hls.attachMedia(this.plyr.media)
        this.plyr.hls = hls

        // Handle changing captions
        this.plyr.on('languagechange', () => {
          // Caption support is still flaky. See: https://github.com/sampotts/plyr/issues/994
          setTimeout(() => {
            hls.subtitleTrack = self.plyr.currentTrack
          }, 50)
        })
      }
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="scss">
@import '~plyr/src/sass/plyr.scss';
@import '~bulma-tooltip';

.small {
  .card-image {
    width: 200px !important;
  }
  .watch {
    line-height: 28px;
  }
  .watch-text {
    font-size: 22px;
  }
  .card-content {
    .video-info-container {
      .video-title {
        font-size: 12px;
      }
      .video-duration {
        font-size: 12px;
      }
    }
  }
  @-moz-document url-prefix() {
    .watch .watch-text {
      font-size: 20px !important;
      line-height: 28px !important;
    }
    .video-info-container {
      .video-title {
        font-size: 16px;
      }
      .video-duration {
        font-size: 14px;
      }
    }
  }
}

.card {
  display: flex;
  flex-direction: row;
  position: relative;
  .column {
    padding: 0;
  }
}
.card-image {
  margin: 1%;
  min-width: 200px !important;
  width: 240px !important;
}
.watch {
  color: #009688;
  cursor: pointer;
  line-height: 36px;
  &:hover {
    color: #039be5;
    transition: 0.3s
  }
  .watch-text {
    vertical-align: bottom;
    font-size: 28px;
  }
}

.card-content {
  text-align: right;
  .video-info-container {
    ul {
      padding-left: 3em;
    }
    .video-title {
      font-size: 16px;
      text-overflow: ellipsis;
    }
    .video-duration {
      font-size: 14px;
    }
  }

  @-moz-document url-prefix() {
    .watch .watch-text {
      font-size: 26px;
      line-height: 36px;
    }
    .video-info-container {
      .video-title {
        font-size: 18px;
        &.tooltip.is-tooltip-multiline::before {
          min-width: 12rem;
        }
      }
      .video-duration {
        font-size: 16px;
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
