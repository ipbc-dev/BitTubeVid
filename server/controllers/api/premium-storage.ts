import * as express from 'express'
import {
  asyncMiddleware,
  authenticate
  // paginationValidator,
  // setDefaultSort,
  // setDefaultPagination

} from '../../middlewares'
import { WEBSERVER } from '../../initializers/constants'
import { UserRight } from '@server/../shared'
import { ensureUserHasRight } from '@server/middlewares'
import { PremiumStoragePlanModel } from '../../models/premium-storage-plan'
import { userPremiumStoragePaymentModel } from '../../models/user-premium-storage-payments'
const fetch = require('node-fetch')
const Headers = fetch.Headers
const firebaseApiUrl = 'https://us-central1-bittube-airtime-extension.cloudfunctions.net/'
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

premiumStorageRouter.post('/update-plan',
  authenticate,
  ensureUserHasRight(UserRight.ALL),
  asyncMiddleware(adminUpdatePlan)
)
// ---------------------------------------------------------------------------

export {
  premiumStorageRouter
}

// ----------------------------------------------------------------------------
async function adminUpdatePlan (req: express.Request, res: express.Response) {
  try {
    const body = req.body
    if (body.id === undefined ||
      typeof (body.id) !== 'number') {
      throw Error(`Undefined or invalid id ${body.id}`)
    }
    if (body === undefined ||
        body.id === undefined ||
        body.name === undefined ||
        body.quota === undefined ||
        body.dailyQuota === undefined ||
        body.duration === undefined ||
        body.expiration === undefined ||
        body.priceTube === undefined ||
        body.active === undefined
    ) {
      throw Error(`Undefined or invalid body parameters ${body}`)
    }
    /* Building body */
    const apiReqBody = {
      id: body.tubePayId,
      host: WEBSERVER.URL,
      auth: req.headers.authorization,
      title: body.name,
      validFor: parseInt(body.expiration),
      price: body.priceTube
    }
    const firebaseApiRes = await fetch(firebaseApiUrl + 'peertubeModifyProduct', {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(apiReqBody)
    })
    const firebaseApiResult = await firebaseApiRes.json()
    if (firebaseApiResult.success) {
      const updateResult = await PremiumStoragePlanModel.updatePlan(body.id, body.name, body.quota, body.dailyQuota, body.duration, body.expiration, body.priceTube, body.active)
      return res.json({ success: true, added: updateResult })
    } else {
      return res.json({ success: false, error: firebaseApiResult })
    }
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function adminAddPlan (req: express.Request, res: express.Response) {
  try {
    const body = req.body
    if (body === undefined ||
      body.name === undefined ||
      body.quota === undefined ||
      body.dailyQuota === undefined ||
      body.duration === undefined ||
      body.expiration === undefined ||
      body.priceTube === undefined ||
      body.active === undefined
    ) {
      throw Error(`Undefined or invalid body parameters ${body}`)
    }
    /* Adding some more info to body */
    body.host = WEBSERVER.URL
    body.auth = req.headers.authorization
    // console.log('ICEICE going to call firebase with body: ', body)
    const firebaseApiRes = await fetch(firebaseApiUrl + 'peertubeAddProduct', {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(body)
    })
    // console.log('ICEICE firebaseApiRes is: ', firebaseApiRes)
    const firebaseApiResult = await firebaseApiRes.json()
    if (firebaseApiResult.success) {
      const addResult = await PremiumStoragePlanModel.addPlan(
        body.name,
        body.quota,
        body.dailyQuota,
        body.duration,
        body.expiration,
        body.priceTube,
        body.active,
        firebaseApiResult.product.id,
        firebaseApiResult.product.secret,
        firebaseApiResult.product.ownerContentName
      )
      return res.json({ success: true, added: addResult, firebase: firebaseApiResult })
    } else {
      return res.json({ success: false, error: 'BitTube-Airtime-extension-server did not respond in time' })
    }
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function adminDeletePlan (req: express.Request, res: express.Response) {
  try {
    const body = req.body
    if (body.planId === undefined ||
      typeof (body.planId) !== 'number' ||
      body.tubePayId === undefined ||
      typeof (body.tubePayId) !== 'string'
    ) {
      throw Error(`Undefined or invalid id ${body.planId} - ${body.tubePayId}`)
    }
    /* Building body */
    const apiReqBody = {
      id: body.tubePayId,
      host: WEBSERVER.URL,
      auth: req.headers.authorization
    }
    const firebaseApiRes = await fetch(firebaseApiUrl + 'peertubeDeleteProduct', {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(apiReqBody)
    })
    const firebaseApiResult = await firebaseApiRes.json()
    const deleteResult = await PremiumStoragePlanModel.removePlan(body.planId)
    const deleteResponse = deleteResult// .map(del => del.toJSON())
    return res.json({ success: true, deleted: deleteResponse, firebase: firebaseApiResult })
  } catch (err) {
    return res.json({ success: false, error: err.message })
  }
}

async function getUserBilling (req: express.Request, res: express.Response) {
  try {
    const user = res.locals.oauth.token.User
    const userId = user.id
    const billingResult = await userPremiumStoragePaymentModel.getUserPayments(userId)
    const billingResponse = billingResult.map(bill => bill.toJSON())
    return res.json({ success: true, billing: billingResponse })
  } catch (err) {
    return res.json({ success: false, error: err.message })
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
    const userId = user.id
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
    const userId = userToUpdate.id
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
    if (body.priceTube === undefined || parseFloat(body.priceTube) !== parseFloat(chosenPlan.priceTube)) {
      throw new Error(`Undefined or incorrect priceTube body:${parseFloat(body.priceTube)}  chosen:${parseFloat(chosenPlan.priceTube)}`)
    }
    if (body.duration === undefined || parseInt(body.duration) !== parseInt(chosenPlan.duration)) {
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
        dailyQuota: chosenPlan.dailyQuota,
        payment_tx: body.payment_tx
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
        dailyQuota: chosenPlan.dailyQuota,
        payment_tx: body.payment_tx
      }
    }
    /* Adding payment record to DB */
    const paymentResult = await userPremiumStoragePaymentModel.create(createData)
    const paymentResponse = paymentResult.toJSON()

    /* Set user Quota && dailyQuota in user table */
    userToUpdate.videoQuota = chosenPlan.quota
    userToUpdate.videoQuotaDaily = chosenPlan.dailyQuota

    const updateUserResult = await userToUpdate.save()

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
