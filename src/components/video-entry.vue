<script setup lang="ts">
import Hls, { HlsConfig } from 'hls.js'
// @ts-ignore
import Plyr from '@twosevenxyz/plyr'
// @ts-ignore
import URI from 'urijs'
// @ts-ignore
import Shaka from 'shaka-player'
import moment from 'moment'
import XhrHelpLoader, { ExtensionBGLoader } from '../utils/xhr-helper'
// @ts-ignore
import subsrt from '@gurupras/subsrt'
import Patreon from './v-patreon.vue'
// @ts-ignore
import KoFiButton from '@linusborg/vue-ko-fi-button'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { isTouch, isDesktop } from '../utils/bulma-vars'
import { Entry, Profile } from './types'
const oldVTT = subsrt.format.vtt
subsrt.format.vtt = {
  name: 'vtt',
  parse: oldVTT.parse,
  build (captions: any, options: any) {
    let content: string = oldVTT.build(captions, options)
    content = content.replace(/(.*) --> (.*)/g, (match, p1, p2) => {
      return `${p1.replace(/,/, '.')} --> ${p2.replace(/,/, '.')}`
    })
    return content
  },
  detect: oldVTT.detect
}

const props = defineProps<{
  entry: Entry,
  isLocked?: Entry['videoData']['isLocked']
  isOnTwoSeven: Boolean,
  width: string | number,
  profile: Profile,
  location: Partial<Location>,
  plyrIconUrl: string,
  getUrl: Function,
  onMessage: Function,
  sendMessage: Function
}>()

const plyrEl = ref<HTMLElement>(null as any)
let plyr: Plyr | undefined
const duration = ref<number>(props.entry.videoData.duration ?? 0)

const url = computed(() => {
  if (!props.entry.videoURL.startsWith('http')) {
    return props.entry.videoURL.substr(4)
  }
  return props.entry.videoURL
})

const mediaType = computed(() => {
  return props.entry.videoData.mediaType
})

const premiumContent = computed(() => {
  return !!props.entry.videoData.premiumContent
})

const durationStr = computed(() => {
  const durationStr = moment().startOf('day').seconds(duration.value).format('HH:mm:ss')
  return durationStr
})

