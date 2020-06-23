import * as express from 'express'
import {
  asyncMiddleware
} from '../../middlewares'
import { PremiumStoragePlanModel } from '../../models/premium-storage-plan'

const premiumStorageRouter = express.Router()

premiumStorageRouter.get('/plans',
  asyncMiddleware(getPlans)
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
