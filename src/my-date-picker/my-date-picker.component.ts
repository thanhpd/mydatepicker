import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewEncapsulation, Renderer, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IMyDate, IMyDateRange, IMyMonth, IMyCalendarDay, IMyWeek, IMyDayLabels, IMyMonthLabels, IMyOptions, IMyDateModel, IMyInputAutoFill, IMyInputFieldChanged, IMyCalendarViewChanged, IMyInfoPanelDay } from "./interfaces/index";
import { LocaleService } from "./services/my-date-picker.locale.service";
import { UtilService } from "./services/my-date-picker.util.service";

// webpack1_
declare var require: any;
const myDpStyles: string = require("./my-date-picker.component.css");
const myDpTpl: string = require("./my-date-picker.component.html");
// webpack2_

export const MYDP_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MyDatePicker),
    multi: true
};

@Component({
    selector: "my-date-picker",
    styles: [myDpStyles],
    template: myDpTpl,
    providers: [LocaleService, UtilService, MYDP_VALUE_ACCESSOR],
    encapsulation: ViewEncapsulation.None
})

export class MyDatePicker implements OnChanges, ControlValueAccessor {
    @Input() options: any;
    @Input() locale: string;
    @Input() defaultMonth: string;
    @Input() selDate: string;
    @Input() placeholder: string;
    @Input() selector: number;
    @Output() dateChanged: EventEmitter<IMyDateModel> = new EventEmitter<IMyDateModel>();
    @Output() inputFieldChanged: EventEmitter<IMyInputFieldChanged> = new EventEmitter<IMyInputFieldChanged>();
    @Output() calendarViewChanged: EventEmitter<IMyCalendarViewChanged> = new EventEmitter<IMyCalendarViewChanged>();
    @Output() calendarToggle: EventEmitter<number> = new EventEmitter<number>();

    onChangeCb: (_: any) => void = () => { };
    onTouchedCb: () => void = () => { };

    showSelector: boolean = false;
    visibleMonth: IMyMonth = {monthTxt: "", monthNbr: 0, year: 0};
    selectedMonth: IMyMonth = {monthTxt: "", monthNbr: 0, year: 0};
    selectedDate: IMyDate = {year: 0, month: 0, day: 0};
    weekDays: Array<string> = [];
    dates: Array<IMyWeek> = [];
    selectionDayTxt: string = "";
    invalidDate: boolean = false;
    disableTodayBtn: boolean = false;
    dayIdx: number = 0;
    weekDayOpts: Array<string> = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    autoFillOpts: IMyInputAutoFill = {separator: "", formatParts: [], enabled: true};

    editMonth: boolean = false;
    invalidMonth: boolean = false;
    editYear: boolean = false;
    invalidYear: boolean = false;

    prevMonthDisabled: boolean = false;
    nextMonthDisabled: boolean = false;
    prevYearDisabled: boolean = false;
    nextYearDisabled: boolean = false;

    isYearViewVisible: boolean = false;

    PREV_MONTH: number = 1;
    CURR_MONTH: number = 2;
    NEXT_MONTH: number = 3;

    MIN_YEAR: number = 1000;
    MAX_YEAR: number = 9999;

    // Custom properties for display datetime panel of Material Design
    infoPanelDay: IMyInfoPanelDay = this.utilService.getInfoPanelDay(this.getToday());

    // Default options
    opts: IMyOptions = {
        dayLabels: <IMyDayLabels> {},
        monthLabels: <IMyMonthLabels> {},
        monthFullLabels: <IMyMonthLabels> {},
        dateFormat: <string> "",
        showTodayBtn: <boolean> true,
        todayBtnTxt: <string> "",
        firstDayOfWeek: <string> "",
        sunHighlight: <boolean> true,
        markCurrentDay: <boolean> true,
        disableUntil: <IMyDate> {year: 0, month: 0, day: 0},
        disableSince: <IMyDate> {year: 0, month: 0, day: 0},
        disableDays: <Array<IMyDate>> [],
        enableDays: <Array<IMyDate>> [],
        disableDateRange: <IMyDateRange> {begin: <IMyDate> {year: 0, month: 0, day: 0}, end: <IMyDate> {year: 0, month: 0, day: 0}},
        disableWeekends: <boolean> false,
        showWeekNumbers: <boolean> false,
        height: <string> "34px",
        width: <string> "100%",
        selectionTxtFontSize: <string> "18px",
        inline: <boolean> false,
        showClearDateBtn: <boolean> true,
        alignSelectorRight: <boolean> false,
        openSelectorTopOfInput: <boolean> false,
        indicateInvalidDate: <boolean> true,
        editableDateField: <boolean> true,
        editableMonthAndYear: <boolean> true,
        disableHeaderButtons: <boolean> true,
        minYear: <number> this.MIN_YEAR,
        maxYear: <number> this.MAX_YEAR,
        componentDisabled: <boolean> false,
        inputValueRequired: <boolean> false,
        showSelectorArrow: <boolean> true,
        showInputField: <boolean> true,
        openSelectorOnInputClick: <boolean> false,
        inputAutoFill: <boolean> true
    };

