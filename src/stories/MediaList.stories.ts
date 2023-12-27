import { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import '../style/main.scss'
import './fake-bg'
import { randomMediaEntry } from './test'
import MediaList from '../components/MediaList.vue'
import { Entry } from '@/components/types'

const meta: Meta<typeof MediaList> = {
  title: 'MediaList',
  component: MediaList,
  tags: ['autodocs'],
  argTypes: {
  }
}

export default meta
type Story = StoryObj<typeof MediaList>

const media = ref<Record<string, Entry>>({})

export const Basic: Story = {
  args: {
    plyrIconUrl: 'node_modules/@twosevenxyz/plyr/dist/plyr.svg',
    getUrl: (partial: string) => `${(window as any).ROOT_URL || ''}${partial}`,
    onMessage: () => {},
    sendMessage: async (action: string, data: any) => {
      if (action === 'tab-info') {
        return {
          url: location.href,
          tabMedia: {}
        }
      } else if (action === 'credentials') {
        return {
          profile: {}
        }
      }
    },
    media: media.value
  },
  render: (args, { argTypes }) => ({
    components: { MediaList },
    setup () {
      return {
        args,
        app: undefined
      }
    },
    methods: {
      addRandomEntry (type: string) {
        const mediaEntry = randomMediaEntry(type)
        const { videoData: { hash } } = mediaEntry
        media.value[hash] = mediaEntry
      }
    },
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
          <MediaList ref="app" v-bind="args"/>
        </div>
      </div>
    `,
    mounted () {
      this.addRandomEntry()
    }
  })
}
