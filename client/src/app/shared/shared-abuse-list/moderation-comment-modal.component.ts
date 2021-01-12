import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { Notifier } from '@app/core'
<<<<<<< Updated upstream:client/src/app/+admin/moderation/video-abuse-list/moderation-comment-modal.component.ts
import { FormReactive, VideoAbuseService, VideoAbuseValidatorsService } from '../../../shared'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal/modal-ref'
import { FormValidatorService } from '../../../shared/forms/form-validators/form-validator.service'
import { VideoAbuse } from '../../../../../../shared/models/videos'
=======
import { FormReactive, FormValidatorService } from '@app/shared/shared-forms'
import { AbuseService } from '@app/shared/shared-moderation'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal/modal-ref'
import { AdminAbuse } from '@shared/models'
import { ABUSE_MODERATION_COMMENT_VALIDATOR } from '../form-validators/abuse-validators'
>>>>>>> Stashed changes:client/src/app/shared/shared-abuse-list/moderation-comment-modal.component.ts

@Component({
  selector: 'my-moderation-comment-modal',
  templateUrl: './moderation-comment-modal.component.html',
  styleUrls: [ './moderation-comment-modal.component.scss' ]
})
export class ModerationCommentModalComponent extends FormReactive implements OnInit {
  @ViewChild('modal', { static: true }) modal: NgbModal
  @Output() commentUpdated = new EventEmitter<string>()

  private abuseToComment: AdminAbuse
  private openedModal: NgbModalRef

  constructor (
    protected formValidatorService: FormValidatorService,
    private modalService: NgbModal,
    private notifier: Notifier,
    private abuseService: AbuseService
  ) {
    super()
  }

  ngOnInit () {
    this.buildForm({
      moderationComment: ABUSE_MODERATION_COMMENT_VALIDATOR
    })
  }

  openModal (abuseToComment: AdminAbuse) {
    this.abuseToComment = abuseToComment
    this.openedModal = this.modalService.open(this.modal, { centered: true })

    this.form.patchValue({
      moderationComment: this.abuseToComment.moderationComment
    })
  }

  hide () {
    this.abuseToComment = undefined
    this.openedModal.close()
    this.form.reset()
  }

  async banUser () {
    const moderationComment: string = this.form.value[ 'moderationComment' ]

    this.abuseService.updateAbuse(this.abuseToComment, { moderationComment })
        .subscribe(
          () => {
            this.notifier.success($localize`Comment updated.`)

            this.commentUpdated.emit(moderationComment)
            this.hide()
          },

          err => this.notifier.error(err.message)
        )
  }

}
