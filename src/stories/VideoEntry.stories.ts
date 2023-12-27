import { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import '../style/main.scss'
import './fake-bg'
import { randomMediaEntry } from './test'
import VideoEntry from '../components/video-entry.vue'
import { Entry } from '@/components/types'

const meta: Meta<typeof VideoEntry> = {
  title: 'VideoEntry',
  component: VideoEntry,
  tags: ['autodocs'],
  argTypes: {
  }
}

export default meta
type Story = StoryObj<typeof VideoEntry>

const baseArgs: Story['args'] = {
  plyrIconUrl: 'node_modules/@twosevenxyz/plyr/dist/plyr.svg',
  getUrl: (partial: string) => `${(window as any).ROOT_URL || ''}${partial}`,
  onMessage: () => { },
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
  entry: randomMediaEntry(),
  isLocked: undefined,
  profile: {
    privileges: { FEATURE_PLAYLIST: 1 }
  }
}

export const Basic: Story = {
  args: {
    ...baseArgs
  },
  render: (args, { argTypes }) => ({
    components: { VideoEntry },
    setup () {
      return {
        args,
        app: undefined
      }
    },
    methods: {
    },
    template: `
      <VideoEntry ref="app" v-bind="args"/>
    `,
    beforeMount () {
    }
  })
}

export const EarlyAccessLocked: Story = {
  ...Basic,
  args: {
    ...baseArgs,
    entry: randomMediaEntry(),
    isLocked: {
      reason: 'early-access',
      until: Date.now() + 50000
    }
  }
}

export const PatronLocked: Story = {
  ...Basic,
  args: {
    ...baseArgs,
    entry: randomMediaEntry(),
    isLocked: {
      reason: 'patron-only'
    }
  }
}

export const TierLocked: Story = {
  ...Basic,
  args: {
    ...baseArgs,
    entry: randomMediaEntry(),
    isLocked: {
      reason: 'tier',
      tier: 3
    }
  }
}
