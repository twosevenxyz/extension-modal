// const mp4URL = `https://blog.twoseven.xyz/release:nameless-one/profile-edit.m4v`
// const hlsURL = `https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa_video_180_250000.m3u8`

const hlsData = {
  videoSelector: 'web',
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

function randomMediaEntry (type = 'mp4') {
  let ret = null
  switch (type) {
    case 'mp4':
      ret = mp4Data
      break
    case 'hls':
      ret = hlsData
      break
  }
  ret = JSON.parse(JSON.stringify(ret))
  ret.videoURL += `?q=${(Math.random() * 1e6 | 0)}`
  ret.videoData.hash = `${Math.random() * 1e12 | 0}`
  return ret
}

function randomMedia (numMedia = (3 + (Math.random() * 5) | 0)) {
  const ret = {}
  for (let idx = 0; idx < numMedia; idx++) {
    const type = Math.random() > 0.5 ? 'hls' : 'mp4'
    const media = randomMediaEntry(type)
    ret[idx] = media
  }
  return ret
}

function fakeInitialize () {
  const media = randomMedia(10)
  window.app.media = media
}

export {
  randomMediaEntry,
  randomMedia,
  fakeInitialize
}
