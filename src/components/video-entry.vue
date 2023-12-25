<script setup lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import Hls from 'hls.js'
// @ts-ignore
import Plyr from '@twosevenxyz/plyr/dist/plyr'
import URI from 'urijs'
// @ts-ignore
import Shaka from 'shaka-player/dist/shaka-player.compiled.js'
import moment from 'moment'
import XhrHelpLoader from '../js/xhr-helper'
import subsrt from '@gurupras/subsrt'

import Patreon from '../components/patreon.vue'
import KoFiButton from '../components/ko-fi.vue'
import { triggerEvent } from '../js/utils'
import bulmaMixin from '../js/bulma-mixin'

const oldVTT = subsrt.format.vtt
subsrt.format.vtt = {
  name: 'vtt',
  parse: oldVTT.parse,
  build (captions: any, options: any) {
    let content = oldVTT.build(captions, options)
    content = content.replace(/(.*) --> (.*)/g, (match: any, p1: any, p2: any) => {
      return `${p1.replace(/,/, '.')} --> ${p2.replace(/,/, '.')}`
    })
    return content
  },
  detect: oldVTT.detect
}

const props = defineProps<{
  entry: any,
  isOnTwoSeven: boolean,
  width: String | number,
  profile: any,
  location: typeof window.location,
  plyrIconUrl?: String
}>()

const plyrIconUrl = props.plyrIconUrl || '/node_modules/@twosevenxyz/plyr/dist/plyr.svg'

let plyr: any
const plyrEl = ref(null)
const duration = ref(0.0)
const { isTouch, isDesktop } = bulmaMixin(() => props.width as number)

const url = computed(() => {
  if (props.entry.videoURL.indexOf('http') > 0) {
    return props.entry.videoURL.substr(4)
  }
  return props.entry.videoURL
})

const premiumContent = computed(() => {
  return !!props.entry.videoData.premiumContent
})

const filename = computed(() => {
  try {
    const uri = new URI(url)
    const filename = uri.filename()
    return filename
  } catch (e) {
    return undefined
  }
})

const fullTitle = computed(() => {
  let title: string = ''
  const videoData = props.entry.videoData
  if (videoData && videoData.title) {
    title = videoData.title
  }
  if (!title) {
    if (filename.value) {
      title = filename.value.replace(/\.[^/.]+$/, '')
    } else {
      title = 'Untitled'
    }
  }
  return title
})

const title = computed(() => {
  if (isTouch && fullTitle.value.length > 25) {
    return `${fullTitle.value.substring(0, 22)}...`
  }
  return fullTitle.value
})

const iconSize = computed(() => {
  if (!isDesktop) {
    return 28
  }
  return 22
})

const alertSize = computed(() => {
  if (!isDesktop) {
    return 16
  }
  return 21
})

const isEntryLocked = computed(() => {
  const { isLocked = {} } = props.entry.videoData
  const { reason, until } = isLocked
  if (!reason) {
    return false
  }
  switch (reason) {
    case 'early-access': {
      try {
        if (props.profile.privileges.EARLY_ACCESS) {
          return false
        }
      } catch (e) {
      }
      if (until && Date.now() > until) {
        return false
      }
      return true
    }
    case 'tier': {
      const { tier } = isLocked
      const { isPatron, tier: userTier = null } = props.profile
      return !isPatron || userTier < tier
    }
    case 'patron-only':
      return !props.profile.isPatron
    case 'privilege': {
      const { value } = isLocked
      return !props.profile.privileges[value]
    }
    default:
      throw new Error(`Unknown reason=${reason}`)
  }
})

const lockedReason = computed(() => {
  const { isLocked = {} } = props.entry.videoData
  const { reason } = isLocked
  switch (reason) {
    case 'early-access':
      return 'Only available to TwoSeven supporters in early-access tier'
    case 'tier': {
      const { tier } = isLocked
      return `Only available to TwoSeven supporters in tier-${tier}`
    }
    case 'patron-only':
      return 'Only available to TwoSeven supporters'
    case 'privilege':
      return 'Only available to TwoSeven supporters of eligible tier.'
    default:
      return 'This video is locked for an unknown reason'
  }
})

const widthClass = computed(() => {
  return isTouch ? 'small' : 'med-and-up'
})

const language = computed(() => {
  return props.entry.videoData.language
})

const warnText = computed(() => {
  return props.entry.extensionProperties && props.entry.extensionProperties.warnText
})

const hasPlaylistPrivilege = computed(() => {
  return hasPrivilege('FEATURE_PLAYLIST')
})

const hasPrivilege = (name: string) => {
  if (!props.profile) {
    return false
  }
  const { privileges } = props.profile
  if (!privileges) {
    return false
  }
  return privileges[name]
}

