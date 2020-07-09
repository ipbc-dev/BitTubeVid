import * as express from 'express'
import {
  asyncMiddleware,
  authenticate,
  paginationValidator,
  setDefaultSort,
  setDefaultPagination

} from '../../middlewares'
// import { CONFIG } from '@server/initializers/config' /* Usefull for CONFIG.USER.VIDEO_QUOTA && CONFIG.USER.VIDEO_QUOTA_DAILY */
import { UserRight } from '@server/../shared'
import { ensureUserHasRight } from '@server/middlewares'
import { PremiumStoragePlanModel } from '../../models/premium-storage-plan'
import { userPremiumStoragePaymentModel } from '../../models/user-premium-storage-payments'
import { ValidationChain } from 'express-validator'
import { ContextBuilder } from 'express-validator/src/context-builder'
import { INTEGER } from 'sequelize/types'
import { logger } from '@server/helpers/logger'
// import { logger } from '@server/helpers/logger'
// import { UserModel } from '../../models/account/user'
// import { updateUser } from '@shared/extra-utils/users/users'
// import { deleteUserToken } from 'server/lib/oauth-model'

const premiumStorageRouter = express.Router()

premiumStorageRouter.get('/plans',
  asyncMiddleware(getPlans)
)

premiumStorageRouter.get('/get-user-active-payment',
  authenticate,
  asyncMiddleware(getUserActivePayment)
)

premiumStorageRouter.get('/get-user-payments',
  authenticate,
  asyncMiddleware(getUserPayments)
)

premiumStorageRouter.post('/plan-payment',
  authenticate,
  asyncMiddleware(userPayPlan)
)

premiumStorageRouter.get('/billing-info',
  authenticate,
  asyncMiddleware(getUserBilling)
)

premiumStorageRouter.post('/delete-plan',
  authenticate,
  ensureUserHasRight(UserRight.ALL),
  asyncMiddleware(adminDeletePlan)
)

premiumStorageRouter.post('/add-plan',
  authenticate,
  ensureUserHasRight(UserRight.ALL),
  asyncMiddleware(adminAddPlan)
)
// ---------------------------------------------------------------------------

export {
  premiumStorageRouter
}

// ----------------------------------------------------------------------------
async function adminAddPlan (req: express.Request, res: express.Response) {
  try {
    const body = req.body
    logger.info('ICEICE body of the request is: ', body)
    if (body === undefined) {
      throw Error('Undefined or invalid body')
    }
    const addResult = await PremiumStoragePlanModel.addPlan(body.name, body.quota, body.dailyQuota, body.duration, body.price, body.active)
    const addResponse = addResult// .map(del => del.toJSON())
    return res.json({ success: true, added: addResponse })
  } catch (err) {
    return res.json({ success: false, error: err })
  }
}

async function adminDeletePlan (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    logger.info('ICEICE user info is: ', user)
    const body = req.body
    logger.info('ICEICE body of the request is: ', body)
    if (body.planId === undefined || typeof (body.planId) !== 'number') {
      throw Error('Undefined or invalid id')
    }
    const deleteResult = await PremiumStoragePlanModel.removePlan(body.planId)
    const deleteResponse = deleteResult// .map(del => del.toJSON())
    return res.json({ success: true, deleted: deleteResponse })
  } catch (err) {
    return res.json({ success: false, error: err })
  }
}

async function getUserBilling (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    const userId = user.Account.id
    const billingResult = await userPremiumStoragePaymentModel.getUserPayments(userId)
    const billingResponse = billingResult.map(bill => bill.toJSON())
    return res.json({ success: true, billing: billingResponse })
  } catch (err) {
    return res.json({ success: false, error: err })
  }
}

