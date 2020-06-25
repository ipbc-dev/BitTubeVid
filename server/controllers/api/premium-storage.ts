import * as express from 'express'
import {
  asyncMiddleware,
  authenticate
} from '../../middlewares'
import { PremiumStoragePlanModel } from '../../models/premium-storage-plan'
import { userPremiumStoragePaymentModel } from '../../models/user-premium-storage-payments'
// import { UserModel } from '../../models/account/user'
// import { updateUser } from '@shared/extra-utils/users/users'
import { deleteUserToken } from 'server/lib/oauth-model'

const premiumStorageRouter = express.Router()

premiumStorageRouter.get('/plans',
  asyncMiddleware(getPlans)
)

premiumStorageRouter.post('/payment',
  authenticate,
  asyncMiddleware(userPayPlan)
)

// ---------------------------------------------------------------------------

export {
  premiumStorageRouter
}

// ---------------------------------------------------------------------------

async function getPlans (req: express.Request, res: express.Response) {
  try {
    const plansResult = await PremiumStoragePlanModel.findAll()
    const plansResponse = plansResult.map(plan => plan.toJSON())
    return res.json({ success: true, plans: plansResponse })
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function getPlansInfo () {
  try {
    const plansResult = await PremiumStoragePlanModel.findAll()
    const plansResponse = plansResult.map(plan => plan.toJSON())
    const planIds = []
    plansResponse.forEach(element => {
      planIds.push(element['id'])
    })
    return { success: true, planIdsArray: planIds, data: plansResponse }
  } catch (err) {
    return { success: false, error: err.message }
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
    for (var i = 0; i < plansInfo.data.length; i++) {
      if (parseInt(plansInfo.data[i]['id']) === parseInt(body.planId)) {
        chosenPlan = plansInfo.data[i]
      }
    }
    if (chosenPlan === null) {
      throw new Error('Your chosen plan does not match any plan in our DataBase')
    }
    /* Checking POST body variables against saved plans */
    if (body.planId === undefined || typeof body.planId !== 'number' || !(body.planId in plansInfo.planIdsArray)) {
      throw new Error('Undefined or incorrect planId')
    }
    // eslint-disable-next-line max-len
    if (body.priceTube === undefined || typeof body.priceTube !== 'number' || parseFloat(body.priceTube) !== parseFloat(chosenPlan.priceTube)) {
      throw new Error('Undefined or incorrect priceTube')
    }
    if (body.duration === undefined || typeof body.duration !== 'number' || parseInt(body.duration) !== parseInt(chosenPlan.duration)) {
      throw new Error('Undefined or incorrect duration')
    }

    /* Adding payment record to DB */
    const paymentResult = await userPremiumStoragePaymentModel.create(
      {
        userId: userId,
        planId: body.planId,
        dateFrom: Date.now(),
        dateTo: Date.now() + body.duration,
        priceTube: body.priceTube,
        duration: body.duration
      })
    const paymentResponse = paymentResult.toJSON()

    /* Set user Quota && dailyQuota in user table */
    userToUpdate.videoQuota = chosenPlan.quota
    userToUpdate.videoQuotaDaily = chosenPlan.dailyQuota
    userToUpdate.premiumStorageActive = true

    const saveUserResult = await userToUpdate.save()
    console.log('saveUserResult is: ', saveUserResult)
    // Destroy user token to refresh rights (maybe needed?)
    // const deleteUserTokenResult = await deleteUserToken(userToUpdate.id)
    // console.log('deleteUserTokenResult is: ', deleteUserTokenResult)

    if (saveUserResult === undefined && saveUserResult === null) {
      throw new Error('Something went wrong updating user quota and dailyQuota')
    }
    return res.json({ success: true, data: paymentResponse })

  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}
