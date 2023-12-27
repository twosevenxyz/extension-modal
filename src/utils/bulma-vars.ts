import * as BulmaVars from '../style/bulma-vars.scss'

export function isMobile () {
  const $tablet = __getBulmaSize('tablet')
  return __isWidthWithin(0, $tablet)
}
export function isTablet (width: string | number) {
  const $tablet = __getBulmaSize('tablet')
  return __isWidthWithin(width, $tablet)
}
export function isDesktop (width: string | number) {
  const $desktop = __getBulmaSize('desktop')
  return __isWidthWithin(width, $desktop)
}
export function isWidescreen (width: string | number) {
  const $widescreen = __getBulmaSize('widescreen')
  return __isWidthWithin(width, $widescreen)
}
export function isFullhd (width: string | number) {
  const $fullhd = __getBulmaSize('fullhd')
  return __isWidthWithin(width, $fullhd)
}
export function isTabletOnly (width: string | number) {
  const $tablet = __getBulmaSize('tablet')
  const $desktop = __getBulmaSize('desktop')
  return __isWidthWithin(width, $tablet, $desktop)
}
export function isDesktopOnly (width: string | number) {
  const $desktop = __getBulmaSize('desktop')
  const $widescreen = __getBulmaSize('widescreen')
  return __isWidthWithin(width, $desktop, $widescreen)
}
export function isWidescreenOnly (width: string | number) {
  const $widescreen = __getBulmaSize('widescreen')
  const $fullhd = __getBulmaSize('fullhd')
  return __isWidthWithin(width, $widescreen, $fullhd)
}
export function isTouch (width: string | number) {
  const $desktop = __getBulmaSize('desktop')
  return __isWidthWithin(width, 0, $desktop)
}
export function isUntilWidescreen (width: string | number) {
  const $widescreen = __getBulmaSize('widescreen')
  return __isWidthWithin(width, 0, $widescreen)
}
export function isUntilFullhd (width: string | number) {
  const $fullhd = __getBulmaSize('fullhd')
  return __isWidthWithin(width, 0, $fullhd)
}
export function __getBulmaSize (name: string) {
  const v = (BulmaVars as Record<string, any>)[name]
  return Number(v)
}
export function __isWidthWithin (width: string | number, min: number, max?: number) {
  if (typeof width === 'string') {
    width = Number(width)
  }
  if (!max) {
    return width >= min
  }
  return width >= min && width < max
}
