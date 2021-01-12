<<<<<<< Updated upstream
import 'multer'
import * as sharp from 'sharp'
import { readFile, remove } from 'fs-extra'
=======
import { remove, rename } from 'fs-extra'
import { extname } from 'path'
import { convertWebPToJPG, processGIF } from './ffmpeg-utils'
>>>>>>> Stashed changes
import { logger } from './logger'

async function processImage (
  path: string,
  destination: string,
  newSize: { width: number, height: number },
  keepOriginal = false
) {
  const extension = extname(path)

  if (path === destination) {
<<<<<<< Updated upstream
    throw new Error('Sharp needs an input path different that the output path.')
=======
    throw new Error('Jimp/FFmpeg needs an input path different that the output path.')
>>>>>>> Stashed changes
  }

  logger.debug('Processing image %s to %s.', path, destination)

<<<<<<< Updated upstream
  // Avoid sharp cache
  const buf = await readFile(path)
  const sharpInstance = sharp(buf)
=======
  // Use FFmpeg to process GIF
  if (extension === '.gif') {
    await processGIF(path, destination, newSize)
  } else {
    await jimpProcessor(path, destination, newSize)
  }

  if (keepOriginal !== true) await remove(path)
}

// ---------------------------------------------------------------------------

export {
  processImage
}

// ---------------------------------------------------------------------------

async function jimpProcessor (path: string, destination: string, newSize: { width: number, height: number }) {
  let jimpInstance: any

  try {
    jimpInstance = await Jimp.read(path)
  } catch (err) {
    logger.debug('Cannot read %s with jimp. Try to convert the image using ffmpeg first.', path, { err })

    const newName = path + '.jpg'
    await convertWebPToJPG(path, newName)
    await rename(newName, path)

    jimpInstance = await Jimp.read(path)
  }
>>>>>>> Stashed changes

  await remove(destination)

  await sharpInstance
    .resize(newSize.width, newSize.height)
<<<<<<< Updated upstream
    .toFile(destination)

  if (keepOriginal !== true) await remove(path)
}

// ---------------------------------------------------------------------------

export {
  processImage
=======
    .quality(80)
    .writeAsync(destination)
>>>>>>> Stashed changes
}
