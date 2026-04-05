# Task Turtle — YouTube Video Slider

## Current State
The homepage (App.tsx) renders sections in this order:
- Navbar
- Hero
- HowItWorks
- LiveMap
- FeaturedTasks
- TaskTimeline demo
- OTP demo
- PaymentDemo
- Footer

No YouTube section exists yet.

## Requested Changes (Diff)

### Add
- `YouTubeSlider` component (`src/frontend/src/components/YouTubeSlider.tsx`)
  - Fetches latest 3-4 videos from YouTube channel @taskturtle via YouTube Data API v3
  - Channel ID resolved from handle: @taskturtle
  - Shows only videos (type=video), ordered by date descending
  - High-quality thumbnails (maxresdefault → hqdefault fallback)
  - Auto-slides every 3 seconds, infinite loop, pause on hover
  - Shows 3 videos at a time on desktop, 1-2 on mobile
  - Each card: thumbnail, title, click → opens YouTube in new tab
  - Heading: "Know more about TaskTurtle" with YouTube logo
  - Dark glassmorphic design matching app theme (#000 bg, #00E676 accents)
  - Auto-refreshes data every 5 minutes
- YouTubeSlider added to App.tsx homepage, placed directly after `<HowItWorks />`

### Modify
- `App.tsx`: import and insert `<YouTubeSlider />` after `<HowItWorks />`

### Remove
- Nothing removed

## Implementation Plan
1. Create `YouTubeSlider.tsx` with:
   - `useEffect` to fetch from `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCxxxxxxxxx&maxResults=6&order=date&type=video&key=API_KEY`
   - First resolve channel ID from handle using channels API
   - Auto-slide interval (3s), pause-on-hover via mouseenter/mouseleave
   - Infinite loop: duplicate video array for seamless wrap
   - CSS transition for smooth slide
   - YouTube logo SVG inline
   - Responsive: 3 cards desktop, 2 tablet, 1 mobile
2. Update `App.tsx` to import and use `<YouTubeSlider />`
