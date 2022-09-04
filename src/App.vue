<!-- <script setup lang="ts">
import type { onMessage as OnMessage, sendMessage as SendMessage } from 'webext-bridge'
import { ref, computed, onBeforeMount, onMounted, onBeforeUnmount } from 'vue'
import VideoEntry from './components/video-entry.vue'
import URI from 'urijs'

const props = defineProps<{
  plyrIconUrl?: String,
  onMessage: typeof OnMessage,
  sendMessage: typeof SendMessage
}>()

const location = ref<Record<string, any>>({})
const isOnTwoSeven = ref<boolean>(false)
const width = ref<number>(undefined as unknown as number)
const twosevenProfile = ref<any>(undefined)

const onResize = () => {
  width.value = window.outerWidth
}

const updateProfile = async () => {
  const result = await props.sendMessage('credentials', {})
  if (result) {
    await onProfile(result)
  }
}

const onProfile = async (data: any) => {
  const { profile }: { profile: any } = data
  twosevenProfile.value = profile
}

onBeforeMount(() => {
  const uri = new URI(window.location.href)
  const query = uri.query(true)
  isOnTwoSeven.value = query.isOnTwoSeven === 'true'
})

onMounted(() => {
  props.onMessage('login-success', async msg => {
    await onProfile(msg.data)
  })
  updateProfile()

  // Handle media updates

  props.sendMessage('tab-info', {}).then((data: any) => {
    const { url: urlStr, tabMedia }: { url: string, tabMedia: any } = data
    const url = new URL(urlStr)
    location.value = {
      href: urlStr,
      host: url.host,
      origin: url.origin,
      hostname: url.hostname,
      protocol: url.protocol,
      pathname: url.pathname,
      search: url.search
    }
    media.value = tabMedia
  })

  window.addEventListener('resize', onResize)
  onResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

const setupMedia = () => {
  const media = ref<MediaRecord>({})
  const hiddenEntries = ref<Record<string, boolean>>({})

  const filteredMedia = computed(() => {
    const ret: MediaRecord = {}

    Object.entries(media.value).forEach(([key, value]) => {
      if (!hiddenEntries.value[key]) {
        ret[key] = value
      }
    })
    return ret
  })

  const hasFilteredMedia = computed(() => {
    return Object.keys(filteredMedia.value).length > 0
  })

  const validMedia = computed(() => {
    const ret: MediaRecord = {}
    for (const [key, entry] of Object.entries(media.value)) {
      if (!entry.videoURL) {
        continue
      }
      ret[key] = entry
    }
    return ret
  })
  return {
    media,
    hiddenEntries,
    filteredMedia,
    hasFilteredMedia,
    validMedia
  }
}

const {
  media,
  hiddenEntries,
  hasFilteredMedia,
  validMedia
} = setupMedia()

</script> -->

<template>
  <div class="twoseven-ext-tab-media-modal-content">
    <div id="app">
      <div class="fade-hide" :class="{show: Object.keys(hiddenEntries).length > 0}">
        <div class="columns">
          <div class="column">
            <div class="is-pulled-right">
              <button class="button is-primary" style="margin-bottom: 0.4em;" @click="hiddenEntries = {}">Show hidden
                media</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="hasFilteredMedia">
        <ul class="is-paddingless">
          <li class="entry-container" v-show="!hiddenEntries[entry.videoData.hash]" v-for="entry in validMedia"
            :key="entry.videoData.hash">
            <video-entry :plyr-icon-url="plyrIconUrl" :profile="twosevenProfile" :width="width" :entry="entry"
              :location="(location as any)" :is-on-two-seven="isOnTwoSeven"
              @hide-entry="hiddenEntries[entry.videoData.hash] = true" />
          </li>
        </ul>
      </div>
      <div v-else class="has-text-centered">
        <h3 class="subtitle is-5">No supported media found!</h3>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import VideoEntry from './components/video-entry.vue'
import URI from 'urijs'
import type { onMessage, sendMessage } from 'webext-bridge'
import * as test from './js/test'

interface MediaEntry {
  videoURL: string
  videoData: {
    hash: string
  }
}
type MediaRecord = Record<string, MediaEntry>

export default defineComponent({
  props: {
    plyrIconUrl: String,
    onMessage: {
      type: Function as PropType<typeof onMessage>,
      required: true
    },
    sendMessage: {
      type: Function as PropType<typeof sendMessage>,
      required: true
    }
  },
  components: {
    VideoEntry
  },
  data () {
    return {
      show: false,
      location: {} as Record<string, any>,
      isOnTwoSeven: false,
      width: 0,
      twosevenProfile: undefined as any,
      media: {} as MediaRecord,
      hiddenEntries: {} as Record<string, boolean>
    }
  },
  computed: {
    filteredMedia () {
      const ret: MediaRecord = {}

      Object.entries(this.media).forEach(([key, value]) => {
        if (!this.hiddenEntries[key]) {
          ret[key] = value
        }
      })
      return ret
    },
    hasFilteredMedia () {
      return Object.keys(this.filteredMedia).length > 0
    },
    validMedia () {
      const ret: MediaRecord = {}
      for (const [key, entry] of Object.entries(this.media)) {
        if (!entry.videoURL) {
          continue
        }
        ret[key] = entry
      }
      return ret
    }
  },
  methods: {
    onResize () {
      this.width = window.outerWidth
    },
    async updateProfile () {
      const result = await this.sendMessage('credentials', {})
      if (result) {
        this.onProfile(result)
      }
    },
    async onProfile (data: any) {
      const { profile }: { profile: any } = data
      this.twosevenProfile = profile
    }
  },
  async beforeMount () {
    const uri = new URI(window.location.href)
    const query = uri.query(true)
    this.isOnTwoSeven = query.isOnTwoSeven === 'true'
  },
  async mounted () {
    window.addEventListener('message', async (evt) => {
      const { data } = evt
      try {
        const { action } = data
        switch (action) {
          case 'twoseven:modal:show': {
            this.show = true
            break
          }
          case 'twoseven:modal:hide': {
            this.show = false
            break
          }
        }
      } catch (e) {
      }
      // TODO: Implement this
    })

    this.onMessage('login-success', async msg => {
      await this.onProfile(msg.data)
    })
    this.updateProfile()

    // Handle media updates

    const { url: urlStr, tabMedia }: { url: string, tabMedia: any } = await this.sendMessage('tab-info', {})
    const url = new URL(urlStr)
    this.location = {
      href: urlStr,
      host: url.host,
      origin: url.origin,
      hostname: url.hostname,
      protocol: url.protocol,
      pathname: url.pathname,
      search: url.search
    }
    this.media = tabMedia
    window.addEventListener('resize', this.onResize)
    this.onResize()
    ;(window as any).app = this
    ;(window as any).test = test
    test.fakeInitialize()
  },
  async beforeUnmount () {
    window.removeEventListener('resize', this.onResize)
  }

})
</script>

<style lang="scss">
@import 'typeface-roboto/index.css';
@import './style/bulma-imports.scss';

.twoseven-ext-tab-media-modal {
  position: fixed;
  /* Stay in place */
  z-index: 2147483638;
  /* Sit on top */
  left: 0;
  top: 0;
  width: 100%;
  /* Full width */
  height: 100%;
  /* Full height */
  overflow: auto;
  /* Enable scroll if needed */
  background-color: rgb(0, 0, 0);
  /* Fallback color */
  background-color: rgba(0, 0, 0, 0.5);
  /* Black w/ opacity */
}

/* Modal Content */
.twoseven-ext-tab-media-modal-content {
  background-color: #fefefe;
  margin: auto;
  margin-top: 100px;
  padding: 20px;
  border: 1px solid #888;
  /* width: 50%; */
  height: 75%;
  max-width: 60%;
  min-width: 560px;
}

/* The Close Button */
.twoseven-ext-tab-media-modal-content .close {
  position: relative;
  color: #aaaaaa !important;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.twoseven-ext-tab-media-modal-content .close:hover,
.twoseven-ext-tab-media-modal-content .close:focus {
  color: #000 !important;
  text-decoration: none;
  cursor: pointer;
}

#twoseven-ext-tab-media-iframe {
  position: relative;
  height: 95%;
  width: 100%;
  border: none;
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
