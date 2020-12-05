<template>
  <div class="card is-vcentered" :class="widthClass">
    <span class="close" @click="$emit('hide-entry', entry)"><md-close title="Hide video"/></span>
    <div class="column is-one-quarter-tablet is-flex">
      <div class="card-image" style="align-self: center;">
        <video ref="plyrEl" />
      </div>
    </div>
    <div class="column">
      <div class="card-content">
        <div class="is-pulled-right" style="width: 100%;">
          <div class="watch-btn-container">
            <a v-if="isEntryLocked" class="watch disabled">
              <Lock :size="iconSize" title="This video is locked"/>
              <span class="watch-text" v-html="lockedReason"></span>
            </a>
            <a v-else class="watch" @click="triggerWatch">
              <play-circle :size="iconSize" title="Watch on TwoSeven"/>
              <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Watch on TwoSeven' }}</span>
            </a>
          </div>
          <div class="video-info-container is-flex is-pulled-right">
            <ul class="video-info-ul">
              <li v-if="isEntryLocked" class="video-info-li">
                <ul class="patron-links">
                  <li>
                    <Patreon patreon-id="17171070" class="patreon widget" style="display: inline-block; vertical-align: middle;"/>
                  </li>
                  <li>
                    <KoFiButton username="twosevenxyz" color="#4b798d" title="Buy us a coffee" class="kofi widget"/>
                  </li>
                </ul>
              </li>
              <li class="video-info-li">
                <span class="video-title tooltip is-tooltip-top is-tooltip-multiline" :data-tooltip="fullTitle">
                  <Alert v-if="premiumContent" :size="alertSize" :title="'Users may need a subscription to ' + location.host + ' to access this video'" class="has-text-warning"/>
                  {{ title }}
                </span>
              </li>
              <li v-if="language" class="video-info-li" style="align-items: initial; font-weight: bold;">
                <div class="columns is-paddingless is-marginless">
                  <div class="column is-paddingless is-marginless">
                    <span v-if="language.audio">
                      Audio: {{ language.audio.language }}
                      <span v-if="language.audio.country">
                        ({{ language.audio.country }})
                      </span>
                    </span>
                  </div>
                  <div class="column is-paddingless is-marginless">
                    <span v-if="language.hardsub">
                      Sub: {{ language.hardsub.language }}
                      <span v-if="language.hardsub.country">
                        ({{ language.hardsub.country }})
                      </span>
                    </span>
                  </div>
                </div>
              </li>
              <li class="video-info-li" v-if="warnText">
                <span class="has-text-warning">{{ warnText }}</span>
              </li>
              <li class="video-info-li">
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
import Shaka from 'shaka-player/dist/shaka-player.compiled.js'
import moment from 'moment'
import XhrHelpLoader from '@/js/xhr-helper'
import subsrt from '@gurupras/subsrt'

import MdClose from 'vue-material-design-icons/Close'
import PlayCircle from 'vue-material-design-icons/PlayCircle'
import Lock from 'vue-material-design-icons/Lock'
import Alert from 'vue-material-design-icons/Alert'

import Patreon from '@/components/patreon'
import KoFiButton from '@linusborg/vue-ko-fi-button'

import BulmaMixin from '@/components/bulma-mixin'
import EventMixin from '@/components/event-mixin'

const oldVTT = subsrt.format.vtt
subsrt.format.vtt = {
  name: 'vtt',
  parse: oldVTT.parse,
  build (captions, options) {
    let content = oldVTT.build(captions, options)
    content = content.replace(/(.*) --> (.*)/g, (match, p1, p2) => {
      return `${p1.replace(/,/, '.')} --> ${p2.replace(/,/, '.')}`
    })
    return content
  },
  detect: oldVTT.detect
}

