import { IMyMonth } from './my-month.interface';

export interface IMyYear {
    year: number;
    months: Array<IMyMonth>;
}