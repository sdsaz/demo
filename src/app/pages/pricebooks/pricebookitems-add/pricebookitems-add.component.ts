//Angular
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
//Services
import { PricebookService } from '../pricebook.service';
//Common
import { CommonHelper } from '../../../@core/common-helper';
import { DefaultPriceBookItemsPagingParams } from '../../../@core/sharedModels/paging-params.model';
//Other
import { Table } from 'primeng/table';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

@Component({
  selector: 'ngx-pricebookitems-add',
  templateUrl: './pricebookitems-add.component.html',
  styleUrls: ['./pricebookitems-add.component.scss']
})
export class PricebookitemsAddComponent {
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;

  @Input() currencySymbol: any = null;
  @Input() priceBookId: any = null;

  // price book items pagination
  pricebookItemsPagingParams: DefaultPriceBookItemsPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  priceBookItems: any[] = [];

  selectedRows: any = [];
  isAllCheckBoxSelected: boolean;

  pricebookItemCols = [
    { field: 'productName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.TABLE_HEADER_PRODUCTNAME', sort: true },
    { field: 'productSkuName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.TABLE_HEADER_PRODUCTSKUNAME', sort: true },
    { field: 'productSku', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.TABLE_HEADER_PRODUCTSKU', sort: true },
    { field: 'uomName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.TABLE_HEADER_PRODUCT_UOM', sort: true },
    { field: 'price', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.TABLE_HEADER_PRICE', sort: true, class: "text-right" },
  ];

  constructor(
    private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _priceBookService: PricebookService) {
    this.initializePagination();
  }

  //REGION PUBLIC METHODS START
  ngOnInit(): void {
    this.getPriceBookAddItems(this.pricebookItemsPagingParams);
    this.subscribeSearchboxEvent();
  }

  saveSelectedItems(){
    let params:any = [];
    this.selectedRows.forEach(selectedItem => {
      params.push({
        priceBookId  : this.priceBookId,
        price  : selectedItem.price,
        productId : selectedItem.productID,
        productSkuId : selectedItem.productSkuID,
      })
    });

    this._commonHelper.showLoader();
    this._priceBookService.savePriceBookItems(params)
      .then(() => {
        this._ngbActiveModal.close(true);
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.ADD_PRICEBOOKITEM_DIALOG.SUCCESS_MESSAGE'));
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //for close form
  onCloseForm() {
    this._ngbActiveModal.close(false);
  }

  paginate(event: any): void {
    this.pricebookItemsPagingParams.pageNo = (event.first / event.rows) + 1;
    this.pricebookItemsPagingParams.pageSize = event.rows;
    this.fetchPriceBookAddItems();
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pricebookItemsPagingParams.sortOrder = "ASC";
      }
      else {
        this.pricebookItemsPagingParams.sortOrder = "DESC";
      }
      this.pricebookItemsPagingParams.sortColumn = this.pTable.sortField;
      this.fetchPriceBookAddItems();
    }
  }

  changePage(): void {
    if (this.pricebookItemsPagingParams.pageNo <= this.totalPages && this.pricebookItemsPagingParams.pageNo > 0) {
      this.pricebookItemsPagingParams.pageNo = this.pricebookItemsPagingParams.pageNo > 0 ? this.pricebookItemsPagingParams.pageNo : 1;
      this.fetchPriceBookAddItems();
    }
    else if (this.pricebookItemsPagingParams.pageNo > this.totalPages) {
      this.pricebookItemsPagingParams.pageNo = this.totalPages;
    }
    else if (this.pricebookItemsPagingParams.pageNo <= 0) {
      this.pricebookItemsPagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pricebookItemsPagingParams.pageNo = 1;
    if (this.end == this.pricebookItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchPriceBookAddItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pricebookItemsPagingParams.pageNo = this.pricebookItemsPagingParams.pageNo - 1 > 0 ? this.pricebookItemsPagingParams.pageNo - 1 : 1;
    if (this.end == this.pricebookItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchPriceBookAddItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pricebookItemsPagingParams.pageNo = (this.pricebookItemsPagingParams.pageNo + 1) <= this.totalPages ? this.pricebookItemsPagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchPriceBookAddItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  afterSelect(rowData) {
    if (this.selectedRows.filter(x => x.id == rowData.id).length > 0) {
      this.selectedRows.forEach( (item, index) => {
        if(item.id === rowData.id) this.selectedRows.splice(index,1);
      });
    }
    else {
      this.selectedRows.push(rowData);
    }

    const selectedPriceBookItemsListCount = this.priceBookItems.filter(x => x.isSelected).length;

    if (this.priceBookItems.length == selectedPriceBookItemsListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.priceBookItems.forEach(priceBookItem => {
      priceBookItem.isSelected = this.isAllCheckBoxSelected;

      if (this.isAllCheckBoxSelected) {
        this.selectedRows.push(priceBookItem);
      }
      else {
        this.selectedRows.forEach( (item, index) => {
          if(item.id === priceBookItem.id) this.selectedRows.splice(index,1);
        });
      }
    });
  }
  //REGION PUBLIC METHODS END

  //REGION PRIVATE METHODS START
  private initializePagination(): void {
    this.pricebookItemsPagingParams = new DefaultPriceBookItemsPagingParams();
    this.pricebookItemsPagingParams.searchString = '';
    this.pricebookItemsPagingParams.sortColumn = 'productName';
    this.pricebookItemsPagingParams.sortOrder = 'ASC';
    this.pricebookItemsPagingParams.pageNo = 1;
    this.pricebookItemsPagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.pricebookItemsPagingParams.searchString = val;
        // reset
        this.pricebookItemsPagingParams.pageNo = 1;
        this.fetchPriceBookAddItems();
      });
  }

  private fetchPriceBookAddItems(): void {
    if (this.pTable) {
      this.getPriceBookAddItems(this.pricebookItemsPagingParams);
    }
  }

  private getPriceBookAddItems(pagingParams: DefaultPriceBookItemsPagingParams): void {
    this._commonHelper.showLoader();
    this.pricebookItemsPagingParams.priceBookId = this.priceBookId;
    this._priceBookService.getDefaultPriceBookAddItems(pagingParams).then((response: any[]) => {
      this._commonHelper.hideLoader();
      if (response) {
        this.priceBookItems = response;
        this.totalRecords = this.priceBookItems.length > 0 ? this.priceBookItems[0].totalRecords : 0;
        this.pTable.rows = this.pricebookItemsPagingParams.pageSize;
        this.totalPages = Math.ceil(this.totalRecords / this.pricebookItemsPagingParams.pageSize);
        this.end = this.pricebookItemsPagingParams.pageNo == this.totalPages ? this.totalRecords : this.pricebookItemsPagingParams.pageNo * this.pricebookItemsPagingParams.pageSize;
        this.start = this.end == this.totalRecords ? (this.totalRecords - this.priceBookItems.length + 1) : (this.end - this.pricebookItemsPagingParams.pageSize) + 1;
        
        //keep selected items
        this.priceBookItems.filter(x => this.selectedRows.filter(y => y.id == x.id).length > 0).map(y => y.isSelected = true);
        this.isAllCheckBoxSelected = this.priceBookItems.length > 0 && this.priceBookItems.filter(x=> x.isSelected == true).length == this.priceBookItems.length;
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }
  //REGION PRIVATE METHODS END
}
