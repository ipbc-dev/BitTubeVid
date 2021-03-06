import * as Bull from 'bull'
import { ActivitypubHttpUnicastPayload } from '@shared/models'
import { logger } from '../../../helpers/logger'
import { doRequest } from '../../../helpers/requests'
import { REQUEST_TIMEOUT } from '../../../initializers/constants'
import { ActorFollowScoreCache } from '../../files-cache'
import { buildGlobalHeaders, buildSignedRequestOptions, computeBody } from './utils/activitypub-http-utils'

async function processActivityPubHttpUnicast (job: Bull.Job) {
  logger.info('Processing ActivityPub unicast in job %d.', job.id)

  const payload = job.data as ActivitypubHttpUnicastPayload
  const uri = payload.uri

  const body = await computeBody(payload)
  const httpSignatureOptions = await buildSignedRequestOptions(payload)

  const options = {
    method: 'POST',
    uri,
    json: body,
    httpSignature: httpSignatureOptions,
    timeout: REQUEST_TIMEOUT,
    headers: buildGlobalHeaders(body)
  }

  try {
    await doRequest(options)
    ActorFollowScoreCache.Instance.updateActorFollowsScore([ uri ], [])
  } catch (err) {
    ActorFollowScoreCache.Instance.updateActorFollowsScore([], [ uri ])

    throw err
  }
}

// ---------------------------------------------------------------------------

export {
  processActivityPubHttpUnicast
}
