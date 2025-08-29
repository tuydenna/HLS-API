How to use?
Ex: AutoRegisterControllers(config);

config = {route,"../controllers",false}

router is express router
controllerPath where your controller is located
logging show all routes in terminal

# **`1.Using HLS and MPEG-DASH `**
HLS: Apple has historically pushed for its own proprietary protocol, HLS (HTTP Live Streaming), which is the native and most widely supported format on its devices.
MPEG-DASH: MPEG-DASH is an international standard for adaptive streaming. Unlike HLS, which was originally a proprietary Apple protocol, DASH is vendor-agnostic and a global standard.
 DASH uses an XML-based Media Presentation Description (MPD) file

# **`1.Checking MIME DECS`**

```<bash>
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,level,codec_tag_string -of default=noprint_wrappers=1:nokey=1 your_video.mp4
```
```<bash>
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,profile,level,codec_tag_string -of default=noprint_wrappers=1:nokey=1 your_video.mp4
```

# **`2.Convert  Traditional MP4 to a large single fMP4 segment :: Option A`**
- FFmpeg
```<bash>
  ffmpeg -i input.mp4 -movflags frag_keyframe+empty_moov+default_base_moof -map 0 -f mp4 output_fmp4.mp4
```

# **`2.Convert  Traditional MP4 to saperate fMP4 segments :: Option B`**
- FFmpeg
```<bash>
  ffmpeg -i input.mp4 \
       -map 0 \
       -c:v libx264 -preset veryfast -crf 23 \
       -c:a aac -b:a 128k \
       -f hls \
       -hls_time 6 \
       -hls_playlist_type vod \
       -hls_segment_type fmp4 \
       -hls_flags independent_segments \
       -hls_segment_filename "media_segments/seg_%d.m4s" \
       media_segments/playlist.m3u8
```
