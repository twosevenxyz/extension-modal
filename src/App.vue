<template>
  <div id="app">
    <div v-show="Object.keys(hiddenEntries).length > 0">
      <div class="row">
        <div class="col s12">
          <a class="waves waves-effect teal btn right" @click="hiddenEntries = {}">Show hidden media</a>
        </div>
      </div>
    </div>
    <div v-if="Object.keys(filteredMedia).length > 0">
      <ul>
        <li class="entry-container" v-show="!hiddenEntries[entry.videoData.hash]" v-for="(entry, key) in media" :key="entry.videoData.hash">
          <video-entry :entry="entry" :is-on-two-seven="isOnTwoSeven" @hide-entry="$set(hiddenEntries, entry.videoData.hash, true)"/>
        </li>
      </ul>
    </div>
    <div v-else class="center">
      <h3>No supported media found!</h3>
    </div>
  </div>
</template>

<script>
import URI from 'urijs'
import VideoEntry from './components/video-entry'
export default {
  name: 'app',
  components: {
    VideoEntry
  },
  data () {
    return {
      media: {},
      dummy: '',
      hiddenEntries: {},
      isOnTwoSeven: false
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
  },
  beforeMount () {
    const uri = new URI(window.location.href)
    const query = uri.query(true)
    this.isOnTwoSeven = query.isOnTwoSeven === 'true'
  },
  mounted () {
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
    console.log(`Initialized extension modal`)
  }
}
</script>

<style lang="scss">
@import 'plyr/src/sass/plyr.scss';
@import 'bulma/sass/utilities/_all.sass';
@import 'bulma/sass/grid/columns.sass';
@import 'bulma/sass/components/card.sass';
@import 'bulma/sass/elements/container.sass';
@import url('https://fonts.googleapis.com/css?family=Roboto');

#app {
  font-family: 'Roboto', sans-serif;
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
