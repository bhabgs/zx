export default class IMVoice {
  static element = {};
  constructor() {}

  static base64ToBlob(base64Data, type) {
    let mimeType;
    if (type) {
      mimeType = {
        type: type
      };
    }
    base64Data = base64Data.replace(/^(.*)[,]/, "");
    let sliceSize = 1024;
    let byteCharacters = atob(base64Data);
    let bytesLength = byteCharacters.length;
    let slicesCount = Math.ceil(bytesLength / sliceSize);
    let byteArrays = new Array(slicesCount);
    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      let begin = sliceIndex * sliceSize;
      let end = Math.min(begin + sliceSize, bytesLength);
      let bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, mimeType);
  }

  static preLoaded(base64Data) {
    return new Promise((resolve, reject) => {
      let str = base64Data.substr(-10);
      if (IMVoice.element[str]) {
        resolve();
        return;
      }
      let audio = new Audio();
      audio.src = "";

      let blob = IMVoice.base64ToBlob(base64Data, "audio/amr");
      let reader = new FileReader();
      reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let samples = AMR.decode(data);
        let pcm = PCMData.encode({
          sampleRate: 8000,
          channelCount: 1,
          bytesPerSample: 2,
          data: samples
        });
        audio.src = "data:audio/wav;base64," + btoa(pcm);
        IMVoice.element[str] = audio;
        resolve();
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  static play(data, config = { }) {
    let key = data.substr(-10);
    if (IMVoice.element[key]) {
      let audio = IMVoice.element[key];
      audio.play();
      return audio;
    }
  }
}
