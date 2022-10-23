// const mp4URL = `https://blog.twoseven.xyz/release:nameless-one/profile-edit.m4v`
// const hlsURL = `https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_180_250000.m3u8`

const hlsData = {
  videoSelector: 'web',
  entryType: 'media',
  referer: 'https://bitmovin.com/demos/stream-test?format=hls&manifest=https%3A%2F%2Fbitmovin-a.akamaihd.net%2Fcontent%2FMI201109210084_1%2Fm3u8s%2Ff08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
  mediaType: 'hls',
  videoURL: 'hls:https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_180_250000.m3u8',
  videoData: {
    module: 'generic',
    referer: 'https://bitmovin.com/demos/stream-test?format=hls&manifest=https%3A%2F%2Fbitmovin-a.akamaihd.net%2Fcontent%2FMI201109210084_1%2Fm3u8s%2Ff08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    plyrProvider: 'html5',
    mediaType: 'hls',
    hash: '046cd4f67d19e13ce0fa6ac8df4c39e5',
    numSegments: 0,
    clientID: '471c284a-efc2-4be9-b2ad-f31c8590666a'
  },
  origin: 'https://bitmovin.com',
  from: 'common-media-finder',
  strategies: [
    'url',
    'iframe'
  ],
  tabId: 2152,
  headers: []
}

const mp4Data = {
  videoSelector: 'web',
  entryType: 'media',
  referer: 'https://www.w3.org/2010/05/video/mediaevents.html',
  mediaType: 'html5',
  videoURL: 'url:https://media.w3.org/2010/05/sintel/trailer.mp4',
  videoData: {
    module: 'generic',
    referer: 'https://www.w3.org/2010/05/video/mediaevents.html',
    plyrProvider: 'html5',
    mediaType: 'html5',
    hash: 'a603de70da54523e5f5b9ae6f81c3aa4',
    clientID: '471c284a-efc2-4be9-b2ad-f31c8590666a'
  },
  origin: 'https://www.w3.org',
  headers: []
}

const netflixData = {
  from: 'netflix/cs/media-finder.js',
  videoSelector: 'netflix',
  videoURL: 'https://www.netflix.com/watch/80018294',
  entryType: 'media',
  videoData: {
    title: "Marvel's Daredevil - Rabbit in a Snowstorm",
    poster: 'https://occ-0-621-616.1.nflxso.net/dnm/api/v6/X194eJsgWBDE2aQbaNdmCXGUP-Y/AAAABdz0zEgQRNl2d7crMB7ddDsa7_TLjA6qAO2KQVdCMGtikxT106Jh2gTX4FAhnJ2uXZlD0hTBYeBW-ekNee82rcp6T8Fl8JteUOB0mNwsxVnA4oUB0tjeWotteHKrnQ.jpg?r=80f',
    seasonIndex: 0,
    episodeIndex: 2,
    showTitle: "Marvel's Daredevil",
    episodeTitle: 'Rabbit in a Snowstorm',
    topURL: 'https://www.netflix.com/watch/80018294',
    hash: 'd0f679ba7e08e594af18d2d1cf8952ea',
    clientID: 'a2601ad6-2da3-49bf-911c-f6455e92b130',
    tracks: []
  },
  referer: 'https://www.netflix.com/watch/80018294',
  origin: 'https://www.netflix.com/watch/80018294',
  strategies: null,
  headers: [
    {
      name: 'x-twoseven-ext-tab-media',
      value: '1'
    }
  ],
  listeners: {},
  hash: 'd0f679ba7e08e594af18d2d1cf8952ea',
  mediaHandlerHash: '0:10882df52e45c3a0ad7561a1cac06011',
  tabId: 1255
}

export function randomMediaEntry (type = 'mp4') {
  let ret = null
  switch (type) {
    case 'mp4':
      ret = mp4Data
      break
    case 'hls':
      ret = hlsData
      break
    case 'netflix':
      ret = netflixData
      break
  }
  ret = JSON.parse(JSON.stringify(ret))
  ret.videoURL += `?q=${(Math.random() * 1e6 | 0)}`
  ret.videoData.hash = `${Math.random() * 1e12 | 0}`
  if (Math.random() > 0.5) {
    let reason
    let until
    if (Math.random() > 0.5) {
      reason = 'early-access'
      until = Math.random() > 0.5 ? Date.now() + 50000 : Date.now() - 50000
    } else {
      reason = 'patron-only'
    }
    ret.videoData.isLocked = {
      reason,
      until
    }
  }
  return ret
}

export function randomMedia (numMedia = (3 + (Math.random() * 5) | 0)) {
  const ret = {}
  for (let idx = 0; idx < numMedia; idx++) {
    const type = Math.random() > 0.5 ? 'hls' : 'mp4'
    const media = randomMediaEntry(type)
    ret[idx] = media
  }
  return ret
}

export function fakeInitialize () {
  const media = randomMedia(10)
  window.app.media = media
}
