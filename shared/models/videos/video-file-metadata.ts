<<<<<<< Updated upstream
import { FfprobeData } from "fluent-ffmpeg"
import { DeepOmit } from "@server/models/utils"

export type VideoFileMetadataModel = DeepOmit<FfprobeData, 'filename'>

export class VideoFileMetadata implements VideoFileMetadataModel {
=======
export class VideoFileMetadata {
>>>>>>> Stashed changes
  streams: { [x: string]: any, [x: number]: any }[]
  format: { [x: string]: any, [x: number]: any }
  chapters: any[]

  constructor (hash: { chapters: any[], format: any, streams: any[] }) {
    this.chapters = hash.chapters
    this.format = hash.format
    this.streams = hash.streams

    delete this.format.filename
  }
}
