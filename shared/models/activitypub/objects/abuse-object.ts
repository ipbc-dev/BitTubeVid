<<<<<<< Updated upstream:shared/models/activitypub/objects/video-abuse-object.ts
export interface VideoAbuseObject {
  type: 'Flag'
  content: string
  object: string | string[]
=======
import { ActivityFlagReasonObject } from './common-objects'

export interface AbuseObject {
  type: 'Flag'
  content: string
  object: string | string[]

  tag?: ActivityFlagReasonObject[]

  startAt?: number
  endAt?: number
>>>>>>> Stashed changes:shared/models/activitypub/objects/abuse-object.ts
}
