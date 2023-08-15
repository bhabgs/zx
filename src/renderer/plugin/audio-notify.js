/**
 * 声音提醒
 */

export default class AudioNotify {
  /**
   * 初始化声音组件
   */
  static init() {
    const audio = document.createElement("audio");
    audio.hidden = true;
    audio.src = require("@/assets/media/msg.mp3");
    audio.id = "audio-notify";
    document.body.appendChild(audio);

    return audio;
  }

  /**
   * 播放声音
   */
  static play() {
    let audio = document.getElementById("audio-notify");
    if (audio) {
      audio.play();
    } else {
      audio = AudioNotify.init();
      audio.play();
    }
  }
}
