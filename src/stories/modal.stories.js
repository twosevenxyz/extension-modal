import 'bulma/css/bulma.min.css'
import '../../plyr/dist/plyr.css'

import '../js/fake-bg'
import { randomMediaEntry } from '../js/test'
import App from '../App'

export default {
  title: 'Modal'
}

export const Basic = () => ({
  components: { App },
  template: `
  <div class="container is-flex" style="flex-direction: column">
    <div class="section">
      <div class="columns">
        <div class="column">
          <button class="button is-link" @click="addRandomEntry()">Random MediaEntry</button>
          <button class="button is-link" @click="addRandomEntry('netflix')">Netflix Entry</button>
        </div>
      </div>
    </div>
    <div class="section is-flex" style="flex: 1">
      <App plyr-icon-url="https://cdn.plyr.io/3.6.3/plyr.svg" ref="app"/>
    </div>
  </div>
  `,
  methods: {
    addRandomEntry (type) {
      const mediaEntry = randomMediaEntry(type)
      const { videoData: { hash } } = mediaEntry
      this.$set(this.$refs.app.media, hash, mediaEntry)
    }
  }
})