    constructor(public elem: ElementRef, private renderer: Renderer, private localeService: LocaleService, private utilService: UtilService) {
        this.setLocaleOptions();
        renderer.listenGlobal("document", "click", (event: any) => {
            if (this.showSelector && event.target && this.elem.nativeElement !== event.target && !this.elem.nativeElement.contains(event.target)) {
                this.showSelector = false;
                this.isYearViewVisible = false;
                this.calendarToggle.emit(4);
            }
            if (this.opts.editableMonthAndYear && event.target && this.elem.nativeElement.contains(event.target)) {
                this.resetMonthYearEdit();
            }
        });
    }

    setLocaleOptions(): void {
        let opts: IMyOptions = this.localeService.getLocaleOptions(this.locale);
        Object.keys(opts).forEach((k) => {
            (<IMyOptions>this.opts)[k] = opts[k];
        });
    }

    setOptions(): void {
        if (this.options !== undefined) {
            Object.keys(this.options).forEach((k) => {
                (<IMyOptions>this.opts)[k] = this.options[k];
            });
        }
        if (this.opts.minYear < this.MIN_YEAR) {
            this.opts.minYear = this.MIN_YEAR;
        }
        if (this.opts.maxYear > this.MAX_YEAR) {
            this.opts.maxYear = this.MAX_YEAR;
        }

        let separator: string = this.utilService.getDateFormatSeparator(this.opts.dateFormat);
        this.autoFillOpts = {separator: separator, formatParts: this.opts.dateFormat.split(separator), enabled: this.opts.inputAutoFill};
    }

    getComponentWidth(): string {
        if (this.opts.showInputField) {
            return this.opts.width;
        }
        else if (this.selectionDayTxt.length > 0 && this.opts.showClearDateBtn) {
            return "60px";
        }
        else {
            return "30px";
        }
    }

    getSelectorTopPosition(): string {
        if (this.opts.openSelectorTopOfInput) {
            return this.elem.nativeElement.children[0].offsetHeight + "px";
        }
    }

    resetMonthYearEdit(): void {
        this.editMonth = false;
        this.editYear = false;
        this.invalidMonth = false;
        this.invalidYear = false;
    }

    editMonthClicked(event: any): void {
        event.stopPropagation();
        if (this.opts.editableMonthAndYear) {
            this.editMonth = true;
        }
    }

    editYearClicked(event: any): void {
        event.stopPropagation();
        if (this.opts.editableMonthAndYear) {
            this.editYear = true;
        }
    }

    userDateInput(event: any): void {
        this.invalidDate = false;
        if (event.target.value.length === 0) {
            this.clearDate();
        }
        else {
            let date: IMyDate = this.utilService.isDateValid(event.target.value, this.opts.dateFormat, this.opts.minYear, this.opts.maxYear, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableDays, this.opts.disableDateRange, this.opts.monthLabels, this.opts.enableDays);
            if (date.day !== 0 && date.month !== 0 && date.year !== 0) {
                this.selectDate(date);
            }
            else {
                this.invalidDate = true;
            }
        }
        if (this.invalidDate) {
            this.inputFieldChanged.emit({value: event.target.value, dateFormat: this.opts.dateFormat, valid: !(event.target.value.length === 0 || this.invalidDate)});
            this.onChangeCb("");
            this.onTouchedCb();
        }
    }

    lostFocusInput(event: any): void {
        this.selectionDayTxt = event.target.value;
        this.onTouchedCb();
    }

