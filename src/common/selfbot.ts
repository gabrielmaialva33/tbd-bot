import { Client, StageChannel } from 'discord.js-selfbot-v13'
import {
  getInputMetadata,
  inputHasAudio,
  MediaUdp,
  Streamer,
  streamLivestreamVideo,
  Utils,
  playStream,
  prepareStream,
} from '@gabrielmaialva33/discord-video-stream'
import type MahinaBot from '#common/mahina_bot'
import PCancelable from 'p-cancelable'

export default class SelfBot extends Client {
  streamer: Streamer
  mahinaBot: MahinaBot

  constructor(mahinaBot1: MahinaBot) {
    super({
      allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    })
    this.streamer = new Streamer(this)
    this.mahinaBot = mahinaBot1
  }

  async start(token: string): Promise<void> {
    this.streamer.client.on('ready', async (client) => {
      this.mahinaBot.logger.info(`${client.user.username} is ready`)

      if (this.streamer.client.user) {
        this.streamer.client.user.setActivity({
          name: '🎥 𝘾𝙡𝙪𝙗𝙚 𝘽𝙖𝙠𝙠𝙤 🍷',
          type: 'WATCHING',
          url: 'https://discord.gg/u37PMWVbef',
          state: '🎥 𝘾𝙡𝙪𝙗𝙚 𝘽𝙖𝙠𝙠𝙤 🍷',
        })
      }
    })

    await this.streamer.client.login(token).catch(console.error)
  }

  async play(guildId: string, member: any, link: string, name: string = '') {
    await this.streamer.joinVoice(guildId, member.voice.channelId)

    const channel = member.voice.channel
    if (channel instanceof StageChannel)
      await this.streamer.client.user!.voice!.setSuppressed(false)

    // 4k (3840x2160) 30fps 1000kbps 2500kbps
    // 1080p (1920x1080) 30fps 1000kbps 2500kbps
    // 720p (1280x720) 30fps 1000kbps 2500kbps
    // 480p (854x480) 30fps 500kbps 1500kbps
    // 360p (640x360) 30fps 500kbps 1500kbps
    const streamUdpConn = await this.streamer.createStream({
      width: 1280,
      height: 720,
      fps: 30,
      bitrateKbps: 1000,
      maxBitrateKbps: 2500,
      hardwareAcceleratedDecoding: false,
      videoCodec: Utils.normalizeVideoCodec('H264'),
      h26xPreset: 'medium',
      minimizeLatency: true,
      rtcpSenderReportEnabled: true,
    })

    await this.video(link, streamUdpConn).finally(() => {
      this.streamer.stopStream()
    })

    return
  }

  async video(video: string, udpConn: MediaUdp) {
    let includeAudio = true

    try {
      const metadata = await getInputMetadata(video)
      console.log('metadata', metadata)
      includeAudio = inputHasAudio(metadata)
    } catch (e) {
      console.log(e)
      return
    }

    console.log('started playing video')
    udpConn.mediaConnection.setSpeaking(true)
    udpConn.mediaConnection.setVideoStatus(true)

    let command: PCancelable<string>
    command = streamLivestreamVideo(video, udpConn, includeAudio)
    try {
      const res = await command
      this.mahinaBot.logger.info('finished playing video ' + res)
    } catch (e) {
      console.log('error: ', e)
      if (command.isCanceled) {
        this.mahinaBot.logger.info('operation was canceled')
      } else {
        console.log(e)
      }
    } finally {
      udpConn.mediaConnection.setSpeaking(false)
      udpConn.mediaConnection.setVideoStatus(false)
    }
  }
}
