import { Component, ElementRef, ViewChild, Input } from '@angular/core'
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'premium-storage-modal',
  templateUrl: './premium-storage-modal.component.html',
  styleUrls: [ './premium-storage-modal.component.scss' ]
})
export class PremiumStorageModalComponent {
  @ViewChild('modal', { static: true }) modal: ElementRef

  public close = true
  public confirm = { value: 'Go' }
  private modalRef: NgbModalRef

  constructor (
    private modalService: NgbModal
  ) { }

  show () {
    if (this.modalRef instanceof NgbModalRef && this.modalService.hasOpenModals()) {
      console.error('Cannot open another custom modal, one is already opened.')
      return
    }
    this.modalRef = this.modalService.open(this.modal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    })
  }

  onCancelClick () {
    this.modalRef.close()
    this.destroy()
  }

  onCloseClick () {
    this.modalRef.close()
    this.destroy()
  }

  hasCancel () {
    return false
  }

  hasConfirm () {
    return typeof this.confirm !== 'undefined'
  }

  private destroy () {
    delete this.modalRef
  }
}