const filename = computed(() => {
  try {
    const uri = new URI(url.value)
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
  const title = fullTitle.value
  if (isTouch(props.width) && title.length > 25) {
    return `${title.substring(0, 22)}...`
  }
  return title
})

const iconSize = computed(() => {
  if (isDesktop(props.width)) {
    return 22
  }
  return 28
})

const alertSize = computed(() => {
  if (isDesktop(props.width)) {
    return 21
  }
  return 16
})

const isEntryLocked = computed(() => {
  const { isLocked } = props
  if (!isLocked) {
    return false
  }
  const { reason, until } = isLocked
  if (!reason) {
    return false
  }
  switch (reason) {
    case 'early-access': {
      try {
        if (props.profile.privileges?.EARLY_ACCESS) {
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
      if (!isPatron) {
        return true
      }
      if (!userTier) {
        return true
      }
      return userTier < tier!
    }
    case 'patron-only': {
      return !props.profile.isPatron
    }
    case 'privilege': {
      const { value } = isLocked
      return !props.profile.privileges?.[value!]
    }
    default:
      throw new Error(`Unknown reason=${reason}`)
  }
})

const lockedReason = computed(() => {
  const { isLocked } = props
  const { reason } = isLocked!
  switch (reason) {
    case 'early-access':
      return 'Only available to TwoSeven supporters in early-access tier'
    case 'tier': {
      const { tier } = isLocked!
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
  if (isTouch(props.width)) {
    return 'small'
  }
  return 'med-and-up'
})

const language = computed(() => {
  return props.entry.videoData.language
})

const warnText = computed(() => {
  return props.entry.extensionProperties?.warnText
})

const hasPlaylistPrivilege = computed(() => {
  return hasPrivilege('FEATURE_PLAYLIST')
})

const hasPrivilege = (name: string) => {
  return props.profile?.privileges?.[name]
}

const triggerWatch = (onlyQueue = false) => {
  props.sendMessage('twoseven:triggerWatch', { mediaEntry: props.entry, onlyQueue })
  window.top?.postMessage({ action: 'twoseven:modal:hide' }, '*')
}

defineExpose({
  getPlyr: () => plyr
})

onMounted(async () => {
  const defaultControls = ['play', 'progress', 'volume', 'captions', 'settings']
  const { plyrProvider, tracks = [] } = props.entry.videoData
  plyr = new Plyr(plyrEl.value, {
    iconUrl: props.plyrIconUrl,
    // @ts-ignore
    urls: {
      youtube: {
        sdk: props.getUrl('/web_resources/youtube/iframe_api.js')
      },
      vimeo: {
        sdk: props.getUrl('/web_resources/vimeo/player.js')
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
      } as any
      : false
  })

  const { config } = plyr as any
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
      ;(plyr as any).media.dispatchEvent(evt)
    })
  })

  if (props.entry.videoSelector === 'web' && props.entry.videoData.mediaType === 'html5') {
    // Ask BG to add any headers that we may have
    const dnrRequestHeaders = props.entry.headers.map(header => ({
      header: header.name,
      operation: 'set',
      value: header.value
    }))
    const dnrResponseHeaders = props.entry.headers.map(header => ({
      header: 'access-control-allow-origin',
      operation: 'set',
      value: location.origin
    }))
    const ruleIDs = await props.sendMessage('twoseven:dynamic-dnr', [{
      action: {
        type: 'modifyHeaders',
        requestHeaders: dnrRequestHeaders,
        responseHeaders: dnrResponseHeaders
      },
      condition: {
        urlFilter: url.value,
        initiatorDomains: [location.host]
      }
    }])
    // TODO: Look into whether we should clear out the ruleIDs
  }
  plyr.source = {
    type: 'video',
    sources: [
      {
        src: url.value,
        type: props.entry.videoData.plyrContentType,
        provider: props.entry.videoData.plyrProvider
      }
    ],
    poster: props.entry.videoData.poster
  }

  plyr.on('loadedmetadata', () => {
    const videoDuration = plyr!.duration
    if (videoDuration !== 0) {
      duration.value = videoDuration
    }
  })

  if (props.entry.videoSelector === 'web') {
    const videoURL = props.entry.videoURL
    const realURL = url.value
    const headers = [...props.entry.headers]

    if (props.entry.videoData.mediaType === 'hls') {
      // This is a HLS video
      const config: Partial<HlsConfig> = {
        loader: function (config: any) {
          return new ExtensionBGLoader(config, headers, async (url, headers, responseType) => {
            const result = await props.sendMessage('network-request', {
                fetchArgs: [
                  url,
                  { headers }
                ],
                responseType,
                getRefererFromTabURL: false
              })
            // The Loader expects result.ok to be a boolean
            if (result.status < 400) {
              result.ok = true
            }
            return result
          })
        },
        enableWorker: false
      }
      const hls = new Hls(config)
      hls.loadSource(realURL)
      hls.attachMedia((plyr as any).media)
      ;(plyr as any).hls = hls

      // Handle changing captions
      plyr.on('languagechange', () => {
        // Caption support is still flaky. See: https://github.com/sampotts/plyr/issues/994
        setTimeout(() => {
          hls.subtitleTrack = plyr!.currentTrack
        }, 50)
      })
    } else if (props.entry.videoData.mediaType === 'mpd') {
      Shaka.polyfill.installAll()
      const shaka = new Shaka.Player((plyr as any).media)
      shaka.load(realURL)
    }
  }
})

onBeforeUnmount(() => {
  // window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="card is-vcentered" :class="widthClass"
      v-show="entry.entryType === 'playlist' ? hasPlaylistPrivilege : true">
    <span class="close" @click="$emit('hide-entry', entry)"><i-mdi-close title="Hide video"/></span>
    <div class="card-image is-flex">
      <video ref="plyrEl" />
    </div>
    <div class="column">
      <div class="card-content">
        <div class="is-flex is-flex-direction-column is-align-items-flex-end" style="width: 100%;">
          <div class="watch-btn-container">
            <span v-if="isEntryLocked" class="watch disabled is-flex is-align-items-center is-justify-content-flex-end">
              <i-mdi-lock :size="iconSize" class="icon" title="This video is locked"/>
              <span class="watch-text" v-html="lockedReason"></span>
            </span>
            <div v-else>
              <div class="watch-option" v-if="entry.entryType === 'media'">
                <button class="queue button is-outlined is-primary primary" @click="triggerWatch()">
                  <i-mdi-play-circle :size="iconSize" class="watch-icon" title="Watch Now"/>
                  <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Watch Now' }}</span>
                </button>
              </div>
              <div class="watch-option" v-show="hasPlaylistPrivilege">
                <button class="queue button is-outlined is-primary primary" @click="triggerWatch(true)">
                  <i-mdi-plus-box-multiple :size="iconSize" class="watch-icon" title="Add to Queue"/>
                  <span class="watch-text"> {{ isOnTwoSeven ? 'Watch Together' : 'Add to Queue' }}</span>
                </button>
              </div>
            </div>
          </div>
          <div class="video-info-container is-flex">
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
                  <i-mdi-alert v-if="premiumContent" :size="alertSize" :title="'Users may need a subscription to ' + location.host + ' to access this video'" class="has-text-warning"/>
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
                <span class="right video-duration"> Duration: {{ durationStr }} </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../style/main.scss';
@import '@twosevenxyz/plyr/dist/plyr.css';
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

    svg {
      margin-right: 8px;
    }
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
            padding-right: 0;
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
