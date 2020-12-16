export interface Axes {
    axis: string;
    value: number;
}

export interface Data {
    name: string;
    axes: Axes[];
    color?: string;
}

export interface RadarChartMargin {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

export interface RadarChartLegend {
    title: string;
    translateX: number;
    translateY: number;
}

export interface RadarOptions {
    w?: number;                     // Width of the circle
    h?: number;                     // Height of the circle
    margin?: number | RadarChartMargin;      // The margins of the SVG
    levels: number;                 // How many levels or inner circles should there be drawn
    maxValue: number;               // What is the value that the biggest circle will represent
    labelFactor?: number;           // How much farther than the radius of the outer circle should the labels be placed
    wrapWidth?: number;             // The number of pixels after which a label needs to be given a new line
    opacityArea?: number;           // The opacity of the area of the blob
    dotRadius?: number;             // The size of the colored circles of each blog
    opacityCircles?: number;        // The opacity of the circles of each blob
    strokeWidth?: number;           // The width of the stroke around each blob
    roundStrokes?: boolean;         // If true the area and stroke will follow a round path (cardinal-closed)
    color?: string[];               // Array of color, process will have it own function
    format?: string;                // Format default is .0f (%,...)
    unit?: string;                  // Unit value (ex: $)
    legend?: RadarChartLegend;      // Format: { title: string, translateX: number, translateY: number }
}

export interface SVGRadarOptions {
    selector?: string;
    svgStyle?: string;
    container?: string;
    radius?: number;
}

export type RadarGenerateType = 'svg' | 'html'
export interface RadarGenerateOptions {
    write?: boolean;
    dest?: string;
    fileName?: string;
}

export type RadarChartImage = 'png' | 'jpeg'
export interface RadarImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    dest?: string;
    fileName?: string;
}

export function RadarChart(data: Data[], options: RadarOptions, svgOptions?: SVGRadarOptions): any;
export function generateRadarChart(d3n: any, type?: RadarGenerateType, options?: RadarGenerateOptions): string;
export function generateRadarImage(d3n: any, type?: RadarChartImage, options?: RadarImageOptions): any;