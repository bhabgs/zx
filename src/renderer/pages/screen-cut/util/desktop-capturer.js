const { ipcRenderer } = require("electron");
const { getCurrentScreen } = require("./utils");

const curScreen = getCurrentScreen();

class getScreen {
  constructor(callback, error) {
    document.body.style.opacity = "0";
    let oldCursor = document.body.style.cursor;
    document.body.style.cursor = "none";
    this.handleStream = stream => {
      try {
        document.body.style.cursor = oldCursor;
        document.body.style.opacity = "1";
        // Create hidden video tag
        let video = document.createElement("video");
        video.autoplay = "autoplay";
        video.style.cssText =
          "position:absolute;top:-10000px;left:-10000px;width: 100%; height: 100%;";
        // video.style.cssText =
        // "position:absolute;top: 0px;left: 0px;width: 100%; height: 100%;";
        // Event connected to stream
        let loaded = false;
        video.onplaying = e => {
          video.pause();
          if (loaded) {
            return;
          }
          loaded = true;
          // Set video ORIGINAL height (screenshot)
          video.style.height = video.videoHeight + "px"; // videoHeight
          video.style.width = video.videoWidth + "px"; // videoWidth
          // Create canvas
          let canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          let ctx = canvas.getContext("2d");
          // Draw video on canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (callback) {
            // Save screenshot to png - base64
            let base64 = canvas.toDataURL("image/png");
            callback(base64);
          } else {
          }
          // Remove hidden video tag
          video.remove();
          try {
            stream.getTracks()[0].stop();
          } catch (e) {
            // nothing
          }
        };

        video.onerror = () => {};
        video.srcObject = stream;
        document.body.appendChild(video);
      } catch (error) {}
    };
    this.handleError = e => {
      error(e);
    };
    ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES",{
        types: ["window", "screen"],
        thumbnailSize: { width: 0, height: 0 }
      })
      .then(sources => {
        let selectSource;
        try {
          selectSource = sources.filter(
            source => source.display_id + "" === curScreen.id + ""
          )[0];
        } catch (e) {
          selectSource = sources[0];
        }
        return navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: selectSource.id + "",
                minWidth: 1280,
                minHeight: 720,
                maxWidth: 8000,
                maxHeight: 8000
              }
            }
          })
          .then(e => {
            this.handleStream(e);
          });
      })
      .catch(e => {
        this.handleError(e);
      });
  }
}

export const getScreenSources = (
  { types = ["screen"] } = {},
  callback,
  error = new Function()
) => {
  new getScreen(callback, error);
};
