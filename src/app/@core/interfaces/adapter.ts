export interface adapter<T> {
    adapt(item: any): T
}