export default {
  name: 'video-entry',
  mixins: [BulmaMixin, EventMixin],
  props: {
    entry: {
      type: Object
    },
    isOnTwoSeven: {
      type: Boolean
    },
    width: {
      type: [String, Number]
    },
    profile: {
      type: Object
    },
    location: {
      type: Object
    },
    plyrIconUrl: {
      type: String,
      default: '/node_modules/plyr/dist/plyr.svg'
    }
  },
  components: {
    Alert,
    MdClose,
    PlayCircle,
    Lock,
    Patreon,
    KoFiButton
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
    premiumContent () {
      return !!this.entry.videoData.premiumContent
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
        const { filename } = this
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
    alertSize () {
      if (!this.isDesktop) {
        return 16
      }
      return 21
    },
    isEntryLocked () {
      const { isLocked = {} } = this.entry.videoData
      const { reason, until } = isLocked
      if (!reason) {
        return false
      }
      switch (reason) {
        case 'early-access': {
          try {
            if (this.profile.privileges.EARLY_ACCESS) {
              return false
            }
          } catch (e) {
          }
          // TODO: Remove this after extension v2.1.5.5
          if (this.profile.hasEarlyAccess) {
            return false
          }
          if (until && Date.now() > until) {
            return false
          }
          return true
        }
        case 'tier': {
          const { tier } = isLocked
          const { profile: { isPatron, tier: userTier = null } } = this
          return !isPatron || userTier < tier
        }
        case 'patron-only':
          return !this.profile.isPatron
        case 'privilege': {
          const { value } = isLocked
          return !this.profile.privileges[value]
        }
        default:
          throw new Error(`Unknown reason=${reason}`)
      }
    },
    lockedReason () {
      const { isLocked = {} } = this.entry.videoData
      const { reason } = isLocked
      switch (reason) {
        case 'early-access':
          return 'Only available to TwoSeven patrons in early-access tier'
        case 'tier': {
          const { tier } = isLocked
          return `Only available to TwoSeven patrons in tier-${tier}`
        }
        case 'patron-only':
          return 'Only available to TwoSeven patrons'
        case 'privilege':
          return 'Only available to TwoSeven patrons of eligible tier.'
        default:
          return 'This video is locked for an unknown reason'
      }
    },
    widthClass () {
      return this.isTouch ? 'small' : 'med-and-up'
    },
    language () {
      return this.entry.videoData.language
    },
    warnText () {
      return this.entry.extensionProperties && this.entry.extensionProperties.warnText
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
    triggerWatch () {
      const self = this
      this.triggerEvent('trigger-watch', self.entry)
      this.triggerEvent('modal-hide', {}, window.parent)
    }

  },
  mounted () {
    const self = this
    const defaultControls = ['play', 'progress', 'volume', 'captions', 'settings']
    const { plyrProvider, tracks = [] } = this.entry.videoData
    this.plyr = new Plyr(this.$refs.plyrEl, {
      iconUrl: this.plyrIconUrl,
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
        language: 'en',
        upload: {
          formats: ['srt', 'vtt', 'ssa', 'ass'],
          enabled: true,
          callback: true
        }
      }
    })

    const { plyr } = this
    const { config } = plyr
    const { captions: { upload = {} } } = config
    const { onProcessed } = upload
    plyr.once('ready', () => {
      tracks.forEach(async track => {
        if (track.format && track.format !== 'vtt') {
          const r = await fetch(track.src)
          const text = await r.text()
          const format = subsrt.detect(text)
          let vtt = text
          if (format !== 'vtt') {
            const captions = subsrt.parse(text)
            vtt = subsrt.build(captions, { format: 'vtt' })
          }
          track.src = URL.createObjectURL(new Blob([vtt], {
            type: 'text/vtt'
          }))
        }
        const evt = new CustomEvent(onProcessed, { detail: track })
        plyr.media.dispatchEvent(evt)
      })
    })

    this.plyr.source = {
      type: 'video',
      sources: [
        {
          src: this.url,
          type: this.entry.videoData.plyrContentType,
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
        value: '1'
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
      } else if (url.startsWith('mpd:')) {
        Shaka.polyfill.installAll()
        const shaka = new Shaka.Player(this.plyr.media)
        shaka.load(realUrl)
      }
    }
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="scss">
@import '~@/../plyr/src/sass/plyr.scss';
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
      flex-direction: column;
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
  background-color: inherit;
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
  &:hover {
    color: #039be5;
    transition: 0.3s
  }
  .watch-text {
    vertical-align: bottom;
    font-size: 28px;
  }
  &.disabled {
    color: grey;
    cursor: default;
  }
}

.patron-btn {
  text-decoration: none;
}

.card-content {
  text-align: right;
  .has-text-warning {
    color: #a21200!important
  }
  .video-info-container {
    .video-info-ul {
      padding-left: 3em;
      .video-info-li {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: flex-end;
      }
      ul.patron-links {
        display: inline-flex;
        justify-content: flex-end;
        margin-bottom: 4px;
        flex-wrap: wrap;
        li {
          padding: 0 4px;
          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
    .video-title {
      .material-design-icon {
        vertical-align: text-bottom;
      }
      font-size: 16px;
      text-overflow: ellipsis;
      overflow: hidden;
      flex: 1;
      @include until($desktop) {
        max-width: 200px;
      }
      max-width: 400px;
      white-space: nowrap;
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

.patreon.widget:hover {
  filter: brightness(120%);
}

.kofi.widget {
  vertical-align: top;
  font-size: 8px !important;
  min-width: 0 !important;
  .kofi-button {
    font-size: 12px !important;
    height: 36px !important;
    padding: 0px 8px !important;
    min-width: 0 !important;
  }
}

.widget {
  // height: 20px;
  line-height: 20px;
  vertical-align: text-bottom;
  margin-left: 2px;
  margin-right: 2px;
}

/* plyr scroll */
.plyr__menu__container [role="menu"] {
  max-height: 18em;
  overflow-y: auto;
}
</style>
