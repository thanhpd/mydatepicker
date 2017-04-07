import { Component, Input, Output, OnInit, OnChanges, OnDestroy, EventEmitter, ElementRef, ViewEncapsulation, Renderer, SimpleChanges } from "@angular/core";
import { IMyDate, IMyMonth, IMyOptions, IMyMonthMeta, IChangeEvent, IDimensions } from "../interfaces/index";
import { UtilService } from "../services/my-date-picker.util.service";

// webpack1_
declare var require: any;
const myYpTpl: string = require("./my-year-picker.childcomponent.html");

@Component({
    selector: "yearpicker",
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
    scrollYears: Array<number> = [];
    today: IMyDate = this.utilService.getToday();

    // Properties for virtual scrolling of year view
    yearWrapperElem: HTMLElement;
    onScrollListener: Function;
    topPadding: number;
    scrollHeight: number;
    previousStart: number;
    previousEnd: number;
    startupLoop: boolean = true;

    constructor(public elem: ElementRef, private renderer: Renderer, private utilService: UtilService) { }

    ngOnInit() {
        this.initMonthsInYear();
        this.onScrollListener = this.renderer.listen(this.elem.nativeElement, "scroll", this.refresh.bind(this));
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
        requestAnimationFrame(this.calculateItems.bind(this));
    }

    // Scroll into the specified year
    scrollIntoYear(year: number): void {
        let index: number = (this.years || []).indexOf(year);
        if (index < 0 || index >= (this.years || []).length) { return; }

        let d = this.calculateDimensions();
        this.elem.nativeElement.scrollTop = index * d.childHeight;
        this.refresh();
    }

    private calculateDimensions(): IDimensions {
        let el: HTMLElement = this.elem.nativeElement;
        let content: Element = el.querySelector(".caltable");

        let viewWidth = el.clientWidth; // width of visible viewport
        let viewHeight = el.clientHeight; // height of visible viewport

        let contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : { width: viewWidth, height: viewHeight };
        let childWidth = contentDimensions.width; // width of each row
        let childHeight = contentDimensions.height; // height of each row

        // Number of items in the visible viewport
        let itemsPerColumn = Math.max(1, Math.floor(viewHeight / childHeight));

        if (!(this.years || []).length) {
            this.createYearCalendar();
        }
        let years = this.years || []; // safe fallback to zero-length array
        let yearCount = years.length; // number of years in current model

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
        console.log(`scrollTop: ${el.scrollTop}`);
        console.log(`indexByScrollTop: ${indexByScrollTop}`);

        // Start and end index for this version was calculated to be redundant, meaning there are some items that will be populated but won't be visible in the viewport.
        // However, this action helps to avoid display blank row in year selection

        // Calculate end index for last item in the visible viewport
        // Get the smaller value between:
        // 1. Total number of year in the model: d.yearCount, this happens when scroll to bottom end
        // 2. Round up of Current scrolling item index (a.k.a first item in the visible viewport) + 2 x no. of items that can be displayed in the visible viewport (this happends when scroll in the middle)
        let end = Math.min(d.yearCount, Math.ceil(indexByScrollTop) + 2 * d.itemsPerColumn);
        console.log(`end = ${end}, d.yearCount = ${d.yearCount}, Math.ceil(indexByScrollTop) + 2 * d.itemsPerColumn = ${Math.ceil(indexByScrollTop) + 2 * d.itemsPerColumn}`);

        // Calculate start index for first item in the visible viewport
        // Get the smaller value between:
        // 1. maxStart: calculation of first item position (end position - total visible items - 1), fallback to 0 (top position of scrolling) if it is negative value
        // 2. Round down of current scrolling item index * no. of visible items in visible viewport
        let maxStart = Math.max(0, end - 3 * d.itemsPerColumn);
        let start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerColumn);
        console.log(`start = ${start}, maxStart = ${maxStart}, Math.floor(indexByScrollTop) * d.itemsPerColumn = ${Math.floor(indexByScrollTop) * d.itemsPerColumn}`);

        // Calculate top padding (for translating absolute position table)
        // This equals multiply between height of each child item and round up value of first visible item in viewport position
        this.topPadding = d.childHeight * Math.ceil(start);
        if (start !== this.previousStart || end !== this.previousEnd) {
            this.scrollYears = years.slice(start, end);

            if (start !== this.previousStart && !this.startupLoop) {
                // start event
                console.log("Start event");
                console.log(`start: ${start}, end: ${end}`);
                if (start === 0) {
                    this.addNewRows(4, false);
                }
            }

            if (end !== this.previousEnd && !this.startupLoop) {
                // end event
                console.log("End event");
                console.log(`start: ${start}, end: ${end}`);
                if (end === this.years.length) {
                    this.addNewRows();
                }
            }

            this.previousStart = start;
            this.previousEnd = end;

            if (this.startupLoop) {
                this.refresh();
            } else {
                // change event
                console.log("Change event");
                console.log(`start: ${start}, end: ${end}`);
            }
        } else if (this.startupLoop) {
            this.startupLoop = false;
            this.refresh();
        }
    }

    private initMonthsInYear(): void {
        if (this.monthsInYear.length === 0) {
            // let y = this.selectedDate.year ? this.selectedDate.year : this.utilService.getToday().year;
            for (let i = 1; i <= 12; i++) {
                let month: IMyMonthMeta = { monthNbr: i, monthTxt: this.opts.monthLabels[i] };
                this.monthsInYear.push(month);
            }
            // this.createYearCalendar(y);
        }
        else {
            this.monthsInYear.forEach((month, index) => {
                month.monthTxt = this.opts.monthLabels[index + 1];
            });
        }
    }

    private createYearCalendar(itemsPerColumn: number = 4): void {
        let pivotYear = this.selectedDate.year ? this.selectedDate.year : this.utilService.getToday().year;
        // Clear existing year calendar
        this.years = [];

        // Create next 5 yearrows
        for (let i = pivotYear - itemsPerColumn; i <= pivotYear + 2 * itemsPerColumn; i++) {
            this.years.push(pivotYear + i);
        }
        this.scrollIntoYear(pivotYear);
    }

    private addNewRows(itemsPerColumn: number = 4, isEnd: boolean = true): void {
        let years = this.years || [];
        let yearCount = years.length;

        if (isEnd) {
            let endYear = years[yearCount - 1];
            for (let i = 1; i <= itemsPerColumn; i++) {
                this.years.push(endYear + i);
            }
        } else {
            let firstYear = years[0];
            for (let i = 1; i <= itemsPerColumn; i++) {
                this.years.unshift(firstYear - i);
            }
        }
    }

    // Emit event to parent component when a month in a year is selected
    private monthCellClicked(month: IMyMonthMeta, year: number): void {
        this.cellClicked.emit({ monthNbr: month.monthNbr, monthTxt: month.monthTxt, year: year });
    }
}