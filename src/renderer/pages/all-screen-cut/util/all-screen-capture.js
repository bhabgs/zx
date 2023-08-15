const { ipcRenderer } = require("electron");

const handleStream = (stream) =>
  new Promise((resolve, reject) => {
    try {
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
      video.onplaying = (e) => {
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

        resolve(canvas.toDataURL("image/png"));

        // Remove hidden video tag
        video.remove();
        try {
          stream.getTracks()[0].stop();
        } catch (e) {
          // nothing
          console.log(e);
        }
      };

      video.onerror = () => {};
      video.srcObject = stream;
      document.body.appendChild(video);
    } catch (error) {
      reject(error)
    }
  });

const getAllScreen = async (cb, error) => {
  const result = [];
  const displayUsedObj = {};
  document.body.style.cursor = "none";
  const displayList = require("@electron/remote").screen.getAllDisplays();
  const sourceList = await ipcRenderer.invoke("DESKTOP_CAPTURER_GET_SOURCES", {
    types: ["screen"],
    thumbnailSize: { width: 0, height: 0 },
  });
  console.log({ displayList, sourceList });
  document.body.style.cursor = "default";

  Promise.all(sourceList.map(
    async (source) =>
      new Promise(async (resolve, reject) => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              minHeight: 720,
              maxWidth: 8000,
              maxHeight: 8000
            },
          },
        });
        console.log({ stream });
        const base64URL = await handleStream(stream);
        if (source.display_id) {
          const display = displayList.find(({ id }) => `${id}` === source.display_id);
          resolve({ ...display.bounds, url: base64URL });
        } else {
          const img = document.createElement("img");
          img.style.visibility = "hidden";
          img.onload = () => {
            const width = img.width;
            const height = img.height;
            const display = displayList.find(({ bounds, scaleFactor }, index)=> {
                if(!displayUsedObj[index] && Math.abs(bounds.width * scaleFactor - width) <= 2  && Math.abs(bounds.height * scaleFactor - height) <= 2) {
                    displayUsedObj[index] = true
                    return true
                }
            })
            resolve({ ...display.bounds, url: base64URL });
              img.remove();
          };
          img.onerror=reject
          img.src = base64URL;
          document.body.appendChild(img);
        }
      })
  )).then(cb).catch(error)
};

export default (
  { types = ["screen"] } = {},
  callback,
  error = new Function()
) => {
  getAllScreen(callback, error);
};
