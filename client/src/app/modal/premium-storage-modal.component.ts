import { Component, ElementRef, ViewChild, Input } from '@angular/core'
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'premium-storage-modal',
  templateUrl: './premium-storage-modal.component.html',
  styleUrls: [ './premium-storage-modal.component.scss' ]
})
export class PremiumStorageModalComponent {
  @ViewChild('modal', { static: true }) modal: ElementRef

//   @Input() title: string
//   @Input() content: string
//   @Input() close?: boolean
//   @Input() cancel?: { value: string, action?: () => void }
//   @Input() confirm?: { value: string, action?: () => void }

  public close = true
  // public cancel = { value: 'Cancel', action: () => this.doNothing() }
  public confirm = { value: 'Go', action: () => this.goToSettings() }
  private modalRef: NgbModalRef

  constructor (
    private modalService: NgbModal
  ) { }

  show () {
    console.log('ICEICE on premiumModal show()')
    if (this.modalRef instanceof NgbModalRef && this.modalService.hasOpenModals()) {
      console.error('Cannot open another custom modal, one is already opened.')
      return
    }

    // this.title = title
    // this.content = content
    // this.close = close
    // this.cancel = cancel
    // this.confirm = confirm

    this.modalRef = this.modalService.open(this.modal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    })
  }

  onCancelClick () {
    this.modalRef.close()

    // if (typeof this.cancel.action === 'function') {
    //   this.cancel.action()
    // }

    this.destroy()
  }

  onCloseClick () {
    this.modalRef.close()
    this.destroy()
  }

  onConfirmClick () {
    this.modalRef.close()

    if (typeof this.confirm.action === 'function') {
      this.confirm.action()
    }

    this.destroy()
  }

  doNothing () {
    console.log('ICEICE clicked on Cancel')
    return
  }

  goToSettings () {
      /* ToDo: Navigate to settings */
    console.log('ICEICE you clicked on Accept and will go to settings')
  }

  hasCancel () {
    // return  typeof this.cancel !== 'undefined'
    return false
  }

  hasConfirm () {
    return typeof this.confirm !== 'undefined'
  }

  private destroy () {
    delete this.modalRef
    // delete this.title
    // delete this.content
    delete this.close
    // delete this.cancel
    delete this.confirm
  }
}
