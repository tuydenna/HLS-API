function Transform() {
    // return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
    return (target: any, propertyKey: string) => {
        console.log("Transform", target, propertyKey);

    }
}
export default class BaseFilterDto {
    @Transform()
    searchKey?: string;
    take: number = 10;
    skip: number = 0;
}