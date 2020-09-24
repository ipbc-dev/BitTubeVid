// import { Redis } from '../../redis'
import { logger } from '../../../helpers/logger'
// import { VideoModel } from '../../../models/video/video'
// import { VideoViewModel } from '../../../models/video/video-view'
// import { isTestInstance } from '../../../helpers/core-utils'
// import { federateVideoIfNeeded } from '../../activitypub/videos'
import { userPremiumStoragePaymentModel } from '@server/models/user-premium-storage-payments'
import { premiumStorageSlowPayer } from '@server/models/premium-storage-slow-payer'
import { UserModel } from '@server/models/account/user'
import { CONFIG } from '@server/initializers/config'

async function processPremiumStorageChecker () {
  try {
    await checkOutdatedPayments()
    await cleanVideosFromSlowPayers()
  } catch (err) {
    console.error(err)
  }
}

async function checkOutdatedPayments () {
  const instanceDefaultQuota = await CONFIG.USER.VIDEO_QUOTA
  const instanceDefaultDailyQuota = await CONFIG.USER.VIDEO_QUOTA_DAILY
  const activePayments = await userPremiumStoragePaymentModel.getAllActivePayments()
  activePayments.forEach(async (payment) => {
    console.log('ICEICE payment is: ', payment)
    // Check if the payment is outdated
    if (payment.dateTo < Date.now()) {
      console.log('ICEICE this payment is outdated')
      await premiumStorageSlowPayer.addSlowPayer(payment.userId)
      await userPremiumStoragePaymentModel.deactivateUserPayment(payment.id)
      await UserModel.update(
        {
          videoQuota: instanceDefaultQuota,
          videoQuotaDaily: instanceDefaultDailyQuota,
          premiumStorageActive: false
        },
        {
          where: {
            id: payment.userId
          }
        }
      )
      console.log('ICEICE slowPlayer successfuly added')
    }
  })
}

async function cleanVideosFromSlowPayers () {
  const slowPayersList = await premiumStorageSlowPayer.getAllSlowPayers()
  slowPayersList.forEach(async (payment) => {
    const userInfo = await UserModel.loadById(payment.userId)
    console.log('ICEICE cleanVideosFromSlowPayers checking userINfo: ', userInfo)
    // TO-DO:
    //  1 - Get x number of videos from user
    //  2 - Check if usedQuota > totalQuota (if this is false go to "Remove user from SlowPlayersList"
    //  3 - Remove video from user. Go to step 2 while we still having videos to remove
  })
}

// ---------------------------------------------------------------------------

export {
  processPremiumStorageChecker
}
