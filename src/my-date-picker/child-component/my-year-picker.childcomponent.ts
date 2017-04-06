import { Component, Input, Output, OnInit, OnChanges, OnDestroy, EventEmitter, ElementRef, ViewEncapsulation, Renderer, SimpleChanges } from "@angular/core";
import { IMyDate, IMyMonth, IMyOptions, IMyMonthMeta, IChangeEvent, IDimensions } from "../interfaces/index";
import { UtilService } from "../services/my-date-picker.util.service";

// webpack1_
declare var require: any;
const myYpTpl: string = require("./my-year-picker.childcomponent.html");

@Component({
    selector: "year-picker",
    template: myYpTpl,
    encapsulation: ViewEncapsulation.None
})

export class MyYearPicker implements OnInit, OnChanges, OnDestroy {
    @Input() opts: IMyOptions;
    @Input() selectedDate: IMyDate;

    @Output() cellClicked: EventEmitter<IMyMonth> = new EventEmitter<IMyMonth>();
    @Output() update: EventEmitter<any[]> = new EventEmitter<any[]>();
    @Output() change: EventEmitter<IChangeEvent> = new EventEmitter<IChangeEvent>();
    @Output() start: EventEmitter<IChangeEvent> = new EventEmitter<IChangeEvent>();
    @Output() end: EventEmitter<IChangeEvent> = new EventEmitter<IChangeEvent>();

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
    startupLoop: boolean = true;

    constructor(public elem: ElementRef, private renderer: Renderer, private utilService: UtilService) {
        console.log(this.elem.nativeElement);
    }

    ngOnInit() {
        console.log(this.opts);
        console.log(this.selectedDate);
        this.initMonthsInYear();
        // this.onScrollListener = this.renderer.listen(this.elem.nativeElement, "scroll", this.refresh.bind(this));
    }

    ngOnChanges(changes: SimpleChanges) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        this.refresh();
    }

    ngOnDestroy() {
        // Check that listener has been attached properly:
        // It may be undefined in some cases, e.g. if an exception is thrown, the component is
        // not initialized properly but destroy may be called anyways (e.g. in testing).
        if (this.onScrollListener !== undefined) {
            // this removes the listener
            this.onScrollListener();
        }
    }

    refresh(): void {
        // requestAnimationFrame(this.calculateItems.bind(this));
    }

    // Scroll into the specified year
    scrollIntoYear(year: number): void {
        let index: number = (this.years || []).indexOf(year);
        if (index < 0 || index >= (this.years || []).length) { return; }

        let d = this.calculateDimensions();
        this.elem.nativeElement.scrollTop = Math.max(0, (d.itemsPerColumn - 1)) * d.childHeight;
        this.refresh();
    }

    private calculateDimensions(): IDimensions {
        let el: HTMLElement = this.elem.nativeElement;
        let content: Element = el.querySelector(".caltable");

        let years = this.years || []; // safe fallback to zero-length array
        let yearCount = years.length; // number of years in current model
        let viewWidth = el.clientWidth; // width of visible viewport
        let viewHeight = el.clientHeight; // height of visible viewport

        let contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {width: viewWidth, height: viewHeight};
        let childWidth = contentDimensions.width; // width of each row
        let childHeight = contentDimensions.height; // height of each row

        // Number of items in the visible viewport
        let itemsPerColumn = Math.max(1, Math.floor(viewHeight / childHeight));

        return {
            yearCount: yearCount,
            viewWidth: viewWidth,
            viewHeight: viewHeight,
            childWidth: childWidth,
            childHeight: childHeight,
            itemsPerColumn: itemsPerColumn
        }
    }

    private calculateItems(): void {
        let el = this.elem.nativeElement;

        let d = this.calculateDimensions();
        let years = this.years || [];

        // Pre calculate total height of the table (for table transforming and calculation)
        this.scrollHeight = d.childHeight * d.yearCount;
        if (this.elem.nativeElement.scrollTop > this.scrollHeight) {
            this.elem.nativeElement.scrollTop = this.scrollHeight;
        }

        // Calculate item index based on scroll position
        let indexByScrollTop = el.scrollTop / this.scrollHeight * d.yearCount;

        // Calculate end index for last item in the visible viewport
        // Get the smaller value between:
        // 1. Total number of year in the model: d.yearCount, this happens when scroll to bottom end
        // 2. Round up of Current scrolling item index (a.k.a first item in the visible viewport) + no. of items that can be displayed in the visible viewport + 1 (this happends when scroll in the middle)
        let end = Math.min(d.yearCount, Math.ceil(indexByScrollTop) + d.itemsPerColumn + 1);

        // Calculate start index for first item in the visible viewport
        // Get the smaller value between:
        // 1. maxStart: calculation of first item position (end position - total visible items - 1), fallback to 0 (top position of scrolling) if it is negative value
        // 2. Round down of current scrolling item index * no. of visible items in visible viewport
        let maxStart = Math.max(0, end - d.itemsPerColumn - 1);
        let start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerColumn);

        // Calculate top padding (for translating absolute position table)
        // This equals multiply between height of each child item and round up value of first visible item in viewport position
        this.topPadding = d.childHeight * Math.ceil(start);
        if (start !== this.previousStart || end !== this.previousEnd) {
            
        } else if (this.startupLoop) {
            this.startupLoop = false;
            this.refresh();
        }
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

    // Emit event to parent component when a month in a year is selected
    private monthCellClicked(month: IMyMonthMeta, year: number): void {
        this.cellClicked.emit({ monthNbr: month.monthNbr, monthTxt: month.monthTxt, year: year });
    }
}