async function getPlans (req: express.Request, res: express.Response) {
  try {
    const plansResult = await PremiumStoragePlanModel.getPlans()
    const plansResponse = plansResult.map(plan => plan.toJSON())
    return res.json({ success: true, plans: plansResponse })
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function getPlansInfo () {
  try {
    const plansResult = await PremiumStoragePlanModel.getPlans()
    const plansResponse = plansResult.map(plan => plan.toJSON())
    return { success: true, data: plansResponse }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function getUserPayments (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    const userId = user.Account.id
    const paymentsResult = await userPremiumStoragePaymentModel.getUserPayments(userId)
    const paymentsResponse = paymentsResult.map(payment => payment.toJSON())
    if (paymentsResponse !== undefined && paymentsResponse !== null) {
      return res.json({ success: true, data: paymentsResponse })
    } else {
      throw new Error('Something went wrong getting getUserPayments!')
    }
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function getUserActivePayment (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    const userId = user.Account.id
    const paymentResult = await userPremiumStoragePaymentModel.getUserActivePayment(userId)
    const paymentResponse = paymentResult.map(payment => payment.toJSON())
    if (paymentResponse !== undefined && paymentResponse !== null) {
      return res.json({ success: true, data: paymentResponse })
    } else {
      throw new Error('Something went wrong getting getUserActivePayment!')
    }
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function getAllActivePayments (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    console.log(user)
    /* TO-DO: check if user is root or peertube? */
    const paymentResult = await userPremiumStoragePaymentModel.getAllActivePayments()
    const paymentResponse = paymentResult.map(payment => payment.toJSON())
    if (paymentResponse !== undefined && paymentResponse !== null) {
      return res.json({ success: true, data: paymentResponse })
    } else {
      throw new Error('Something went wrong getting getAllActivePayments!')
    }
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function userPayPlan (req: express.Request, res: express.Response) {
  try {
    const userToUpdate = res.locals.oauth.token.User
    const userId = userToUpdate.Account.id
    const body = req.body
    const plansInfo = await getPlansInfo()
    if (plansInfo.success === false) {
      throw new Error('There are not premium plans that you can pay in this instance')
    }
    let chosenPlan = null
    /* Looking for the chosen Plan data */
    for (var i = 0; i < plansInfo.data.length; i++) {
      const plan = plansInfo.data[i]
      if (parseInt(plan['id']) === parseInt(body.planId)) {
        chosenPlan = plan
      }
    }
    /* Checking POST body variables against saved plans */
    if (chosenPlan === null) {
      throw new Error(`This plan does not exist`)
    }
    if (body.planId === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string')) {
      throw new Error(`Undefined or incorrect planId`)
    }
    // eslint-disable-next-line max-len
    if (body.priceTube === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string') || parseFloat(body.priceTube) !== parseFloat(chosenPlan.priceTube)) {
      throw new Error(`Undefined or incorrect priceTube body:${parseFloat(body.priceTube)}  chosen:${parseFloat(chosenPlan.priceTube)}`)
    }
    if (body.duration === undefined || (typeof body.planId !== 'number' && typeof body.planId !== 'string') || parseInt(body.duration) !== parseInt(chosenPlan.duration)) {
      throw new Error('Undefined or incorrect duration')
    }
    /* Checking previous plans and creating post data */
    const userActualPlanResp = await userPremiumStoragePaymentModel.getUserActivePayment(userId)
    const userActualPlans = userActualPlanResp.map(plan => plan.toJSON())
    const userActualPlan = userActualPlans.length > 0 ? userActualPlans[userActualPlans.length - 1] : null
    let createData = {}
    let extended = true
    if (userActualPlan !== null) {
      const prevExpDate = Date.parse(userActualPlan['dateTo'])
      createData = {
        userId: userId,
        planId: body.planId,
        dateFrom: Date.now(),
        dateTo: prevExpDate + parseInt(body.duration),
        priceTube: body.priceTube,
        duration: body.duration,
        quota: chosenPlan.quota,
        dailyQuota: chosenPlan.dailyQuota
      }
      if (userActualPlan['planId'] > body.planId) {
        throw new Error("It's not possible to downgrade a plan before It's finished")
      }
    } else {
      extended = false
      createData = {
        userId: userId,
        planId: body.planId,
        dateFrom: Date.now(),
        dateTo: Date.now() + parseInt(body.duration),
        priceTube: body.priceTube,
        duration: body.duration,
        quota: chosenPlan.quota,
        dailyQuota: chosenPlan.dailyQuota
      }
    }
    /* Adding payment record to DB */
    const paymentResult = await userPremiumStoragePaymentModel.create(createData)
    const paymentResponse = paymentResult.toJSON()

    /* Set user Quota && dailyQuota in user table */
    userToUpdate.videoQuota = chosenPlan.quota
    userToUpdate.videoQuotaDaily = chosenPlan.dailyQuota
    userToUpdate.premiumStorageActive = true

    const updateUserResult = await userToUpdate.save()
    // Destroy user token to refresh rights (maybe needed?)
    // const deleteUserTokenResult = await deleteUserToken(userToUpdate.id)
    // console.log('deleteUserTokenResult is: ', deleteUserTokenResult)

    if (updateUserResult === undefined && updateUserResult === null) {
      throw new Error('Something went wrong updating user quota and dailyQuota')
    } else {
      /* Deactivate previous plan after insert the new one */
      if (userActualPlan !== null) {
        const deactivatePreviousPlan = await userPremiumStoragePaymentModel.deactivateUserPayment(userActualPlan['id'])
        if (deactivatePreviousPlan[0] !== 1) {
          return res.json({ success: true, extended: extended, data: paymentResponse, deactivatePreviousPlanWarning: deactivatePreviousPlan })
        }
      }
    }
    return res.json({ success: true, extended: extended, data: paymentResponse })

  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}
