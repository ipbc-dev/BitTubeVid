// import { Redis } from '../../redis'
import { logger } from '../../../helpers/logger'
import { Hooks } from '../../../lib/plugins/hooks'
// import { VideoModel } from '../../../models/video/video'
// import { VideoViewModel } from '../../../models/video/video-view'
// import { isTestInstance } from '../../../helpers/core-utils'
// import { federateVideoIfNeeded } from '../../activitypub/videos'
import { userPremiumStoragePaymentModel } from '@server/models/user-premium-storage-payments'
import { premiumStorageSlowPayer } from '@server/models/premium-storage-slow-payer'
import { UserModel } from '@server/models/account/user'
import { VideoModel } from '@server/models/video/video'
import { CONFIG } from '@server/initializers/config'
import { WEBSERVER } from '@server/initializers/constants'
// import { DestroyOptions } from 'sequelize'

// const fetch = require('node-fetch')
// const Headers = fetch.Headers

const parallel = async (num, arr, func) => {
  const thread = (item) => {
    if (item === undefined) return
    return func(item) // eslint-disable-line consistent-return
        .catch((err) => {
          logger.error('Error in parallel, should be handled in func!', err)
          return true
        })
        .then(() => { // eslint-disable-line consistent-return
          if (arr.length) return thread(arr.shift())
        })
  }
  const promises = [] // eslint-disable-next-line no-plusplus
  for (let i = 0; i < num; ++i) promises.push(thread(arr.shift()))
  await Promise.all(promises)
}

async function processPremiumStorageChecker () {
  try {
    await checkOutdatedPayments()
    await cleanVideosFromSlowPayers()
  } catch (err) {
    logger.error(err)
  }
}

async function checkOutdatedPayments () {
  const instanceDefaultQuota = CONFIG.USER.VIDEO_QUOTA
  const instanceDefaultDailyQuota = CONFIG.USER.VIDEO_QUOTA_DAILY
  const activePayments = await userPremiumStoragePaymentModel.getAllActivePayments()
  await parallel(1, activePayments, async (payment) => {
    // Check if the payment is outdated
    if (payment.dateTo < Date.now()) {
      logger.info('ICEICE this payment is outdated')
      await premiumStorageSlowPayer.addSlowPayer(payment.userId)
      await UserModel.update(
        {
          videoQuota: instanceDefaultQuota,
          videoQuotaDaily: instanceDefaultDailyQuota
        },
        {
          where: {
            id: payment.userId
          }
        }
      )
      await userPremiumStoragePaymentModel.deactivateUserPayment(payment.id)
      logger.info('ICEICE slowPlayer successfuly added')
    }
  })
}

async function cleanVideosFromSlowPayers () {
  const slowPayersList = await premiumStorageSlowPayer.getAllSlowPayers()
  // const apiUrl = WEBSERVER.URL + '/api/v1/'
  await parallel(1, slowPayersList, async (slowPayer) => {
    const userInfo = await UserModel.loadById(slowPayer.userId)
    const actorId = userInfo.Account.id
    const userVideos = await VideoModel.listUserVideosForApi(actorId, 0, 15, "-createdAt")
    const userVideoQuota = userInfo.videoQuota
    // logger.info('ICEICE cleanVideosFromSlowPayers checking userINfo: ', userInfo)
    // logger.info('ICEICE webserver is ', apiUrl)
    // logger.info('ICEICE actorId is:', actorId)
    logger.info('ICEICE userVideos are', userVideos.data)
    // TO-DO:
    //  1 - Get x number of videos from user (Do I need to get)
    let userUsedVideoQuota
    for (const video of userVideos.data) {
      userUsedVideoQuota = await getUserUsedQuota(slowPayer.userId)
      if (userUsedVideoQuota > userVideoQuota) {
        logger.info('TIme to remove video with title: ', video)

        // Delete video
        const res = await video.destroy()
        Hooks.runAction('action:api.video.deleted', { video })

        // const query: DestroyOptions = {
        //   where: {
        //     uuid: video.uuid
        //   }
        // }
        // const res = await VideoModel.load(query)
        logger.info('ICEICE video removed: ', res)
      }
    }
    userUsedVideoQuota = await getUserUsedQuota(slowPayer.userId)
    if (userUsedVideoQuota <= userVideoQuota) {
      await premiumStorageSlowPayer.deleteSlowPayer(slowPayer.id)
    }
  })
}
function getUserUsedQuota (userId) {
  // Don't use sequelize because we need to use a sub query
  const query = UserModel.generateUserQuotaBaseSQL({
    withSelect: true,
    whereUserId: '$userId'
  })
  return UserModel.getTotalRawQuery(query, userId)
}

// ---------------------------------------------------------------------------

export {
  processPremiumStorageChecker
}
