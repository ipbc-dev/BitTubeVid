import { CONFIG } from '../../../initializers/config'
import { PEERTUBE_VERSION, WEBSERVER } from '../../../initializers/constants'
import { AccountModel } from '../../../models/account/account'
import { UserModel } from '../../../models/account/user'
import { updateLocalActorAvatarFile } from '../../../lib/avatar'
import * as downloader from 'image-downloader'
import * as express from 'express'
import * as JWT from 'jsonwebtoken'
import fetch from 'node-fetch'

const firebaseRouter = express.Router()

firebaseRouter.post('/firebase/avatar/sync', async (req, res) => {
  try {
    const { token, photoURL } = req.body
    if (typeof token !== 'string' || typeof photoURL !== 'string' || !token.length || !photoURL.length) throw new Error('Invalid input.')
    const decoded = JWT.decode(token) as { [key: string]: any, email: string }
    const userResult = await fetch('https://us-central1-bittube-airtime-extension.cloudfunctions.net/verifyPassword', {
      headers: {
        'User-Agent': `PeerTube/${PEERTUBE_VERSION} (+${WEBSERVER.URL})`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: decoded.email, password: token }),
      method: 'POST'
    }).then(response => response.json())
    if (!userResult.success) throw new Error('Invalid authentication.')
    const user = await UserModel.loadByEmail(decoded.email)
    if (!user) throw new Error('User not found.')
    const userAccount = await AccountModel.load(user.Account.id)
    if (!userAccount) throw new Error('User account not found.')
    const { filename } = await downloader.image({ url: photoURL, dest: CONFIG.STORAGE.TMP_DIR })
    const multerFile = { filename: filename.split('/').pop(), path: filename } as any
    await updateLocalActorAvatarFile(userAccount, multerFile)
    return res.send({ success: true, mssg: 'Avatar changed.' })
  } catch (error) {
    return res.send({ success: false, error: error.message })
  }
})

export {
  firebaseRouter
}