    userMonthInput(event: any): void {
        if (event.keyCode === 13 || event.keyCode === 37 || event.keyCode === 39) {
            return;
        }

        this.invalidMonth = false;

        let m: number = this.utilService.isMonthLabelValid(event.target.value, this.opts.monthLabels);
        if (m !== -1) {
            this.editMonth = false;
            if (m !== this.visibleMonth.monthNbr) {
                this.visibleMonth = {monthTxt: this.monthFullText(m), monthNbr: m, year: this.visibleMonth.year};
                this.generateCalendar(m, this.visibleMonth.year, true);
            }
        }
        else {
            this.invalidMonth = true;
        }
    }

    userYearInput(event: any): void {
        if (event.keyCode === 13 || event.keyCode === 37 || event.keyCode === 39) {
            return;
        }

        this.invalidYear = false;

        let y: number = this.utilService.isYearLabelValid(Number(event.target.value), this.opts.minYear, this.opts.maxYear);
        if (y !== -1) {
            this.editYear = false;
            if (y !== this.visibleMonth.year) {
                this.visibleMonth = {monthTxt: this.visibleMonth.monthTxt, monthNbr: this.visibleMonth.monthNbr, year: y};
                this.generateCalendar(this.visibleMonth.monthNbr, y, true);
            }
        }
        else {
            this.invalidYear = true;
        }
    }

    isTodayDisabled(): void {
        this.disableTodayBtn = this.utilService.isDisabledDay(this.getToday(), this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableDays, this.opts.disableDateRange, this.opts.enableDays);
    }

    parseOptions(): void {
        if (this.locale) {
            this.setLocaleOptions();
        }
        this.setOptions();
        this.isTodayDisabled();
        this.dayIdx = this.weekDayOpts.indexOf(this.opts.firstDayOfWeek);
        if (this.dayIdx !== -1) {
            let idx: number = this.dayIdx;
            for (let i = 0; i < this.weekDayOpts.length; i++) {
                this.weekDays.push(this.opts.dayLabels[this.weekDayOpts[idx]]);
                idx = this.weekDayOpts[idx] === "sa" ? 0 : idx + 1;
            }
        }
    }

    writeValue(value: Object): void {
        if (value && value["date"]) {
            this.updateDateValue(this.parseSelectedDate(value["date"]), false);
        }
        else if (value === "") {
            this.updateDateValue({year: 0, month: 0, day: 0}, true);
        }
    }

    registerOnChange(fn: any): void {
        this.onChangeCb = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCb = fn;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("selector") && changes["selector"].currentValue > 0) {
            this.openBtnClicked();
        }

        if (changes.hasOwnProperty("placeholder")) {
            this.placeholder = changes["placeholder"].currentValue;
        }

        if (changes.hasOwnProperty("locale")) {
            this.locale = changes["locale"].currentValue;
        }

        if (changes.hasOwnProperty("options")) {
            this.options = changes["options"].currentValue;
        }

        this.weekDays.length = 0;
        this.parseOptions();

        if (changes.hasOwnProperty("defaultMonth")) {
            let dm: string = changes["defaultMonth"].currentValue;
            if (dm !== null && dm !== undefined && dm !== "") {
                this.selectedMonth = this.parseSelectedMonth(dm);
            }
            else {
                this.selectedMonth = {monthTxt: "", monthNbr: 0, year: 0};
            }
        }

