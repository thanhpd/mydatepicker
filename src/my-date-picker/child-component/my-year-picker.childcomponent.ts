import { Component, Input, Output, OnInit, EventEmitter, ElementRef, ViewEncapsulation, Renderer } from "@angular/core";
import { IMyDate, IMyMonth, IMyOptions, IMyMonthMeta } from "../interfaces/index";
import { UtilService } from "../services/my-date-picker.util.service";

// webpack1_
declare var require: any;
const myYpTpl: string = require("./my-year-picker.childcomponent.html");

@Component({
    selector: "year-picker",
    template: myYpTpl,
    encapsulation: ViewEncapsulation.None
})

export class MyYearPicker implements OnInit {
    @Input() opts: IMyOptions;
    @Input() selectedDate: IMyDate;

    @Output() cellClicked: EventEmitter<IMyMonth> = new EventEmitter<IMyMonth>();

    monthsInYear: Array<IMyMonthMeta> = [];
    years: Array<number> = [];
    today: IMyDate = this.utilService.getToday();

    // Properties for virtual scrolling of year view
    yearWrapperElem: HTMLElement;
    onScrollListener: Function;
    topPadding: number;
    scrollHeight: number;
    previousStart: number;
    previousEnd: number;

    constructor(public elem: ElementRef, private renderer: Renderer, private utilService: UtilService) {
        console.log(this.elem.nativeElement);        
        // this.initMonthsInYear();
    }

    ngOnInit() {
        console.log(this.opts);
        console.log(this.selectedDate);
        this.initMonthsInYear();
    }

    private initMonthsInYear(): void {
        if (this.monthsInYear.length === 0) {
            let y = this.selectedDate.year ? this.selectedDate.year : this.utilService.getToday().year;
            for (let i = 1; i <= 12; i++) {
                let month: IMyMonthMeta = { monthNbr: i, monthTxt: this.opts.monthLabels[i] };
                this.monthsInYear.push(month);
            }
            this.createYearCalendar(y);
        }
        else {
            this.monthsInYear.forEach((month, index) => {
                month.monthTxt = this.opts.monthLabels[index + 1];
            });
        }
    }

    private createYearCalendar(year: number): void {
        // Clear existing year calendar
        this.years = [];

        this.years.push(year);
        // Create next 5 yearrows
        for (let i = 1; i <= 5; i++) {
            this.years.push(year + i);
        }
    }

    private monthCellClicked(month: IMyMonthMeta, year: number): void {        
        this.cellClicked.emit({monthNbr: month.monthNbr, monthTxt: month.monthTxt, year: year});
    }
}