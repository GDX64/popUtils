import CVector from './CVector';
import { Svg } from '@svgdotjs/svg.js';
import { scaleCreator, CustomScale, xyScaleCreator, diffScaleCreator } from './Scalegrid';

interface ObjBase {
  ox?: number;
  oy?: number;
}

class ScaledVector {
  fnScale: (args: [number, number]) => number[];
  diffScale: CustomScale;
  childVec: CVector;
  x: number;
  y: number;

  constructor(draw: Svg, arrPos: number[], fnScale: CustomScale, objConfig: ObjBase) {
    this.diffScale = diffScaleCreator(fnScale);
    this.fnScale = xyScaleCreator(fnScale);
    [this.x, this.y] = arrPos;

    const [x, y] = arrPos.map((item) => this.diffScale(item));

    this.childVec = new CVector(draw, [x, y], objConfig).updatePos();
  }

  updatePos(x = this.x, y = this.y) {
    const [argX, argY] = [x, y].map((item) => this.diffScale(item));
    this.childVec.updatePos(argX, argY);
    [this.x, this.y] = [x, y];
    return this;
  }
  moveTo(x = this.x, y = this.y) {
    const [argX, argY] = [x, y].map((item) => this.diffScale(item));
    this.childVec.moveTo(argX, -argY);
    return this;
  }
}

export default ScaledVector;

export {};
