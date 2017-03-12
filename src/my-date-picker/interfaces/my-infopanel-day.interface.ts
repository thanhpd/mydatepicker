import { IMyDate } from "./my-date.interface";

export interface IMyInfoPanelDay extends IMyDate {
    monthText: string;
    weekDay: string;
}