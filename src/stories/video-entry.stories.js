/* eslint-disable import/no-extraneous-dependencies */
import { action } from '@storybook/addon-actions'
import { linkTo } from '@storybook/addon-links'

import VideoEntry from '../components/video-entry.vue'

export default {
  title: 'VideoEntry'
}

export const Basic = () => ({
  components: { VideoEntry },
  template: '<VideoEntry/>'
})
