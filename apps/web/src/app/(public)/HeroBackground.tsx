'use client'

const DEFAULT_VIDEO_ID = 'tET8AYkIxgw'

function extractYouTubeId(url: string): string {
  if (!url) return DEFAULT_VIDEO_ID
  // Handle full URLs: youtube.com/watch?v=ID or youtu.be/ID
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : (url.length === 11 ? url : DEFAULT_VIDEO_ID)
}

interface Props {
  videoUrl?: string | null
  videoType?: string | null
}

export function HeroBackground({ videoUrl, videoType }: Props) {
  const isUpload = videoType === 'upload'

  let embedSrc = ''
  if (isUpload && videoUrl) {
    // Direct video file
  } else {
    const videoId = extractYouTubeId(videoUrl ?? '')
    embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&playsinline=1`
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          width: 'max(100vw, calc(100vh * 16 / 9))',
          height: 'max(100vh, calc(100vw * 9 / 16))',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {isUpload && videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            src={embedSrc}
            allow="autoplay; fullscreen"
            className="w-full h-full"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        )}
      </div>
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(15,28,58,0.82) 0%, rgba(27,43,91,0.78) 50%, rgba(30,53,104,0.80) 100%)' }}
      />
    </div>
  )
}
