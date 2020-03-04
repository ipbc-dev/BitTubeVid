import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ConfirmService, Notifier } from '@app/core'
import { Subject, Subscription } from 'rxjs'
import { AuthService } from '../../../core/auth'
import { ComponentPagination, hasMoreItems } from '../../../shared/rest/component-pagination.model'
import { User } from '../../../shared/users'
import { CommentSortField } from '../../../shared/video/sort-field.type'
import { VideoDetails } from '../../../shared/video/video-details.model'
import { VideoComment } from './video-comment.model'
import { VideoCommentService } from './video-comment.service'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { Syndication } from '@app/shared/video/syndication.model'
import { HooksService } from '@app/core/plugins/hooks.service'
import { VideoCommentThreadTree } from '@app/videos/+video-watch/comment/video-comment-thread-tree.model'

@Component({
  selector: 'my-video-comments',
  templateUrl: './video-comments.component.html',
  styleUrls: ['./video-comments.component.scss']
})
export class VideoCommentsComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('commentHighlightBlock') commentHighlightBlock: ElementRef
  @Input() video: VideoDetails
  @Input() user: User

  @Output() timestampClicked = new EventEmitter<number>()

  comments: VideoComment[] = []
  highlightedThread: VideoComment
  sort: CommentSortField = '-createdAt'
  componentPagination: ComponentPagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: null
  }
  inReplyToCommentId: number
  threadComments: { [ id: number ]: VideoCommentThreadTree } = {}
  threadLoading: { [ id: number ]: boolean } = {}

  syndicationItems: Syndication[] = []

  onDataSubject = new Subject<any[]>()

  private sub: Subscription

  constructor (
    private authService: AuthService,
    private notifier: Notifier,
    private confirmService: ConfirmService,
    private videoCommentService: VideoCommentService,
    private activatedRoute: ActivatedRoute,
    private i18n: I18n,
    private hooks: HooksService
  ) {}

  ngOnInit () {
    // Find highlighted comment in params
    this.sub = this.activatedRoute.params.subscribe(
      params => {
        if (params['threadId']) {
          const highlightedThreadId = +params['threadId']
          this.processHighlightedThread(highlightedThreadId)
        }
      }
    )
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes['video']) {
      this.resetVideo()
    }
  }

  ngOnDestroy () {
    if (this.sub) this.sub.unsubscribe()
  }

  viewReplies (commentId: number, highlightThread = false) {
    this.threadLoading[commentId] = true

    const params = {
      videoId: this.video.id,
      threadId: commentId
    }

    const obs = this.hooks.wrapObsFun(
      this.videoCommentService.getVideoThreadComments.bind(this.videoCommentService),
      params,
      'video-watch',
      'filter:api.video-watch.video-thread-replies.list.params',
      'filter:api.video-watch.video-thread-replies.list.result'
    )

    obs.subscribe(
        res => {
          this.threadComments[commentId] = res
          this.threadLoading[commentId] = false

          if (highlightThread) {
            this.highlightedThread = new VideoComment(res.comment)

            // Scroll to the highlighted thread
            setTimeout(() => this.commentHighlightBlock.nativeElement.scrollIntoView(), 0)
          }
        },

        err => this.notifier.error(err.message)
      )
  }

  loadMoreThreads () {
    const params = {
      videoId: this.video.id,
      componentPagination: this.componentPagination,
      sort: this.sort
    }

    const obs = this.hooks.wrapObsFun(
      this.videoCommentService.getVideoCommentThreads.bind(this.videoCommentService),
      params,
      'video-watch',
      'filter:api.video-watch.video-threads.list.params',
      'filter:api.video-watch.video-threads.list.result'
    )

    obs.subscribe(
      res => {
        this.comments = this.comments.concat(res.data)
        this.componentPagination.totalItems = res.total

        this.onDataSubject.next(res.data)
      },

      err => this.notifier.error(err.message)
    )
  }

  onCommentThreadCreated (comment: VideoComment) {
    this.comments.unshift(comment)
  }

  onWantedToReply (comment: VideoComment) {
    this.inReplyToCommentId = comment.id
  }

  onResetReply () {
    this.inReplyToCommentId = undefined
  }

  onThreadCreated (commentTree: VideoCommentThreadTree) {
    this.viewReplies(commentTree.comment.id)
  }

  handleSortChange (sort: CommentSortField) {
    if (this.sort === sort) return

    this.sort = sort
    this.resetVideo()
  }

  handleTimestampClicked (timestamp: number) {
    this.timestampClicked.emit(timestamp)
  }

  async onWantedToDelete (commentToDelete: VideoComment) {
    let message = 'Do you really want to delete this comment?'

    if (commentToDelete.isLocal) {
      message += this.i18n(' The deletion will be sent to remote instances, so they remove the comment too.')
    } else {
      message += this.i18n(' It is a remote comment, so the deletion will only be effective on your instance.')
    }

    const res = await this.confirmService.confirm(message, this.i18n('Delete'))
    if (res === false) return

    this.videoCommentService.deleteVideoComment(commentToDelete.videoId, commentToDelete.id)
      .subscribe(
        () => {
          // Mark the comment as deleted
          this.softDeleteComment(commentToDelete)

          if (this.highlightedThread.id === commentToDelete.id) this.highlightedThread = undefined
        },

        err => this.notifier.error(err.message)
      )
  }

  isUserLoggedIn () {
    return this.authService.isLoggedIn()
  }

  onNearOfBottom () {    
    if (hasMoreItems(this.componentPagination)) {
      this.componentPagination.currentPage++
      this.loadMoreThreads()
    }
  }

  private softDeleteComment (comment: VideoComment) {
    comment.isDeleted = true
    comment.deletedAt = new Date()
    comment.text = ''
    comment.account = null
  }

  private resetVideo () {
    if (this.video.commentsEnabled === true) {
      // Reset all our fields
      this.highlightedThread = null
      this.comments = []
      this.threadComments = {}
      this.threadLoading = {}
      this.inReplyToCommentId = undefined
      this.componentPagination.currentPage = 1
      this.componentPagination.totalItems = null

      this.syndicationItems = this.videoCommentService.getVideoCommentsFeeds(this.video.uuid)
      
      this.loadMoreThreads()
    }
  }

  private processHighlightedThread (highlightedThreadId: number) {
    this.highlightedThread = this.comments.find(c => c.id === highlightedThreadId)

    const highlightThread = true
    this.viewReplies(highlightedThreadId, highlightThread)
  }
}
