import { NextResponse } from 'next/server'

const MIN_DURATION_SECONDS = 120 // 2 minutes — excludes all Shorts (max 60s)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'video' // 'video' | 'playlist'

  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })

  try {
    if (type === 'playlist') {
      return await searchPlaylists(query, apiKey)
    }
    return await searchVideos(query, apiKey)
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

async function searchVideos(query, apiKey) {
  // videoDuration=medium filters to 4–20 min; we also fetch long separately
  // and filter programmatically to catch everything ≥ 2 min
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=20&videoDuration=any&key=${apiKey}`
  )
  const searchData = await searchRes.json()
  if (!searchData.items?.length) return NextResponse.json({ items: [], type: 'video' })

  // Fetch full details including duration for all results
  const ids = searchData.items.map(i => i.id.videoId).join(',')
  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
  )
  const detailsData = await detailsRes.json()

  // Build a map: videoId → { durationLabel, durationSeconds }
  const detailMap = {}
  detailsData.items?.forEach(v => {
    const secs = isoToSeconds(v.contentDetails.duration)
    detailMap[v.id] = { durationLabel: formatDuration(secs), durationSeconds: secs }
  })

  const items = searchData.items
    .map(item => {
      const detail = detailMap[item.id.videoId] || {}
      return {
        id: item.id.videoId,
        type: 'video',
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: detail.durationLabel || '',
        durationSeconds: detail.durationSeconds || 0,
      }
    })
    // ✂️ Filter out Shorts — anything under 2 minutes
    .filter(item => item.durationSeconds >= MIN_DURATION_SECONDS)
    // Trim back to 12 results after filtering
    .slice(0, 12)

  return NextResponse.json({ items, type: 'video' })
}

async function searchPlaylists(query, apiKey) {
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&q=${encodeURIComponent(query)}&maxResults=12&key=${apiKey}`
  )
  const searchData = await searchRes.json()
  if (!searchData.items?.length) return NextResponse.json({ items: [], type: 'playlist' })

  // Fetch playlist item counts
  const playlistIds = searchData.items.map(i => i.id.playlistId).join(',')
  const detailsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds}&key=${apiKey}`
  )
  const detailsData = await detailsRes.json()

  const countMap = {}
  detailsData.items?.forEach(p => { countMap[p.id] = p.contentDetails.itemCount })

  const items = searchData.items.map(item => ({
    id: item.id.playlistId,
    type: 'playlist',
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    videoCount: countMap[item.id.playlistId] || null,
    duration: countMap[item.id.playlistId] ? `${countMap[item.id.playlistId]} videos` : '',
  }))

  return NextResponse.json({ items, type: 'playlist' })
}

// ISO 8601 duration (PT1H2M3S) → total seconds
function isoToSeconds(iso) {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0)
}

// Total seconds → "1:02:03" or "12:34"
function formatDuration(secs) {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