const triggerWatch = (onlyQueue = false) => {
  triggerEvent('trigger-watch', { mediaEntry: props.entry, onlyQueue }, props.isOnTwoSeven)
  ;(window.top as typeof window).postMessage({
    action: 'twoseven:modal:hide'
  }, '*')
}

onMounted(async () => {

})

</script>

<template>
  <div class="card is-vcentered" :class="widthClass"
      v-show="entry.entryType === 'playlist' ? hasPlaylistPrivilege : true">
    <span class="close" @click="$emit('hide-entry', entry)"><md-close title="Hide video"/></span>
    <div class="card-image is-flex">
      <video ref="plyrEl" />
    </div>
    <div class="column">
      <div class="card-content">
        <div class="is-pulled-right" style="width: 100%;">
          <div class="watch-btn-container">
            <a v-if="isEntryLocked" class="watch disabled">
              <Lock :size="iconSize" title="This video is locked"/>
              <span class="watch-text" v-html="lockedReason"></span>
            </a>
            <div v-else>
              <div class="watch-option" v-if="entry.entryType === 'media'">
                <button class="queue button is-outlined is-primary primary" @click="triggerWatch()">
                  <play-circle :size="iconSize" class="watch-icon" title="Watch Now"/>
                  <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Watch Now' }}</span>
                </button>
              </div>
              <div class="watch-option" v-show="hasPlaylistPrivilege">
                <button class="queue button is-outlined is-primary primary" @click="triggerWatch(true)">
                  <PlusBoxMultiple :size="iconSize" class="watch-icon" title="Add to Queue"/>
                  <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Add to Queue' }}</span>
                </button>
              </div>
            </div>
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

<script lang="ts">
export default defineComponent({
  mounted () {
    const defaultControls = ['play', 'progress', 'volume', 'captions', 'settings']
    const { plyrProvider, tracks = [] }: { plyrProvider: string, tracks: any[] } = this.entry.videoData
    this.plyr = new Plyr(this.$refs.plyrEl.value, {
      iconUrl: this.plyrIconUrl,
      urls: {
        youtube: {
          sdk: this.getUrl('/web_resources/youtube/iframe_api.js')
        },
        vimeo: {
          sdk: this.getUrl('/web_resources/vimeo/player.js')
        }
      },
      controls: plyrProvider ? defaultControls : [],
      captions: plyrProvider
        ? {
            active: true,
            update: true,
            language: 'en',
            upload: {
              formats: ['srt', 'vtt', 'ssa', 'ass'],
              enabled: true,
              callback: true
            }
          }
        : false
    })

    const { config } = this.plyr
    const { captions: { upload = {} } } = config
    const { onProcessed } = upload
    this.plyr.once('ready', () => {
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
        this.plyr.media.dispatchEvent(evt)
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
      const duration = this.plyr.duration
      const durationStr = moment().startOf('day').seconds(duration).format('HH:mm:ss')
      duration.value = durationStr
    })

    if (this.entry.videoSelector === 'web') {
      const url = this.entry.videoURL
      const realUrl = url
      const { headers } = this.entry
      headers.push({
        name: 'x-from-tab-modal',
        value: '1'
      })
      if (url.startsWith('hls:')) {
      // This is a HLS video
        const config = {
          loader: XhrHelpLoader,
          async xhrSetup (xhr: any, realUrl: string) {
            await triggerEvent('xhr-help', {
              url: realUrl,
              headers: this.entry.headers
            }, this.isOnTwoSeven)
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
            hls.subtitleTrack = this.plyr.currentTrack
          }, 50)
        })
      } else if (url.startsWith('mpd:')) {
        Shaka.polyfill.installAll()
        const shaka = new Shaka.Player(this.plyr.media)
        shaka.load(realUrl)
      }
    }
  }
})
</script>
<style lang="scss">
@import '../style/bulma-imports.scss';
@import '@twosevenxyz/plyr/src/sass/plyr.scss';
@import 'bulma-tooltip';

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
.watch-option {
  margin: 0.4em 0;
}
.watch, .queue {
  color: #009688 !important;
  cursor: pointer;
  min-width: 210px;
  &:not(.disabled):hover {
    background-color: #009688 !important;
    color: #fff !important;
    transition: all 0.3s
  }
  .watch-text {
    vertical-align: bottom;
    font-size: 22px;
  }
  &.disabled {
    color: grey !important;
    cursor: default;
  }
  .watch-icon {
    height: 28px;
    width: 28px;
    margin-right: 0.4em;
    svg {
      width: inherit;
      height: inherit;
      vertical-align: middle;
    }
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

.plyr {
  width: 100%;
  video {
    height: auto;
  }
}
/* plyr scroll */
.plyr__menu__container [role="menu"] {
  max-height: 18em;
  overflow-y: auto;
}
</style>
