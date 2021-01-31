import { Styler } from 'stylefire/lib/styler/types';
import { Polyline, Svg, ArrayXY } from '@svgdotjs/svg.js';
import * as R from 'ramda';

class TrackableSVG {
  sTrackPath: Polyline;
  arrTrackPath: ArrayXY[];
  constructor(
    public draw: Svg,
    public objSVG: Styler,
    public origin: { ox: number; oy: number },
    public nSmoothFactor = 1,
    public bTracking = false
  ) {
    this.sTrackPath = draw.polyline().fill('#00000000');
    this.arrTrackPath = [];
  }

  startTracking(
    stroke = {
      width: 2,
      color: '#ff5522',
    }
  ) {
    this.arrTrackPath = [];
    this.sTrackPath.plot([]).stroke(stroke);
  }

  set(objPos: { x: number; y: number }, value?: any) {
    if (this.bTracking) {
      this.arrTrackPath.push([objPos.x, objPos.y]);
      this.sTrackPath.plot(
        this.arrTrackPath.map(([x, y]) => [x + this.origin.ox, y + this.origin.oy]) as ArrayXY[]
      );
    }
    return this.objSVG.set(objPos, value);
  }

  get(key: string, forceRead?: boolean) {
    return this.objSVG.get(key, forceRead);
  }

  render(forceRender?: boolean) {
    return this.objSVG.render(forceRender);
  }

  smooth() {
    if (!this.bTracking) return;

    const arrSmoothedX = smooth(
      this.arrTrackPath.map((item) => item[0]),
      this.nSmoothFactor
    );
    const arrSmoothedY = smooth(
      this.arrTrackPath.map((item) => item[1]),
      this.nSmoothFactor
    );

    const arrSmoothedXY = R.zip(arrSmoothedX, arrSmoothedY).map(([x, y]) => [
      x + this.origin.ox,
      y + this.origin.oy,
    ]) as ArrayXY[];
    this.sTrackPath.plot(arrSmoothedXY);
  }

  getCoveredSpace() {
    if (!this.bTracking) return 0;

    let [nLastX, nLastY] = this.arrTrackPath[0];
    return this.arrTrackPath.reduce((acc, [xNow, yNow]) => {
      const absValue = Math.sqrt((xNow - nLastX) ** 2 + (yNow - nLastY) ** 2);
      nLastX = xNow;
      nLastY = yNow;
      return acc + absValue;
    }, 0);
  }
}

function smooth(_arrNumbers: number[], nSmoothFactor: number, bZeroPading = false) {
  const arrNumbers = bZeroPading
    ? _arrNumbers
    : R.repeat(_arrNumbers[0], nSmoothFactor).concat(_arrNumbers);
  return arrNumbers
    .slice(nSmoothFactor)
    .reduce((acc: number[], _nValue: number, _nIndex: number) => {
      const nIndex = _nIndex + nSmoothFactor;
      acc.push(R.sum(arrNumbers.slice(nIndex - nSmoothFactor, nIndex)) / nSmoothFactor);
      return acc;
    }, []);
}

function smoothPair([xNow, yNow] = [0, 0], [_xLast, _yLast] = [0, 0], nSmoothFactor: number) {
  const [xLast, yLast] = [_xLast ?? 0, _yLast ?? 0];
  return [
    xNow * nSmoothFactor + (1 - nSmoothFactor) * xLast,
    yNow * nSmoothFactor + (1 - nSmoothFactor) * yLast,
  ];
}
export default TrackableSVG;
