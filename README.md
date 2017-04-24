# Send to XBMC/Kodi Firefox plugin
https://addons.mozilla.org/en-US/firefox/addon/send-to-xbmc/

## About
Sends YouTube videos, video and music links to Kodi for playback. Adds a right click menu for links pointing to YouTube and audio/video files for direct playback on your TV with Kodi.
Works with XBMC Eden and later, as well as with Kodi Helix.

Version 2.0 of the plugin was made open source and placed on GitHub.
This version rewrote the whole server management part of the plugin, adding support for multiple servers and adding the basics for a lot of extra features
## Setup XBMC/Kodi
Under System -> Services: 
 * Web Server -> Make sure it's enabled and a password is set 
 * Remote control -> Enable: "Allow remote control by programs on other systems" 
Go back to Home to save changes

Plug your Kodi info into the FireFox addon... IP can be obtained from System -> System info (Appears when System is highlighted )

## Features

- Supported formats 

  * YouTube
  * mp4
  * mkv
  * mov
  * mp3
  * avi
  * flv
  * wmv
  * asf
  * flac
  * mka
  * m4a
  * aac
  * ogg
  * pls
  * jpg
  * png
  * gif
  * jpeg
  * tiff

- Supports multiple servers

## Planned features
* ~~Multiserver support~~ `[Added v2.0]`
* Queue videos in playlist
* Manage playlist
* Maybe: Plugin button in Toolbar
* Maybe: Some simple remote control functions

## Building

Make sure you have the Add-on SDK [installed](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation) and that you have `cfx` activated.

Run the plugin with `cfx run`
Create an xpi that you can drag and drop to your browser with `cfx xpi`

To add the "Options" button in the Add-ons Manager, replace the `install.rdf` file in the xpi file with the `install.rdf` file from the repository using an archive manager such as 7-zip.

## License

MIT
