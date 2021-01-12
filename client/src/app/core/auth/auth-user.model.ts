<<<<<<< Updated upstream
import { peertubeLocalStorage } from '@app/shared/misc/peertube-web-storage'
import { UserRight } from '../../../../../shared/models/users/user-right.enum'
import { MyUser as ServerMyUserModel, User as ServerUserModel, MyUserSpecialPlaylist } from '../../../../../shared/models/users/user.model'
// Do not use the barrel (dependency loop)
import { hasUserRight, UserRole } from '../../../../../shared/models/users/user-role'
import { User } from '../../shared/users/user.model'
import { NSFWPolicyType } from '../../../../../shared/models/videos/nsfw-policy.type'
=======
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { User } from '@app/core/users/user.model'
import {
  flushUserInfoFromLocalStorage,
  getUserInfoFromLocalStorage,
  saveUserInfoIntoLocalStorage,
  TokenOptions,
  Tokens
} from '@root-helpers/users'
import { hasUserRight } from '@shared/core-utils/users'
import {
  MyUser as ServerMyUserModel,
  MyUserSpecialPlaylist,
  User as ServerUserModel,
  UserRight,
  UserRole,
  UserVideoQuota
} from '@shared/models'
>>>>>>> Stashed changes

export class AuthUser extends User implements ServerMyUserModel {
  tokens: Tokens
  specialPlaylists: MyUserSpecialPlaylist[]

  canSeeVideosLink = true

  static load () {
    const tokens = Tokens.load()
    if (!tokens) return null

    const userInfo = getUserInfoFromLocalStorage()
    if (!userInfo) return null

    return new AuthUser(userInfo, tokens)
  }

  static flush () {
    flushUserInfoFromLocalStorage()

    Tokens.flush()
  }

  constructor (userHash: Partial<ServerMyUserModel>, hashTokens: TokenOptions) {
    super(userHash)

    this.tokens = new Tokens(hashTokens)
    this.specialPlaylists = userHash.specialPlaylists
  }

  getAccessToken () {
    return this.tokens.accessToken
  }

  getRefreshToken () {
    return this.tokens.refreshToken
  }

  getTokenType () {
    return this.tokens.tokenType
  }

  refreshTokens (accessToken: string, refreshToken: string) {
    this.tokens.accessToken = accessToken
    this.tokens.refreshToken = refreshToken
  }

  hasRight (right: UserRight) {
    return hasUserRight(this.role, right)
  }

  canManage (user: ServerUserModel) {
    const myRole = this.role

    if (myRole === UserRole.ADMINISTRATOR) return true

    // I'm a moderator: I can only manage users
    return user.role === UserRole.USER
  }

  save () {
    saveUserInfoIntoLocalStorage({
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      nsfwPolicy: this.nsfwPolicy,
      webTorrentEnabled: this.webTorrentEnabled,
      autoPlayVideo: this.autoPlayVideo
    })

    this.tokens.save()
  }

  computeCanSeeVideosLink (quotaObservable: Observable<UserVideoQuota>): Observable<boolean> {
    if (!this.isUploadDisabled()) {
      this.canSeeVideosLink = true
      return of(this.canSeeVideosLink)
    }

    // Check if the user has videos
    return quotaObservable.pipe(
      map(({ videoQuotaUsed }) => {
        if (videoQuotaUsed !== 0) {
          // User already uploaded videos, so it can see the link
          this.canSeeVideosLink = true
        } else {
          // No videos, no upload so the user don't need to see the videos link
          this.canSeeVideosLink = false
        }

        return this.canSeeVideosLink
      })
    )
  }
}
