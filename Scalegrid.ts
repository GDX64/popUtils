import { Line, Svg, Polyline, Text } from '@svgdotjs/svg.js';
import { ifElse, range, zip } from 'ramda';

interface CustomScale {
  arrDomain: number[];
  arrImage: number[];
  (arg: number): number;
}

export interface PlotObj {
  name: string;
  polyline: Polyline;
}

function scaleCreator(arrDomain: number[], arrImage: number[]) {
  const size1 = arrDomain[1] - arrDomain[0];
  const size2 = arrImage[1] - arrImage[0];
  const fnScale = (arg: number) => {
    return (size2 / size1) * (arg - arrDomain[0]) + arrImage[0];
  };
  fnScale.arrDomain = arrDomain;
  fnScale.arrImage = arrImage;
  return fnScale as CustomScale;
}

function inverseScale(fnScale: CustomScale) {
  return scaleCreator(fnScale.arrImage, fnScale.arrDomain);
}

function diffScaleCreator(fnScale: CustomScale) {
  const deltaX = fnScale.arrDomain[1] - fnScale.arrDomain[0];
  const deltaY = fnScale.arrImage[1] - fnScale.arrImage[0];

  return scaleCreator([0, deltaX], [0, deltaY]);
}

function xyScaleCreator(fnBaseScale: CustomScale) {
  const fnScaleX = fnBaseScale;
  const fnScaleY = scaleCreator(fnBaseScale.arrDomain, [
    fnBaseScale.arrImage[1],
    fnBaseScale.arrImage[0],
  ]);
  return (arg: [number, number]) => {
    const x = fnScaleX(arg[0]);
    const y = fnScaleY(arg[1]);
    return [x, y];
  };
}

type Pixel = number;

class ScaleGrid {
  xAxis: Line;
  yAxis: Line;
  size: number[];
  center: number[];
  fnScaleX: (x: number) => number;
  fnScaleY: (x: number) => number;
  mapPlots: Map<string, PlotObj>;
  xData: number[];
  yData: number[];
  scaleX: number[];
  scaleY: number[];
  nTicks: number;
  arrTicksLines: Line[];
  arrTicksText: Text[];
  constructor(
    public draw: Svg,
    {
      scaleX = [-5, 5],
      scaleY = [-5, 5],
      stroke = { width: 2, color: 'black' },
      xPadding = 30,
      yPadding = 30,
    }
  ) {
    const size = [draw.cx() * 2, draw.cy() * 2];

    const fnScaleX = scaleCreator(scaleX, [xPadding, size[0] - xPadding]);
    const fnScaleY = scaleCreator(scaleY, [size[1] - yPadding, yPadding]);
    const center = [fnScaleX(0), fnScaleY(0)];

    this.xAxis = draw.line(0, center[1], size[0], center[1]).stroke(stroke);
    this.yAxis = draw.line(center[0], 0, center[0], size[1]).stroke(stroke);

    this.center = center;
    this.size = size;
    this.fnScaleX = fnScaleX;
    this.fnScaleY = fnScaleY;
    this.mapPlots = new Map();
    this.xData = [];
    this.yData = [];
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.draw = draw;
    this.nTicks = 0;
    this.arrTicksLines = [];
    this.arrTicksText = [];
  }

  plot(
    arrX: number[],
    arrY: number[],
    {
      stroke = {
        width: 2,
        color: '#7777ff',
      },
      name = 'plot1',
      fill = '#00000000',
    } = {}
  ) {
    const plotObj = this.mapPlots.get(name);
    const polyline = ifElse(
      (x) => x,
      () => plotObj?.polyline,
      () => this.draw.polyline().fill(fill)
    )(plotObj) as Polyline;
    const args = this._mapData(arrX, arrY);
    polyline.plot(args as any).stroke(stroke);
    this.mapPlots.set(name, { polyline, name });
    return this;
  }

  deletePlot(name: string) {
    const objPlot = this.mapPlots.get(name);
    if (!objPlot) {
      return;
    }
    objPlot.polyline.remove();
    this.mapPlots.delete(name);
  }

  _mapData(arrX: number[], arrY: number[]) {
    this.xData = arrX.map((el) => this.fnScaleX(el));
    this.yData = arrY.map((el) => this.fnScaleY(el));
    const args = zip(this.xData, this.yData);
    return args;
  }

  animatePlot(arrX: number[], arrY: number[], { name = 'plot1' } = {}) {
    const args2 = this._mapData(arrX, arrY);
    const objPlot = this.mapPlots.get(name);
    if (!objPlot) {
      return this;
    }
    objPlot.polyline.animate().plot(args2);
    return this;
  }

  ticksLoop(scale: number[], nTicks: number, fnTicks: (nPosition: Pixel) => void) {
    for (let i = scale[0]; i <= scale[1]; i += 1 / nTicks) {
      const nPosition = i;
      fnTicks(nPosition);
    }
  }

  drawTicks({ nTicks = 1, tickSize = 5, stroke = { width: 2, color: 'white' } }) {
    this.nTicks = nTicks;
    this.arrTicksLines = [];
    const scale = [
      Math.min(this.scaleX[0], this.scaleY[0]),
      Math.max(this.scaleX[1], this.scaleY[1]),
    ];
    this.ticksLoop(scale, nTicks, (nPosition) => {
      if (nPosition === 0) return;
      const linePosX = this.fnScaleX(nPosition) as Pixel;
      const linePosY = this.fnScaleY(nPosition) as Pixel;

      const lineX = this.draw
        .line(linePosX, this.center[1] + tickSize, linePosX, this.center[1] - tickSize)
        .stroke(stroke);

      const lineY = this.draw
        .line(this.center[0] + tickSize, linePosY, this.center[0] - tickSize, linePosY)
        .stroke(stroke);

      this.arrTicksLines.push(lineX, lineY);
    });

    return this;
  }

  drawTicksText(color = '#fff') {
    this.arrTicksText = [];
    const scale = [
      Math.min(this.scaleX[0], this.scaleY[0]),
      Math.max(this.scaleX[1], this.scaleY[1]),
    ];

    this.ticksLoop(scale, this.nTicks, (nPosition) => {
      const linePosX = this.fnScaleX(nPosition);
      const linePosY = this.fnScaleY(nPosition);
      const [xPos, yPos] =
        nPosition === 0 ? [linePosX + 15, this.center[1] + 15] : [linePosX, this.center[1] + 15];
      this.arrTicksText.push(
        this.draw.text(String(nPosition)).center(xPos, yPos).attr({ stroke: color })
      );
      if (nPosition !== 0) {
        this.draw
          .text(String(nPosition))
          .center(this.center[0] + 15, linePosY)
          .attr({ stroke: color });
      }
    });
    return this;
  }

  clearTicks() {
    [...this.arrTicksText, ...this.arrTicksLines].forEach((objSvg) => objSvg.remove());
  }

  addLabel(textX ='x', textY = 'y') {
    const xPos = this.fnScaleX(this.scaleX[1] / 2);
    const yPos = this.fnScaleY(0);
    this.draw
      .text(textX)
      .move(xPos + 290, yPos)
      .attr({ stroke: '#fff' });
    this.draw
      .text(textY)
      .move(xPos - 290, yPos - 200)
      .attr({ stroke: '#fff' });
  }
}

export default ScaleGrid;
export { zip, scaleCreator, range, diffScaleCreator, xyScaleCreator, inverseScale };
export type { CustomScale };
