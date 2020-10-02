/* eslint-disable @typescript-eslint/indent */
import { logger } from '../../../helpers/logger'
import { Hooks } from '../../../lib/plugins/hooks'
import { userPremiumStoragePaymentModel } from '@server/models/user-premium-storage-payments'
import { premiumStorageSlowPayer } from '@server/models/premium-storage-slow-payer'
import { UserModel } from '@server/models/account/user'
import { VideoModel } from '@server/models/video/video'
import { CONFIG } from '@server/initializers/config'
import { Emailer } from '@server/lib/emailer'

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
    const videosAmmountToDelete = 10
    await checkOutdatedPayments()
    await cleanVideosFromSlowPayers(videosAmmountToDelete)
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
      console.log('premiumStorageChecker found outdated payment: ', payment)
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
      console.log('premiumStorageChecker slowPlayer successfuly added')
    } else {
        const paymentDateToWeekLess = (payment.dateTo - 604800000) // a week in miliseconds
      if (paymentDateToWeekLess < Date.now()) {
        const userInfo = await UserModel.loadById(payment.userId)
        Emailer.Instance.addPremiumStorageAboutToExpireJob(userInfo.username, userInfo.email, CONFIG.WEBSERVER.HOSTNAME, payment.dateTo - Date.now())
      }
    }

  })
}

async function cleanVideosFromSlowPayers (videosAmmountToDelete: number) {
  const slowPayersList = await premiumStorageSlowPayer.getAllSlowPayers()
  await parallel(1, slowPayersList, async (slowPayer) => {
    const userInfo = await UserModel.loadById(slowPayer.userId)
    const actorId = userInfo.Account.id
    const userVideos = await VideoModel.listUserVideosForApi(actorId, 0, videosAmmountToDelete, "-createdAt")
    const userVideoQuota = userInfo.videoQuota
    let deletedVideosCounter = 0
    const deletedVideosNames = []
    //  1 - Get x number of videos from user
    let userUsedVideoQuota
    for (const video of userVideos.data) {
      userUsedVideoQuota = await getUserUsedQuota(slowPayer.userId)
      if (userUsedVideoQuota > userVideoQuota) {
        // Delete video
        deletedVideosNames.push(video.name)
        await video.destroy()
        deletedVideosCounter++
        Hooks.runAction('action:api.video.deleted', { video })
      }
    }
    if (deletedVideosCounter > 0) {
      // Send email
      //   console.log('ICECIE videoNames are: ', deletedVideosNames)
      //   console.log(`cleanVideosFromSlowPayers going to send email after deleting ${deletedVideosCounter} videos`)
        Emailer.Instance.addPremiumStorageExpiredJob(userInfo.username, userInfo.email, CONFIG.WEBSERVER.HOSTNAME, deletedVideosCounter, deletedVideosNames)
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
