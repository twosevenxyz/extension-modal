<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
// @ts-ignore
import URI from 'urijs'
import VideoEntry from './video-entry.vue'
import { Entry, Profile } from './types'
import { computed, getCurrentInstance, onBeforeMount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  plyrIconUrl: string,
  getUrl: Function,
  onMessage: Function,
  sendMessage: Function,
  media: Record<string, Entry>,
  show: boolean
  profile: Profile
  location: Partial<Location>
}>()

const $emit = defineEmits<{
  (e: 'update-location'): void
  (e: 'update-media'): void
  (e: 'update-profile'): void
}>()

const hiddenEntries = ref<Record<string, boolean>>({})
const isOnTwoSeven = ref<boolean>(false)
const width = ref<string|number>(0)

const filteredMedia = computed(() => {
  const ret: Record<string, Entry> = {}
  Object.entries(props.media).forEach(([key, value]) => {
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
  const ret: Record<string, Entry> = {}
  Object.entries(props.media).forEach(([key, value]) => {
    if (!value.videoURL) {
      return
    }
    ret[key] = value
  })
  return ret
})

watch(() => props.show, async (v) => {
  if (v) {
    await Promise.all([
      updateProfile(),
      updateMedia()
    ])
  }
})

const onResize = () => {
  width.value = window.outerWidth
}

const updateProfile = async () => {
  $emit('update-profile')
}

const updateMedia = async () => {
  $emit('update-media')
}

const hideEntry = (hash: string) => {
  hiddenEntries.value[hash] = true
}

defineExpose({
  show: () => props.show,
  media: () => props.media,
  location: () => props.location,
  hiddenEntries,
  filteredMedia,
  hasFilteredMedia,
  validMedia,
  isOnTwoSeven,
  profile: () => props.profile,
  updateProfile,
  updateMedia
})

onBeforeMount(() => {
  const uri = new URI(window.location.href)
  const query = uri.query(true)
  isOnTwoSeven.value = query.isOnTwoSeven === 'true'

  window.removeEventListener('resize', onResize)
})

onMounted(async () => {
  const instance = getCurrentInstance()
  ;(window as any).app = instance

  await updateProfile()
  await updateMedia()

  window.addEventListener('resize', onResize)
})
</script>

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
              :is-locked="entry.videoData.isLocked"
              :location="location"
              :is-on-two-seven="isOnTwoSeven"
              @hide-entry="hideEntry(entry.videoData.hash)"/>
        </li>
      </ul>
    </div>
    <div v-else class="has-text-centered">
      <h3 class="subtitle is-5">No supported media found!</h3>
    </div>
  </div>
</template>

<style>
</style>

<style lang="scss">
@import '../style/main.scss';

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
