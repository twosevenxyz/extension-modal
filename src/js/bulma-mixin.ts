// import BulmaVars from '../style/bulma-vars.scss'
import { computed } from 'vue'

const BulmaVars = {
  mobile: 0,
  tablet: 769,
  desktop: 1024,
  widescreen: 1216,
  fullhd: 1408
}

export default function (getWidth: () => number) {
  const getBulmaSize = (name: string) => {
    const v = (BulmaVars as any)[name]
    return Number(v)
  }
  const isWidthWithin = (min: number, max?: number) => {
    if (!max) {
      return getWidth() >= min
    }
    return getWidth() >= min && getWidth() < max
  }

  return {
    isMobile: computed(() => {
      const $tablet = getBulmaSize('tablet')
      return isWidthWithin(0, $tablet)
    }),
    isTablet: computed(() => {
      const $tablet = getBulmaSize('tablet')
      return isWidthWithin($tablet)
    }),
    isDesktop: computed(() => {
      const $desktop = getBulmaSize('desktop')
      return isWidthWithin($desktop)
    }),
    isWidescreen: computed(() => {
      const $widescreen = getBulmaSize('widescreen')
      return isWidthWithin($widescreen)
    }),
    isFullhd: computed(() => {
      const $fullhd = getBulmaSize('fullhd')
      return isWidthWithin($fullhd)
    }),
    isTabletOnly: computed(() => {
      const $tablet = getBulmaSize('tablet')
      const $desktop = getBulmaSize('desktop')
      return isWidthWithin($tablet, $desktop)
    }),
    isDesktopOnly: computed(() => {
      const $desktop = getBulmaSize('desktop')
      const $widescreen = getBulmaSize('widescreen')
      return isWidthWithin($desktop, $widescreen)
    }),
    isWidescreenOnly: computed(() => {
      const $widescreen = getBulmaSize('widescreen')
      const $fullhd = getBulmaSize('fullhd')
      return isWidthWithin($widescreen, $fullhd)
    }),
    isTouch: computed(() => {
      const $desktop = getBulmaSize('desktop')
      return isWidthWithin(0, $desktop)
    }),
    isUntilWidescreen: computed(() => {
      const $widescreen = getBulmaSize('widescreen')
      return isWidthWithin(0, $widescreen)
    }),
    isUntilFullhd: computed(() => {
      const $fullhd = getBulmaSize('fullhd')
      return isWidthWithin(0, $fullhd)
    })
  }
}