        if (changes.hasOwnProperty("selDate")) {
            let sd: any = changes["selDate"];
            if (sd.currentValue !== null && sd.currentValue !== undefined && sd.currentValue !== "" && Object.keys(sd.currentValue).length !== 0) {
                this.selectedDate = this.parseSelectedDate(sd.currentValue);
                setTimeout(() => {
                    this.onChangeCb(this.getDateModel(this.selectedDate));
                });
            }
            else {
                // Do not clear on init
                if (!sd.isFirstChange()) {
                    this.clearDate();
                }
            }
        }
        if (this.opts.inline) {
            this.setVisibleMonth();
        }
        else if (this.showSelector) {
            this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, false);
        }
    }

    removeBtnClicked(): void {
        // Remove date button clicked
        this.clearDate();
        if (this.showSelector) {
            this.calendarToggle.emit(3);
        }
        this.showSelector = false;
        this.isYearViewVisible = false;
    }

    openBtnClicked(): void {
        this.infoPanelDay = (this.selectionDayTxt && !this.invalidDate) ? this.utilService.getInfoPanelDay(this.selectedDate) : this.utilService.getInfoPanelDay(this.getToday());
        // Open selector button clicked
        this.showSelector = !this.showSelector;
        if (this.showSelector) {
            this.setVisibleMonth();
            this.calendarToggle.emit(1);
        }
        else {
            this.calendarToggle.emit(3);
        }
    }

    setVisibleMonth(): void {
        // Sets visible month of calendar
        let y: number = 0, m: number = 0;
        if (!this.utilService.isInitializedDate(this.selectedDate)) {
            if (this.selectedMonth.year === 0 && this.selectedMonth.monthNbr === 0) {
                let today: IMyDate = this.getToday();
                y = today.year;
                m = today.month;
            } else {
                y = this.selectedMonth.year;
                m = this.selectedMonth.monthNbr;
            }
        }
        else {
            y = this.selectedDate.year;
            m = this.selectedDate.month;
        }
        this.visibleMonth = {monthTxt: this.opts.monthFullLabels[m], monthNbr: m, year: y};

        // Create current month
        this.generateCalendar(m, y, true);
    }

    prevMonth(): void {
        // Previous month from calendar
        let d: Date = this.getDate(this.visibleMonth.year, this.visibleMonth.monthNbr, 1);
        d.setMonth(d.getMonth() - 1);

        let y: number = d.getFullYear();
        let m: number = d.getMonth() + 1;

        this.visibleMonth = {monthTxt: this.monthFullText(m), monthNbr: m, year: y};
        this.generateCalendar(m, y, true);
    }

    nextMonth(): void {
        // Next month from calendar
        let d: Date = this.getDate(this.visibleMonth.year, this.visibleMonth.monthNbr, 1);
        d.setMonth(d.getMonth() + 1);

        let y: number = d.getFullYear();
        let m: number = d.getMonth() + 1;

        this.visibleMonth = {monthTxt: this.monthFullText(m), monthNbr: m, year: y};
        this.generateCalendar(m, y, true);
    }

    prevYear(): void {
        // Previous year from calendar
        this.visibleMonth.year--;
        this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, true);
    }

    nextYear(): void {
        // Next year from calendar
        this.visibleMonth.year++;
        this.generateCalendar(this.visibleMonth.monthNbr, this.visibleMonth.year, true);
    }

    todayClicked(): void {
        // Today button clicked
        let today: IMyDate = this.getToday();
        this.selectDate(today);
        if (this.opts.inline && today.year !== this.visibleMonth.year || today.month !== this.visibleMonth.monthNbr) {
            this.visibleMonth = {monthTxt: this.opts.monthFullLabels[today.month], monthNbr: today.month, year: today.year};
            this.generateCalendar(today.month, today.year, true);
        }
    }

    cellClicked(cell: any): void {
        // Cell clicked on the calendar
        if (cell.cmo === this.PREV_MONTH) {
            // Previous month day
            this.prevMonth();
        }
        else if (cell.cmo === this.CURR_MONTH) {
            // Current month day - if date is already selected clear it
            if (cell.dateObj.year === this.selectedDate.year && cell.dateObj.month === this.selectedDate.month && cell.dateObj.day === this.selectedDate.day) {
                this.clearDate();
            }
            else {
                this.selectDate(cell.dateObj);
            }
        }
        else if (cell.cmo === this.NEXT_MONTH) {
            // Next month day
            this.nextMonth();
        }
        this.resetMonthYearEdit();
    }

    cellKeyDown(event: any, cell: any) {
        // Cell keyboard handling
        if ((event.keyCode === 13 || event.keyCode === 32) && !cell.disabled) {
            event.preventDefault();
            this.cellClicked(cell);
        }
    }

    clearDate(): void {
        // Clears the date and notifies parent using callbacks and value accessor
        let date: IMyDate = {year: 0, month: 0, day: 0};
        this.dateChanged.emit({date: date, jsdate: null, formatted: "", epoc: 0});
        this.onChangeCb("");
        this.onTouchedCb();
        this.updateDateValue(date, true);
    }

    selectDate(date: IMyDate): void {
        // Date selected, notifies parent using callbacks and value accessor
        let dateModel: IMyDateModel = this.getDateModel(date);
        this.dateChanged.emit(dateModel);
        this.onChangeCb(dateModel);
        this.onTouchedCb();
        this.updateDateValue(date, false);
        if (this.showSelector) {
            this.calendarToggle.emit(2);
        }
        this.showSelector = false;
        this.isYearViewVisible = false;
    }

    updateDateValue(date: IMyDate, clear: boolean): void {
        // Updates date values
        this.selectedDate = date;
        this.selectionDayTxt = clear ? "" : this.formatDate(date);
        this.inputFieldChanged.emit({value: this.selectionDayTxt, dateFormat: this.opts.dateFormat, valid: !clear});
        this.invalidDate = false;
    }

    getDateModel(date: IMyDate): IMyDateModel {
        // Creates a date model object from the given parameter
        return {date: date, jsdate: this.getDate(date.year, date.month, date.day), formatted: this.formatDate(date), epoc: Math.round(this.getTimeInMilliseconds(date) / 1000.0)};
    }

    preZero(val: string): string {
        // Prepend zero if smaller than 10
        return parseInt(val) < 10 ? "0" + val : val;
    }

    formatDate(val: any): string {
        // Returns formatted date string, if mmm is part of dateFormat returns month as a string
        let formatted: string = this.opts.dateFormat.replace("yyyy", val.year).replace("dd", this.preZero(val.day));
        return this.opts.dateFormat.indexOf("mmm") !== -1 ? formatted.replace("mmm", this.monthText(val.month)) : formatted.replace("mm", this.preZero(val.month));
    }

    monthText(m: number): string {
        // Returns month as a text
        return this.opts.monthLabels[m];
    }

    monthFullText(m: number): string {
        // Returns month as a text
        return this.opts.monthFullLabels[m];
    }

    monthStartIdx(y: number, m: number): number {
        // Month start index
        let d = new Date();
        d.setDate(1);
        d.setMonth(m - 1);
        d.setFullYear(y);
        let idx = d.getDay() + this.sundayIdx();
        return idx >= 7 ? idx - 7 : idx;
    }

    daysInMonth(m: number, y: number): number {
        // Return number of days of current month
        return new Date(y, m, 0).getDate();
    }

    daysInPrevMonth(m: number, y: number): number {
        // Return number of days of the previous month
        let d: Date = this.getDate(y, m, 1);
        d.setMonth(d.getMonth() - 1);
        return this.daysInMonth(d.getMonth() + 1, d.getFullYear());
    }

    isCurrDay(d: number, m: number, y: number, cmo: number, today: IMyDate): boolean {
        // Check is a given date the today
        return d === today.day && m === today.month && y === today.year && cmo === this.CURR_MONTH;
    }

    getToday(): IMyDate {
        let date: Date = new Date();
        return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()};
    }

    getTimeInMilliseconds(date: IMyDate): number {
        return this.getDate(date.year, date.month, date.day).getTime();
    }

    getDayNumber(date: IMyDate): number {
        // Get day number: su=0, mo=1, tu=2, we=3 ...
        let d: Date = this.getDate(date.year, date.month, date.day);
        return d.getDay();
    }

    getWeekday(date: IMyDate): string {
        // Get weekday: su, mo, tu, we ...
        return this.weekDayOpts[this.getDayNumber(date)];
    }

    getDate(year: number, month: number, day: number): Date {
        // Creates a date object from given year, month and day
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    sundayIdx(): number {
        // Index of Sunday day
        return this.dayIdx > 0 ? 7 - this.dayIdx : 0;
    }

    generateCalendar(m: number, y: number, notifyChange: boolean): void {
        this.dates.length = 0;
        let today: IMyDate = this.getToday();
        let monthStart: number = this.monthStartIdx(y, m);
        let dInThisM: number = this.daysInMonth(m, y);
        let dInPrevM: number = this.daysInPrevMonth(m, y);

        let dayNbr: number = 1;
        let cmo: number = this.PREV_MONTH;
        for (let i = 1; i < 7; i++) {
            let week: Array<IMyCalendarDay> = [];
            if (i === 1) {
                // First week
                let pm = dInPrevM - monthStart + 1;
                // Previous month
                for (let j = pm; j <= dInPrevM; j++) {
                    let date: IMyDate = {year: y, month: m - 1, day: j};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(j, m, y, cmo, today), dayNbr: this.getDayNumber(date), disabled: this.utilService.isDisabledDay(date, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableDays, this.opts.disableDateRange, this.opts.enableDays)});
                }

                cmo = this.CURR_MONTH;
                // Current month
                let daysLeft: number = 7 - week.length;
                for (let j = 0; j < daysLeft; j++) {
                    let date: IMyDate = {year: y, month: m, day: dayNbr};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo, today), dayNbr: this.getDayNumber(date), disabled: this.utilService.isDisabledDay(date, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableDays, this.opts.disableDateRange, this.opts.enableDays)});
                    dayNbr++;
                }
            }
            else {
                // Rest of the weeks
                for (let j = 1; j < 8; j++) {
                    if (dayNbr > dInThisM) {
                        // Next month
                        dayNbr = 1;
                        cmo = this.NEXT_MONTH;
                    }
                    let date: IMyDate = {year: y, month: cmo === this.CURR_MONTH ? m : m + 1, day: dayNbr};
                    week.push({dateObj: date, cmo: cmo, currDay: this.isCurrDay(dayNbr, m, y, cmo, today), dayNbr: this.getDayNumber(date), disabled: this.utilService.isDisabledDay(date, this.opts.disableUntil, this.opts.disableSince, this.opts.disableWeekends, this.opts.disableDays, this.opts.disableDateRange, this.opts.enableDays)});
                    dayNbr++;
                }
            }
            let weekNbr: number = this.opts.showWeekNumbers  && this.opts.firstDayOfWeek === "mo" ? this.utilService.getWeekNumber(week[0].dateObj) : 0;
            this.dates.push({week: week, weekNbr: weekNbr});
        }

        this.setHeaderBtnDisabledState(m, y);

        if (notifyChange) {
            // Notify parent            
            this.calendarViewChanged.emit({year: y, month: m, first: {number: 1, weekday: this.getWeekday({year: y, month: m, day: 1})}, last: {number: dInThisM, weekday: this.getWeekday({year: y, month: m, day: dInThisM})}});
        }
    }

    parseSelectedDate(selDate: any): IMyDate {
        // Parse selDate value - it can be string or IMyDate object
        let date: IMyDate = {day: 0, month: 0, year: 0};
        if (typeof selDate === "string") {
            let sd: string = <string>selDate;
            date.day = this.utilService.parseDatePartNumber(this.opts.dateFormat, sd, "dd");

            date.month = this.opts.dateFormat.indexOf("mmm") !== -1
                ? this.utilService.parseDatePartMonthName(this.opts.dateFormat, sd, "mmm", this.opts.monthLabels)
                : this.utilService.parseDatePartNumber(this.opts.dateFormat, sd, "mm");

            date.year = this.utilService.parseDatePartNumber(this.opts.dateFormat, sd, "yyyy");
        }
        else if (typeof selDate === "object") {
            date = selDate;
        }
        this.selectionDayTxt = this.formatDate(date);
        return date;
    }

    parseSelectedMonth(ms: string): IMyMonth {
        return this.utilService.parseDefaultMonth(ms);
    }

    handleInputClick(event: MouseEvent): void {
        if (!this.opts.editableDateField && this.opts.openSelectorOnInputClick) {
            event.preventDefault();
            this.openBtnClicked();
        }
    }

    setHeaderBtnDisabledState(m: number, y: number): void {
        let dpm: boolean = false;
        let dpy: boolean = false;
        let dnm: boolean = false;
        let dny: boolean = false;
        if (this.opts.disableHeaderButtons) {
            dpm = this.utilService.isMonthDisabledByDisableUntil({year: m === 1 ? y - 1 : y, month: m === 1 ? 12 : m - 1, day: this.daysInMonth(m === 1 ? 12 : m - 1, m === 1 ? y - 1 : y)}, this.opts.disableUntil);
            dpy = this.utilService.isMonthDisabledByDisableUntil({year: y - 1, month: m, day: this.daysInMonth(m, y - 1)}, this.opts.disableUntil);
            dnm = this.utilService.isMonthDisabledByDisableSince({year: m === 12 ? y + 1 : y, month: m === 12 ? 1 : m + 1, day: 1}, this.opts.disableSince);
            dny = this.utilService.isMonthDisabledByDisableSince({year: y + 1, month: m, day: 1}, this.opts.disableSince);
        }
        this.prevMonthDisabled = m === 1 && y === this.opts.minYear || dpm;
        this.prevYearDisabled = y - 1 < this.opts.minYear || dpy;
        this.nextMonthDisabled = m === 12 && y === this.opts.maxYear || dnm;
        this.nextYearDisabled = y + 1 > this.opts.maxYear || dny;
    }

    openSelectYearMonth(event: any): void {
        this.isYearViewVisible = !this.isYearViewVisible;
        console.log(event);
    }
}
